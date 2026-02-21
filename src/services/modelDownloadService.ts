import * as FileSystem from 'expo-file-system/legacy';
import db from '../database/init';

export interface Model {
  id: string;
  name: string;
  localPath: string | null;
  remoteUrl: string;
  size: string;
  status: 'not-downloaded' | 'downloading' | 'downloaded' | 'error' | 'ollama';
  isDefault: boolean;
  type?: 'gguf' | 'ollama';
  ollamaModel?: string;
}

export type ModelType = 'gguf' | 'ollama';

const PRESET_MODELS: Model[] = [
  {
    id: 'llama-3.2-1b-q8',
    name: 'Llama 3.2 (1B) - Q8',
    localPath: null,
    remoteUrl: 'https://huggingface.co/hugging-quants/Llama-3.2-1B-Instruct-Q8_0-GGUF/resolve/main/Llama-3.2-1B-Instruct-Q8_0.gguf',
    size: '1.3 GB',
    status: 'not-downloaded',
    isDefault: false,
    type: 'gguf',
  },
  {
    id: 'qwen-2.5-1.5b-q4',
    name: 'Qwen 2.5 (1.5B) - Q4',
    localPath: null,
    remoteUrl: 'https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q4_k_m.gguf',
    size: '1.1 GB',
    status: 'not-downloaded',
    isDefault: true,
    type: 'gguf',
  },
  {
    id: 'ollama-qwen-1.5b',
    name: 'Ollama: Qwen 2.5 (1.5B)',
    localPath: null,
    remoteUrl: '',
    size: '~1 GB',
    status: 'ollama',
    isDefault: false,
    type: 'ollama',
    ollamaModel: 'hf.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF:Q4_K_M',
  },
  {
    id: 'ollama-llama-1b',
    name: 'Ollama: Llama 3.2 (1B)',
    localPath: null,
    remoteUrl: '',
    size: '~800 MB',
    status: 'ollama',
    isDefault: false,
    type: 'ollama',
    ollamaModel: 'hf.co/lmstudio-community/Llama-3.2-1B-Instruct-GGUF:Q4_K_M',
  },
];

const ACTIVE_MODEL_KEY = 'active_model_id';

async function ensureSeededModels(): Promise<void> {
  const result = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM models');
  const count = result?.count || 0;

  if (count > 0) return;

  for (const model of PRESET_MODELS) {
    await db.runAsync(
      'INSERT INTO models (id, name, remoteUrl, size, status, isDefault, type, ollamaModel) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [model.id, model.name, model.remoteUrl, model.size, model.status, model.isDefault ? 1 : 0, model.type || 'gguf', model.ollamaModel || null]
    );
  }
}

async function getDownloadedModelsInternal(): Promise<Model[]> {
  await ensureSeededModels();
  return db.getAllAsync<Model>(
    'SELECT * FROM models WHERE (status = "downloaded" AND localPath IS NOT NULL) OR status = "ollama" ORDER BY isDefault DESC, createdAt ASC'
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
    'SELECT COUNT(*) as count FROM models WHERE (status = "downloaded" AND localPath IS NOT NULL) OR status = "ollama"'
  );
  return (result?.count || 0) > 0;
};

export const getModels = async (): Promise<Model[]> => {
  await ensureSeededModels();
  const result = await db.getAllAsync<Model>('SELECT * FROM models');
  return result;
};

export const getActiveModel = async (): Promise<Model | null> => {
  await ensureSeededModels();

  const activeRow = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM app_meta WHERE key = ?',
    [ACTIVE_MODEL_KEY]
  );

  if (activeRow?.value) {
    const byId = await db.getFirstAsync<Model>(
      'SELECT * FROM models WHERE id = ? AND ((status = "downloaded" AND localPath IS NOT NULL) OR status = "ollama")',
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
  const model = await db.getFirstAsync<Model>('SELECT * FROM models WHERE id = ?', [modelId]);
  if (!model) throw new Error('Model not found');

  const filename = `${model.id}.gguf`;
  const fileUri = `${FileSystem.documentDirectory}${filename}`;

  // Update status to downloading
  await db.runAsync('UPDATE models SET status = ? WHERE id = ?', ['downloading', modelId]);

  const downloadResumable = FileSystem.createDownloadResumable(
    model.remoteUrl,
    fileUri,
    {},
    (downloadProgress) => {
      const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
      onProgress(progress);
    }
  );

  try {
    const downloadResult = await downloadResumable.downloadAsync();
    if (downloadResult) {
      await db.runAsync(
        'UPDATE models SET status = ?, localPath = ? WHERE id = ?',
        ['downloaded', downloadResult.uri, modelId]
      );
      await setActiveModel(modelId);
      return downloadResult.uri;
    }
    throw new Error('Download failed');
  } catch (e) {
    await db.runAsync('UPDATE models SET status = ? WHERE id = ?', ['error', modelId]);
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
