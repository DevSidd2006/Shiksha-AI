import { translateText as translateWithBackend } from './api';

type TranslationProvider = 'mlkit' | 'backend' | 'none';

interface LanguageSpec {
  name: string;
  aliases: string[];
  mlKitCode: string;
  backendCode: string;
}

export interface LanguageRequest {
  languageName: string;
  mlKitCode: string;
  backendCode: string;
  cleanedQuestion: string;
}

const SUPPORTED_LANGUAGES: LanguageSpec[] = [
  { name: 'Hindi', aliases: ['hindi', 'hin', 'hindi me', 'hindi mein'], mlKitCode: 'hi', backendCode: 'hin_Deva' },
  { name: 'Marathi', aliases: ['marathi', 'marathi me'], mlKitCode: 'mr', backendCode: 'mar_Deva' },
  { name: 'Bengali', aliases: ['bengali', 'bangla'], mlKitCode: 'bn', backendCode: 'ben_Beng' },
  { name: 'Tamil', aliases: ['tamil'], mlKitCode: 'ta', backendCode: 'tam_Taml' },
  { name: 'Telugu', aliases: ['telugu'], mlKitCode: 'te', backendCode: 'tel_Telu' },
  { name: 'Kannada', aliases: ['kannada'], mlKitCode: 'kn', backendCode: 'kan_Knda' },
  { name: 'Malayalam', aliases: ['malayalam'], mlKitCode: 'ml', backendCode: 'mal_Mlym' },
  { name: 'Gujarati', aliases: ['gujarati'], mlKitCode: 'gu', backendCode: 'guj_Gujr' },
  { name: 'Punjabi', aliases: ['punjabi'], mlKitCode: 'pa', backendCode: 'pan_Guru' },
  { name: 'Urdu', aliases: ['urdu'], mlKitCode: 'ur', backendCode: 'urd_Arab' },
  { name: 'Spanish', aliases: ['spanish', 'espanol', 'español'], mlKitCode: 'es', backendCode: 'spa_Latn' },
  { name: 'French', aliases: ['french', 'francais', 'français'], mlKitCode: 'fr', backendCode: 'fra_Latn' },
  { name: 'German', aliases: ['german', 'deutsch'], mlKitCode: 'de', backendCode: 'deu_Latn' },
  { name: 'Arabic', aliases: ['arabic'], mlKitCode: 'ar', backendCode: 'arb_Arab' },
  { name: 'Portuguese', aliases: ['portuguese'], mlKitCode: 'pt', backendCode: 'por_Latn' },
  { name: 'Italian', aliases: ['italian'], mlKitCode: 'it', backendCode: 'ita_Latn' },
  { name: 'Russian', aliases: ['russian'], mlKitCode: 'ru', backendCode: 'rus_Cyrl' },
  { name: 'Japanese', aliases: ['japanese'], mlKitCode: 'ja', backendCode: 'jpn_Jpan' },
  { name: 'Korean', aliases: ['korean'], mlKitCode: 'ko', backendCode: 'kor_Hang' },
  { name: 'Chinese', aliases: ['chinese', 'mandarin'], mlKitCode: 'zh', backendCode: 'zho_Hans' },
];

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeWhitespace = (text: string) => text.replace(/\s+/g, ' ').trim();

const getLanguageSpec = (query: string): LanguageSpec | null => {
  const lowered = query.toLowerCase();

  const directiveMatch = lowered.match(
    /(?:translate|reply|answer|respond)\s+(?:it\s+)?(?:to|in|into)\s+([a-z\u00c0-\u024f ]{2,})/i
  );
  if (directiveMatch?.[1]) {
    const requested = directiveMatch[1].trim();
    const byDirective = SUPPORTED_LANGUAGES.find((language) =>
      language.aliases.some((alias) => requested.includes(alias)) || language.name.toLowerCase() === requested
    );
    if (byDirective) {
      return byDirective;
    }
  }

  return (
    SUPPORTED_LANGUAGES.find((language) =>
      language.aliases.some((alias) => lowered.includes(alias))
    ) || null
  );
};

const removeLanguageDirective = (question: string, language: LanguageSpec): string => {
  let cleaned = question;

  for (const alias of language.aliases) {
    const escapedAlias = escapeRegex(alias);
    const patterns = [
      new RegExp(`\\b(in|into)\\s+${escapedAlias}\\b`, 'ig'),
      new RegExp(`\\b${escapedAlias}\\s+(language|lang)\\b`, 'ig'),
      new RegExp(`\\b${escapedAlias}\\s+mein\\b`, 'ig'),
      new RegExp(`\\b${escapedAlias}\\s+me\\b`, 'ig'),
    ];

    for (const pattern of patterns) {
      cleaned = cleaned.replace(pattern, '');
    }
  }

  cleaned = cleaned.replace(/\s{2,}/g, ' ');
  cleaned = cleaned.replace(/\s+([?.!,])/g, '$1');

  const fallback = normalizeWhitespace(question);
  const normalized = normalizeWhitespace(cleaned);
  return normalized.length > 0 ? normalized : fallback;
};

export const detectLanguageRequest = (question: string): LanguageRequest | null => {
  const spec = getLanguageSpec(question);
  if (!spec) {
    return null;
  }

  return {
    languageName: spec.name,
    mlKitCode: spec.mlKitCode,
    backendCode: spec.backendCode,
    cleanedQuestion: removeLanguageDirective(question, spec),
  };
};

let cachedMlKitModule: any | null | undefined;

const loadMlKitModule = (): any | null => {
  if (cachedMlKitModule !== undefined) {
    return cachedMlKitModule;
  }

  try {
    cachedMlKitModule = require('@react-native-ml-kit/translate-text');
  } catch {
    cachedMlKitModule = null;
  }

  return cachedMlKitModule;
};

const translateWithMlKit = async (text: string, targetCode: string): Promise<string | null> => {
  const mlKitModule = loadMlKitModule();
  if (!mlKitModule) {
    return null;
  }

  const translator = mlKitModule.default || mlKitModule;

  if (!translator) {
    return null;
  }

  if (typeof translator.downloadModel === 'function') {
    await translator.downloadModel(targetCode);
  } else if (typeof translator.downloadTranslationModel === 'function') {
    await translator.downloadTranslationModel(targetCode);
  }

  if (typeof translator.translate === 'function') {
    const translated = await translator.translate({
      text,
      sourceLanguage: 'en',
      targetLanguage: targetCode,
      downloadModelIfNeeded: true,
      requireWifi: false,
    });

    if (typeof translated === 'string') {
      return translated;
    }

    if (translated && typeof translated.text === 'string') {
      return translated.text;
    }

    return null;
  }

  if (typeof translator.translateText === 'function') {
    return await translator.translateText(text, {
      sourceLanguage: 'en',
      targetLanguage: targetCode,
    });
  }

  return null;
};

export async function translateAssistantResponse(
  responseText: string,
  requestedLanguage: LanguageRequest
): Promise<{ text: string; provider: TranslationProvider }> {
  const source = responseText.trim();

  try {
    const mlKitTranslated = await translateWithMlKit(responseText, requestedLanguage.mlKitCode);
    const normalized = mlKitTranslated?.trim();
    if (normalized && normalized.length > 0 && normalized.toLowerCase() !== source.toLowerCase()) {
      return { text: normalized, provider: 'mlkit' };
    }
  } catch (error) {
    console.log('ML Kit translation unavailable, using backend translator.', error);
  }

  try {
    const backendTranslated = await translateWithBackend(responseText, requestedLanguage.backendCode);
    const normalized = backendTranslated?.trim();
    if (normalized && normalized.length > 0 && normalized.toLowerCase() !== source.toLowerCase()) {
      return { text: normalized, provider: 'backend' };
    }
  } catch (error) {
    console.log('Backend translation failed.', error);
  }

  return { text: responseText, provider: 'none' };
}
