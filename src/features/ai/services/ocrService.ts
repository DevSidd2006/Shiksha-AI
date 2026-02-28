import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

export interface OCRResult {
  text: string;
  confidence: number;
  language: string;
  provider: 'backend-tesseract' | 'vision-api';
}

// Get backend URL
const getBackendUrl = () => {
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

      // Send to backend OCR endpoint
      const response = await fetch(`${getBackendUrl()}/ocr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image }),
      });

      if (!response.ok) {
        throw new Error(`OCR request failed: ${response.status}`);
      }

      const data = await response.json();
      
      const ocrResult: OCRResult = {
        text: this.cleanOCRText(data.text || ''),
        confidence: data.confidence || 0.8,
        language: data.language || 'en',
        provider: 'backend-tesseract',
      };

      // Cache result
      if (ocrResult.text) {
        this.localOCRCache.set(imageUri, ocrResult);
      }

      console.log(`OCR completed - ${ocrResult.text.split(/\s+/).length} words extracted`);
      return ocrResult;

    } catch (error: any) {
      console.error('OCR Error:', error);
      throw new Error(`OCR failed: ${error.message}. Ensure the backend server is running.`);
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
    const wordCount = text.trim().split(/\s+/).length;
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

