import { NativeModules, Platform } from 'react-native';

type LlamaBridgeModule = {
  init: (modelPath: string) => Promise<boolean>;
  generate: (prompt: string, maxTokens: number, temperature: number) => Promise<string>;
  stop: () => Promise<void>;
};

const LINKING_ERROR =
  'LlamaBridge native module not found. This occurs because the app is running in Expo Go or the native code has not been compiled.\n\nTo use local models, you must build a standalone APK (Release build).';

const NativeLlama = NativeModules.LlamaBridge as LlamaBridgeModule | undefined;

let initialized = false;
let currentModelPath: string | null = null;

export const llamaBridge = {
  isAvailable(): boolean {
    return !!NativeLlama && Platform.OS !== 'web';
  },

  async ensure(modelPath: string): Promise<boolean> {
    if (!this.isAvailable()) return false;
    
    if (initialized && currentModelPath === modelPath) {
      return true;
    }

    if (initialized && currentModelPath !== modelPath) {
      await this.stop();
    }

    if (!modelPath) return false;
    try {
      initialized = await NativeLlama!.init(modelPath);
      currentModelPath = modelPath;
      return initialized;
    } catch (error) {
      console.warn('Llama init failed:', error);
      return false;
    }
  },

  async generate(
    prompt: string,
    opts?: { maxTokens?: number; temperature?: number; modelPath?: string }
  ): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error(LINKING_ERROR);
    }

    const modelPath = opts?.modelPath || currentModelPath;
    if (!modelPath) {
      throw new Error('Model path not set. Call ensure() with modelPath first.');
    }

    const ready = await this.ensure(modelPath);
    if (!ready) {
      throw new Error('Llama model not ready. Check modelPath or native build.');
    }

    const maxTokens = opts?.maxTokens ?? 120;
    const temperature = opts?.temperature ?? 0.7;

    return NativeLlama!.generate(prompt, maxTokens, temperature);
  },

  async stop(): Promise<void> {
    if (!this.isAvailable()) return;
    try {
      await NativeLlama!.stop();
      initialized = false;
      currentModelPath = null;
    } catch (error) {
      console.warn('Llama stop failed:', error);
    }
  },
};
