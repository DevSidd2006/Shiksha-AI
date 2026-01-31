import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { OCRService } from './ocrService';
import Constants from 'expo-constants';

export interface VisionResult {
  answer: string;
  model: string;
  processingTime: number;
  confidence?: number;
}

// Get backend URL (same logic as ocrService)
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

export class VisionLanguageService {
  private static readonly MODEL_NAME = 'gemma3:latest';
  // Use host machine IP instead of localhost for React Native
  private static readonly OLLAMA_BASE_URL = __DEV__
    ? 'http://10.0.2.2:11434'  // Android emulator
    : 'http://localhost:11434'; // Production

  // Alternative URLs to try
  private static readonly OLLAMA_URLS = [
    'http://10.0.2.2:11434',     // Android emulator
    'http://192.168.1.100:11434', // Common local network IP (adjust as needed)
    'http://localhost:11434',     // Localhost
  ];

  /**
   * Alias for processImageWithQuestion to match tutor.tsx expectations
   * Returns just the answer string for easy chat integration
   * Falls back to OCR + text LLM if vision model is unavailable
   */
  static async analyzeImage(imageUri: string, question: string): Promise<string> {
    console.log('🔍 Processing with Gemma3 vision model...');
    try {
      // Read image as base64
      const uri = imageUri.startsWith('file://') ? imageUri : `file://${imageUri}`;
      const base64Image = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const response = await fetch(`${getBackendUrl()}/vision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64Image,
          question: question || 'Describe this image in detail.',
          studentGrade: 'Class 9',
        }),
      });

      if (!response.ok) {
        throw new Error(`Vision API returned ${response.status}`);
      }

      const data = await response.json();
      if (!data.answer || data.answer.trim().length === 0) {
        throw new Error('Vision model returned empty response');
      }

      console.log('✅ Vision model responded');
      return data.answer;
    } catch (error) {
      console.error('❌ Vision model error:', error instanceof Error ? error.message : error);
      return `I couldn't process this image. Please try again or ask the AI tutor directly. Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  /**
   * Get the URL for the text-based LLM (same Ollama instance)
   */
  private static getTextLLMUrl(): string {
    return this.OLLAMA_BASE_URL;
  }

  /**
   * Quick check if vision model is available (cached)
   */
  private static visionModelChecked = false;
  private static visionModelAvailable = false;
  
  private static async isVisionModelAvailable(): Promise<boolean> {
    if (this.visionModelChecked) return this.visionModelAvailable;
    
    try {
      const result = await this.testConnection();
      this.visionModelAvailable = result.modelAvailable;
      this.visionModelChecked = true;
      return this.visionModelAvailable;
    } catch {
      this.visionModelChecked = true;
      this.visionModelAvailable = false;
      return false;
    }
  }

  /**
   * Process image with Qwen3-VL vision-language model
   * Can detect objects, read text, explain images, and answer questions about images
   */
  static async processImageWithQuestion(
    imageUri: string,
    question: string
  ): Promise<VisionResult> {
    const startTime = Date.now();

    try {
      console.log('Processing image with Qwen3-VL:2B...');

      // Read image as base64 - ensure file:// prefix for Android
      const uri = imageUri.startsWith('file://') ? imageUri : `file://${imageUri}`;
      const base64Image = await FileSystem.readAsStringAsync(
        uri,
        { encoding: 'base64' }
      );

      // Create data URI for the image
      const imageDataUri = `data:image/jpeg;base64,${base64Image}`;

      // Prepare the prompt for vision-language understanding
      const systemPrompt = `You are a helpful AI Assistant for Class 9 students. Analyze the provided image and answer the student's question accurately.
      
      GUIDELINES:
      - Assume the user is a Class 9 student.
      - Keep explanations short, concise, and complete. 
      - Do not provide unnecessary length or filler.
      - If the question is about text in the image, extract and explain it specifically for a 9th grader.
      - Be highly useful and direct. Use academic but simple language.`;

      const userPrompt = `Question: ${question}\n\nPlease analyze this image and provide a concise, useful answer for a Class 9 student.`;

      // Call Ollama API with vision model
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout for processing

      const response = await fetch(`${this.OLLAMA_BASE_URL}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.MODEL_NAME,
          prompt: userPrompt,
          system: systemPrompt,
          images: [imageDataUri],
          stream: false,
          options: {
            temperature: 0.1,
            top_p: 0.9,
            num_predict: 1024,
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.response) {
        throw new Error('No response from vision model');
      }

      const processingTime = Date.now() - startTime;

      return {
        answer: data.response.trim(),
        model: this.MODEL_NAME,
        processingTime,
        confidence: data.done ? 0.95 : 0.85, // Ollama doesn't provide confidence, using default
      };

    } catch (error) {
      console.error('Vision-Language processing error:', error);

      // Fallback to basic image description if model fails
      const processingTime = Date.now() - startTime;

      return {
        answer: `I encountered an issue processing the image with the vision model. Error: ${error instanceof Error ? error.message : 'Unknown error'}. Please ensure Ollama is running and the ${this.MODEL_NAME} model is available.`,
        model: this.MODEL_NAME,
        processingTime,
        confidence: 0.1,
      };
    }
  }

  /**
   * Extract text from image using vision model (alternative to OCR)
   */
  static async extractTextFromImage(imageUri: string): Promise<string> {
    try {
      const result = await this.processImageWithQuestion(
        imageUri,
        "Extract all readable text from this image. If there is no text, say 'No readable text found in the image.'"
      );
      return result.answer;
    } catch (error) {
      console.error('Text extraction error:', error);
      return 'Failed to extract text from image.';
    }
  }

  /**
   * Describe image content using vision model
   */
  static async describeImage(imageUri: string): Promise<string> {
    try {
      const result = await this.processImageWithQuestion(
        imageUri,
        "Describe what you see in this image in detail. Include objects, people, text, colors, and any notable features."
      );
      return result.answer;
    } catch (error) {
      console.error('Image description error:', error);
      return 'Failed to describe the image.';
    }
  }

  /**
   * Answer specific question about image
   */
  static async answerQuestionAboutImage(
    imageUri: string,
    question: string
  ): Promise<VisionResult> {
    return this.processImageWithQuestion(imageUri, question);
  }

  /**
   * Check if Ollama service is available
   */
  static async isOllamaAvailable(): Promise<boolean> {
    console.log('Checking Ollama availability...');

    // Try multiple possible URLs
    for (const url of this.OLLAMA_URLS) {
      try {
        console.log(`Trying Ollama at: ${url}`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

        const response = await fetch(`${url}/api/tags`, {
          method: 'GET',
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          console.log(`✅ Ollama found at: ${url}`);
          // Update the base URL to the working one
          (this as any).OLLAMA_BASE_URL = url;
          return true;
        } else {
          console.log(`❌ Ollama at ${url} returned status: ${response.status}`);
        }
      } catch (error) {
        console.log(`❌ Failed to connect to Ollama at ${url}:`, error instanceof Error ? error.message : error);
      }
    }

    console.log('❌ Ollama not available on any configured URL');
    return false;
  }

  /**
   * Check if Qwen3-VL model is available
   */
  static async isModelAvailable(): Promise<boolean> {
    try {
      console.log('Checking if Qwen3-VL model is available...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.OLLAMA_BASE_URL}/api/tags`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.log('Ollama API returned error:', response.status);
        return false;
      }

      const data = await response.json();
      const models = data.models || [];
      console.log('Available models:', models.map((m: any) => m.name));

      const available = models.some((model: any) => model.name === this.MODEL_NAME);

      if (available) {
        console.log(`✅ Model ${this.MODEL_NAME} is available`);
      } else {
        console.log(`❌ Model ${this.MODEL_NAME} not found. Available models:`, models.map((m: any) => m.name));
      }

      return available;
    } catch (error) {
      console.log('Model check error:', error);
      return false;
    }
  }

  /**
   * Get current Ollama base URL (for debugging)
   */
  static getCurrentBaseUrl(): string {
    return this.OLLAMA_BASE_URL;
  }

  /**
   * Set custom Ollama URL (for advanced users)
   */
  static setCustomBaseUrl(url: string) {
    (this as any).OLLAMA_BASE_URL = url;
    console.log('Ollama base URL set to:', url);
  }

  /**
   * Get model information
   */
  static getModelInfo(): { name: string; size: string; capabilities: string[] } {
    return {
      name: this.MODEL_NAME,
      size: '2B parameters',
      capabilities: [
        'Image understanding',
        'Text extraction from images',
        'Object detection',
        'Scene description',
        'Question answering about images',
        'Multilingual text recognition',
      ],
    };
  }

  /**
   * Test connection and provide detailed diagnostics
   */
  static async testConnection(): Promise<{
    ollamaAvailable: boolean;
    modelAvailable: boolean;
    workingUrl?: string;
    availableModels?: string[];
    error?: string;
  }> {
    console.log('🔍 Testing Ollama connection...');

    try {
      const ollamaAvailable = await this.isOllamaAvailable();

      if (!ollamaAvailable) {
        return {
          ollamaAvailable: false,
          modelAvailable: false,
          error: 'Cannot connect to Ollama. Make sure Ollama is running with: ollama serve'
        };
      }

      const modelAvailable = await this.isModelAvailable();

      // Get available models for debugging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.OLLAMA_BASE_URL}/api/tags`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      let availableModels: string[] = [];
      if (response.ok) {
        const data = await response.json();
        availableModels = (data.models || []).map((m: any) => m.name);
      }

      return {
        ollamaAvailable: true,
        modelAvailable,
        workingUrl: this.OLLAMA_BASE_URL,
        availableModels,
        error: modelAvailable ? undefined : `Model ${this.MODEL_NAME} not found. Run: ollama pull ${this.MODEL_NAME}`
      };

    } catch (error) {
      return {
        ollamaAvailable: false,
        modelAvailable: false,
        error: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}