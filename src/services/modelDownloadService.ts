import * as FileSystem from 'expo-file-system/legacy';
import db from '../database/init';

export interface Model {
  id: string;
  name: string;
  localPath: string | null;
  remoteUrl: string;
  size: string;
  status: 'not-downloaded' | 'downloading' | 'downloaded' | 'error';
  isDefault: boolean;
}

const PRESET_MODELS: Model[] = [
  {
    id: 'qwen-2.5-1.5b-q4',
    name: 'Qwen 2.5 (1.5B) - Q4 (Recommended)',
    localPath: null,
    remoteUrl: 'https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q4_k_m.gguf',
    size: '1.1 GB',
    status: 'not-downloaded',
    isDefault: true,
  },
  {
    id: 'llama-3.2-1b-q4',
    name: 'Llama 3.2 (1B) - Q4 (Fast)',
    localPath: null,
    remoteUrl: 'https://huggingface.co/lmstudio-community/Llama-3.2-1B-Instruct-GGUF/resolve/main/Llama-3.2-1B-Instruct-Q4_K_M.gguf',
    size: '800 MB',
    status: 'not-downloaded',
    isDefault: false,
  },
];

const ACTIVE_MODEL_KEY = 'active_model_id';

async function ensureSeededModels(): Promise<void> {
  const allowedIds = PRESET_MODELS.map((m) => m.id);
  await db.runAsync(
    `DELETE FROM models
     WHERE id NOT IN (${allowedIds.map(() => '?').join(',')})`,
    allowedIds
  );

  // Remove stale legacy entries (for example old ollama rows) that cannot be downloaded
  // and are not backed by a local model file.
  await db.runAsync(
    `DELETE FROM models
     WHERE (remoteUrl IS NULL OR remoteUrl = '')
       AND (localPath IS NULL OR localPath = '')`
  );

  for (const model of PRESET_MODELS) {
    await db.runAsync(
      `INSERT OR IGNORE INTO models (id, name, remoteUrl, size, status, isDefault)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [model.id, model.name, model.remoteUrl, model.size, model.status, model.isDefault ? 1 : 0]
    );

    // Keep seeded models up to date after app updates.
    await db.runAsync(
      `UPDATE models
       SET name = ?, remoteUrl = ?, size = ?, isDefault = ?
       WHERE id = ?`,
      [model.name, model.remoteUrl, model.size, model.isDefault ? 1 : 0, model.id]
    );
  }
}

async function getDownloadedModelsInternal(): Promise<Model[]> {
  await ensureSeededModels();
  return db.getAllAsync<Model>(
    'SELECT * FROM models WHERE status = "downloaded" AND localPath IS NOT NULL ORDER BY isDefault DESC, createdAt ASC'
  );
}

async function pickFallbackActiveModelId(): Promise<string | null> {
  const downloaded = await getDownloadedModelsInternal();
  if (downloaded.length === 0) return null;

  const preferred = downloaded.find((model) => !!model.isDefault);
  return (preferred || downloaded[0]).id;
}

export const hasDownloadedModel = async (): Promise<boolean> => {
  await ensureSeededModels();
  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM models WHERE status = "downloaded" AND localPath IS NOT NULL'
  );
  return (result?.count || 0) > 0;
};

export const getModels = async (): Promise<Model[]> => {
  await ensureSeededModels();
  const models = await db.getAllAsync<Model>(
    `SELECT * FROM models
     WHERE (remoteUrl IS NOT NULL AND remoteUrl != '')
        OR (status = 'downloaded' AND localPath IS NOT NULL AND localPath != '')
     ORDER BY isDefault DESC, createdAt ASC`
  );
  return models;
};

export const getActiveModel = async (): Promise<Model | null> => {
  await ensureSeededModels();

  const activeRow = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM app_meta WHERE key = ?',
    [ACTIVE_MODEL_KEY]
  );

  if (activeRow?.value) {
    const byId = await db.getFirstAsync<Model>(
      'SELECT * FROM models WHERE id = ? AND status = "downloaded" AND localPath IS NOT NULL',
      [activeRow.value]
    );
    if (byId) return byId;
  }

  const fallbackId = await pickFallbackActiveModelId();
  if (!fallbackId) {
    await db.runAsync('DELETE FROM app_meta WHERE key = ?', [ACTIVE_MODEL_KEY]);
    return null;
  }

  await db.runAsync(
    'INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?)',
    [ACTIVE_MODEL_KEY, fallbackId]
  );

  return db.getFirstAsync<Model>('SELECT * FROM models WHERE id = ?', [fallbackId]);
};

export const getActiveModelPath = async (): Promise<string | null> => {
  const model = await getActiveModel();
  return model?.localPath || null;
};

export const setActiveModel = async (modelId: string): Promise<Model> => {
  await ensureSeededModels();
  const model = await db.getFirstAsync<Model>(
    'SELECT * FROM models WHERE id = ? AND status = "downloaded" AND localPath IS NOT NULL',
    [modelId]
  );

  if (!model) {
    throw new Error('Model must be downloaded before setting active.');
  }

  await db.runAsync(
    'INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?)',
    [ACTIVE_MODEL_KEY, modelId]
  );

  return model;
};

export const downloadModel = async (modelId: string, onProgress: (p: number) => void): Promise<string> => {
  await ensureSeededModels();
  let model = await db.getFirstAsync<Model>('SELECT * FROM models WHERE id = ?', [modelId]);
  if (!model) throw new Error('Model not found');

  // Self-heal stale local DB rows by restoring preset URL metadata.
  if (!model.remoteUrl) {
    const preset = PRESET_MODELS.find((m) => m.id === modelId);
    if (preset?.remoteUrl) {
      await db.runAsync(
        'UPDATE models SET remoteUrl = ?, name = ?, size = ? WHERE id = ?',
        [preset.remoteUrl, preset.name, preset.size, modelId]
      );
      model = await db.getFirstAsync<Model>('SELECT * FROM models WHERE id = ?', [modelId]);
    }
  }

  if (!model?.remoteUrl) {
    throw new Error('Model URL is missing. Refresh model list or reinstall app data once.');
  }
  const baseDir = (FileSystem as any).documentDirectory as string | null;
  if (!baseDir) throw new Error('Device storage is not accessible');

  const filename = `${model.id}.gguf`;
  const fileUri = `${baseDir}${filename}`;

  // Clean up any partial/corrupt file from a previous failed attempt
  try {
    const info = await FileSystem.getInfoAsync(fileUri);
    if (info.exists) {
      await FileSystem.deleteAsync(fileUri, { idempotent: true });
    }
  } catch {
    // Ignore — file may not exist
  }

  await db.runAsync('UPDATE models SET status = ? WHERE id = ?', ['downloading', modelId]);

  try {
    onProgress(0);

    // Use createDownloadResumable for real-time progress on large model files.
    // IMPORTANT: We never call savable() or pass resumeData to avoid the
    // Android/Kotlin "Cannot convert 'null' to a Kotlin type" crash.
    const downloadResumable = FileSystem.createDownloadResumable(
      model.remoteUrl,
      fileUri,
      { md5: false },
      (downloadProgress) => {
        if (downloadProgress.totalBytesExpectedToWrite > 0) {
          const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
          onProgress(Math.min(progress, 0.99)); // Reserve 1.0 for verification
        }
      }
    );

    const downloadResult = await downloadResumable.downloadAsync();

    // Verify the downloaded file exists and has content
    if (downloadResult && downloadResult.uri) {
      const fileInfo = await FileSystem.getInfoAsync(downloadResult.uri);
      if (!fileInfo.exists) {
        throw new Error('Download completed but file not found on disk.');
      }

      onProgress(1);

      await db.runAsync(
        'UPDATE models SET status = ?, localPath = ? WHERE id = ?',
        ['downloaded', downloadResult.uri, modelId]
      );
      await setActiveModel(modelId);
      return downloadResult.uri;
    }
    throw new Error('Download failed: No result returned from device.');
  } catch (e) {
    // Clean up partial file on failure
    try {
      await FileSystem.deleteAsync(fileUri, { idempotent: true });
    } catch {
      // Ignore cleanup errors
    }
    await db.runAsync('UPDATE models SET status = ? WHERE id = ?', ['error', modelId]);
    console.error('Download error details:', e);
    throw e;
  }
};

export const deleteModelFile = async (modelId: string): Promise<void> => {
  await ensureSeededModels();
  const model = await db.getFirstAsync<Model>('SELECT * FROM models WHERE id = ?', [modelId]);
  if (model && model.localPath) {
    await FileSystem.deleteAsync(model.localPath, { idempotent: true });
    await db.runAsync('UPDATE models SET status = ?, localPath = NULL WHERE id = ?', ['not-downloaded', modelId]);
  }

  const active = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM app_meta WHERE key = ?',
    [ACTIVE_MODEL_KEY]
  );

  if (active?.value === modelId) {
    const fallbackId = await pickFallbackActiveModelId();
    if (fallbackId) {
      await db.runAsync(
        'INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?)',
        [ACTIVE_MODEL_KEY, fallbackId]
      );
    } else {
      await db.runAsync('DELETE FROM app_meta WHERE key = ?', [ACTIVE_MODEL_KEY]);
    }
  }
};
