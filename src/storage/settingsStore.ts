import db from '@/database/init';

const DEFAULT_SETTINGS_ID = 'settings_default';
const DEFAULT_USER_ID = 'student_default';
const PREFERRED_LANGUAGE_KEY = 'preferred_language';

async function ensureSettingsRow() {
  await db.runAsync(
    `INSERT OR IGNORE INTO settings (id, userId, offlineMode, dailyGoal, soundEnabled, notificationsEnabled)
     VALUES (?, ?, 0, 5, 1, 1)`,
    [DEFAULT_SETTINGS_ID, DEFAULT_USER_ID]
  );
}

export async function getOfflineMode(): Promise<boolean> {
  try {
    await ensureSettingsRow();
    const row = await db.getFirstAsync<{ offlineMode: number }>(
      `SELECT offlineMode FROM settings WHERE id = ?`,
      [DEFAULT_SETTINGS_ID]
    );
    return (row?.offlineMode || 0) === 1;
  } catch (error) {
    console.error('Error reading offline mode:', error);
    return false;
  }
}

export async function setOfflineMode(enabled: boolean): Promise<void> {
  try {
    await ensureSettingsRow();
    await db.runAsync(
      `UPDATE settings SET offlineMode = ?, updatedAt = datetime('now') WHERE id = ?`,
      [enabled ? 1 : 0, DEFAULT_SETTINGS_ID]
    );
  } catch (error) {
    console.error('Error saving offline mode:', error);
  }
}

export async function getPreferredLanguage(): Promise<string> {
  try {
    const row = await db.getFirstAsync<{ value: string }>(
      `SELECT value FROM app_meta WHERE key = ?`,
      [PREFERRED_LANGUAGE_KEY]
    );
    return row?.value || 'English';
  } catch (error) {
    console.error('Error reading preferred language:', error);
    return 'English';
  }
}

export async function setPreferredLanguage(lang: string): Promise<void> {
  try {
    await db.runAsync(
      `INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?)`,
      [PREFERRED_LANGUAGE_KEY, lang]
    );
  } catch (error) {
    console.error('Error saving preferred language:', error);
  }
}
