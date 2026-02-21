import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system/legacy';

export interface VisionResult {
  text: string;
  description: string;
  confidence: number;
  model: string;
  timestamp: string;
}

const visionCache = new Map<string, VisionResult>();

/**
 * Get backend URL for vision requests
 */
function getBackendUrl(): string {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    return `http://${host}:3000`;
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000';
  }

  return 'http://localhost:3000';
}

/**
 * Convert image URI to base64
 */
async function imageToBase64(imageUri: string): Promise<string> {
  try {
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return base64;
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw new Error('Failed to read image file');
  }
}

/**
 * Analyze image using Ollama vision model (qwen3-vl)
 */
async function analyzeWithVisionModel(base64Image: string): Promise<VisionResult> {
  try {
    const backendUrl = getBackendUrl();
    const response = await fetch(`${backendUrl}/vision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: base64Image,
        question: 'Extract all text from this image and provide a brief description of what you see.',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Vision API error: ${response.status}`);
    }

    const data = await response.json();

    const answer = (data.answer || '').trim();
    return {
      text: answer,
      description: '',
      confidence: data.confidence || 0.9,
      model: data.model || 'qwen2.5:1.5b',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Vision Model Error:', error);
    throw error;
  }
}

/**
 * Analyze image using Ollama vision model (qwen3-vl)
 * Extracts text and provides detailed description
 */
async function analyzeImage(imageUri: string): Promise<VisionResult> {
  try {
    console.log('🖼️  Starting image analysis...');

    // Check cache first
    const cached = visionCache.get(imageUri);
    if (cached) {
      console.log('📦 Using cached vision result');
      return cached;
    }

    // Convert image to base64
    console.log('📸 Converting image to base64...');
    const base64Image = await imageToBase64(imageUri);

    // Send to backend for vision analysis
    console.log('🔄 Sending to vision model...');
    const result = await analyzeWithVisionModel(base64Image);

    // Cache result
    visionCache.set(imageUri, result);

    console.log(`✅ Analysis complete - ${result.text.split(/\s+/).length} words extracted`);
    return result;
  } catch (error) {
    console.error('Vision Analysis Error:', error);
    throw new Error(
      error instanceof Error
        ? error.message
        : 'Failed to analyze image. Please try again with a clearer image.'
    );
  }
}

/**
 * Extract text only from image (simpler, faster)
 */
async function extractText(imageUri: string): Promise<string> {
  try {
    const result = await analyzeImage(imageUri);
    return result.text;
  } catch (error) {
    throw error;
  }
}

/**
 * Get full analysis including description
 */
async function getFullAnalysis(imageUri: string): Promise<VisionResult> {
  return analyzeImage(imageUri);
}

/**
 * Validate extracted text quality
 */
function validateText(text: string): {
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

  if (text.length > 5000) {
    return {
      isValid: true,
      message: `Text extracted (${wordCount} words). Note: Some content may be truncated.`,
      wordCount,
    };
  }

  return {
    isValid: true,
    message: `Successfully extracted text (${wordCount} words)`,
    wordCount,
  };
}

/**
 * Clean and preprocess extracted text
 */
function preprocessText(text: string): string {
  return text
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/([.!?])\s+([A-Z])/g, '$1\n$2') // Break into sentences
    .trim();
}

/**
 * Clear vision cache
 */
function clearCache() {
  visionCache.clear();
  console.log('Vision cache cleared');
}

/**
 * Get cache size
 */
function getCacheSize(): number {
  return visionCache.size;
}

// Export as namespace for compatibility
export const VisionService = {
  analyzeImage,
  extractText,
  getFullAnalysis,
  validateText,
  preprocessText,
  clearCache,
  getCacheSize,
};
