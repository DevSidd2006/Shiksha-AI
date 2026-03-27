import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

export interface OCRResult {
  text: string;
  confidence: number;
  language: string;
  provider: 'backend-tesseract';
}

// Get preferred configured backend URL
const getConfiguredBackendUrl = () => {
  const configuredUrl =
    Constants.expoConfig?.extra?.apiUrl ||
    process.env.EXPO_PUBLIC_API_URL;

  if (typeof configuredUrl === 'string' && configuredUrl.trim().length > 0) {
    return configuredUrl.replace(/\/+$/, '');
  }

  return null;
};

const getDevBackendUrl = () => {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    return `http://${host}:3000`;
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000';
  }

  return 'http://localhost:3000';
};

const getOCRBackendCandidates = (): string[] => {
  const candidates = [getConfiguredBackendUrl(), __DEV__ ? getDevBackendUrl() : null]
    .filter((url): url is string => typeof url === 'string' && url.trim().length > 0)
    .map((url) => url.replace(/\/+$/, ''));

  // De-duplicate while preserving order.
  return [...new Set(candidates)];
};

export class OCRService {
  private static localOCRCache: Map<string, OCRResult> = new Map();

  /**
   * Clean OCR text to remove artifacts
   */
  static cleanOCRText(text: string): string {
    let cleaned = text.replace(/\s+/g, ' ').trim();
    cleaned = cleaned.replace(/[|]+/g, '');
    cleaned = cleaned.replace(/_{3,}/g, '');
    cleaned = cleaned.replace(/\.{3,}/g, '...');
    return cleaned;
  }

  /**
   * Extract text from image using backend OCR service
   */
  static async extractTextFromImage(imageUri: string): Promise<OCRResult> {
    try {
      console.log('Sending image to backend for OCR...');

      // Check cache
      const cached = this.localOCRCache.get(imageUri);
      if (cached) {
        console.log('Using cached OCR result');
        return cached;
      }

      // Read image as base64
      let base64Image: string;
      if (imageUri.startsWith('data:')) {
        base64Image = imageUri.split(',')[1];
      } else {
        // Ensure file:// prefix for Android
        const uri = imageUri.startsWith('file://') ? imageUri : `file://${imageUri}`;
        base64Image = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }

      const baseUrls = getOCRBackendCandidates();
      if (baseUrls.length === 0) {
        throw new Error('No OCR backend URL could be resolved');
      }

      let data: any = null;
      let lastErrorMessage = '';
      let usedEndpoint = '';

      for (const baseUrl of baseUrls) {
        const endpoint = `${baseUrl}/ocr`;
        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64Image }),
          });

          if (!response.ok) {
            lastErrorMessage = `OCR request failed: ${response.status} at ${endpoint}`;
            // 404 commonly means wrong backend base URL. Try the next candidate.
            if (response.status === 404) {
              continue;
            }
            throw new Error(lastErrorMessage);
          }

          data = await response.json();
          usedEndpoint = endpoint;
          break;
        } catch (error: any) {
          lastErrorMessage = error?.message || `OCR request failed at ${endpoint}`;
        }
      }

      if (!data) {
        throw new Error(
          lastErrorMessage ||
          `OCR request failed on all endpoints: ${baseUrls.map((url) => `${url}/ocr`).join(', ')}`
        );
      }
      
      const ocrResult: OCRResult = {
        text: this.cleanOCRText(data.text || ''),
        confidence: typeof data.confidence === 'number' ? data.confidence : 0.8,
        language: data.language || 'en',
        provider: 'backend-tesseract',
      };

      // Cache result
      if (ocrResult.text) {
        this.localOCRCache.set(imageUri, ocrResult);
      }

      console.log(`OCR completed via ${usedEndpoint} - ${ocrResult.text.split(/\s+/).length} words extracted`);
      return ocrResult;

    } catch (error: any) {
      console.error('OCR Error:', error);
      throw new Error(
        `OCR failed: ${error.message}. Ensure the backend server is running and EXPO_PUBLIC_API_URL points to a reachable backend on this device.`
      );
    }
  }

  /**
   * Alias for consistency
   */
  static async extractTextWithLocalModel(imageUri: string): Promise<OCRResult> {
    return this.extractTextFromImage(imageUri);
  }

  /**
   * Clear OCR cache
   */
  static clearCache() {
    this.localOCRCache.clear();
  }

  /**
   * Get cache size
   */
  static getCacheSize(): number {
    return this.localOCRCache.size;
  }

  /**
   * Terminate (no-op for backend-based OCR)
   */
  static async terminateWorker() {
    this.localOCRCache.clear();
  }

  /**
   * Validate extracted text quality
   */
  static validateExtractedText(text: string): {
    isValid: boolean;
    message: string;
    wordCount: number;
  } {
    const trimmedText = text.trim();
    const wordCount = trimmedText ? trimmedText.split(/\s+/).length : 0;
    const minWords = 3;

    if (wordCount < minWords) {
      return {
        isValid: false,
        message: `Text too short (${wordCount} words). Please use a clearer image.`,
        wordCount,
      };
    }

    return {
      isValid: true,
      message: 'Text extracted successfully',
      wordCount,
    };
  }
}
