import AsyncStorage from '@react-native-async-storage/async-storage';

const OFFLINE_MODE_KEY = '@shiksha_offline_mode';
const PREFERRED_LANGUAGE_KEY = '@shiksha_preferred_language';

export async function getOfflineMode(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(OFFLINE_MODE_KEY);
    return value === 'true';
  } catch (error) {
    console.error('Error reading offline mode:', error);
    return false;
  }
}

export async function setOfflineMode(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(OFFLINE_MODE_KEY, enabled ? 'true' : 'false');
  } catch (error) {
    console.error('Error saving offline mode:', error);
  }
}

export async function getPreferredLanguage(): Promise<string> {
  try {
    const value = await AsyncStorage.getItem(PREFERRED_LANGUAGE_KEY);
    return value || 'English'; // Default
  } catch (error) {
    return 'English';
  }
}

export async function setPreferredLanguage(lang: string): Promise<void> {
  try {
    await AsyncStorage.setItem(PREFERRED_LANGUAGE_KEY, lang);
  } catch (error) {
    console.error('Error saving preferred language:', error);
  }
}
