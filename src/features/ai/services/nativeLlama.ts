import { initLlama, LlamaContext } from 'llama.rn';
import { Platform } from 'react-native';

const LINKING_ERROR =
  'llama.rn native module not found. This occurs because the app is running in Expo Go or the native code has not been compiled.\n\nTo use local models, you must build a standalone APK (Release build).';

let currentContext: LlamaContext | null = null;
let currentModelPath: string | null = null;

export const llamaBridge = {
  isAvailable(): boolean {
    return Platform.OS !== 'web';
  },

  async ensure(modelPath: string): Promise<boolean> {
    if (!this.isAvailable()) return false;

    if (currentContext && currentModelPath === modelPath) {
      return true;
    }

    if (currentContext && currentModelPath !== modelPath) {
      await this.stop();
    }

    if (!modelPath) return false;
    try {
      console.log('Initializing Llama context for:', modelPath);
      currentContext = await initLlama({
        model: modelPath,
        use_mlock: true,
        n_ctx: 1024,
        n_gpu_layers: 0, // Disable GPU layers on mobile
      });
      currentModelPath = modelPath;
      return true;
    } catch (error) {
      console.warn('Llama init failed:', error);
      return false;
    }
  },

  async generate(
    prompt: string,
    opts?: { maxTokens?: number; temperature?: number; modelPath?: string; onToken?: (token: string) => void; }
  ): Promise<{ text: string, tokensPerSec?: number }> {
    if (!this.isAvailable()) {
      throw new Error(LINKING_ERROR);
    }

    const modelPath = opts?.modelPath || currentModelPath;
    if (!modelPath) {
      throw new Error('Model path not set. Call ensure() with modelPath first.');
    }

    const ready = await this.ensure(modelPath);
    if (!ready || !currentContext) {
      throw new Error('Llama model not ready. Check modelPath or native build.');
    }

    const maxTokens = opts?.maxTokens ?? 120;
    const temperature = opts?.temperature ?? 0.7;

    return new Promise((resolve, reject) => {
      let fullText = '';
      let tps = 0;

      currentContext!.completion({
        prompt,
        n_predict: maxTokens,
        temperature,
        stop: ["</s>", "User:", "Question:"],
      }, (data: any) => {
        if (opts?.onToken) opts.onToken(data.token);
        fullText += data.token;
      })
        .then((result: any) => {
          resolve({
            text: fullText,
            tokensPerSec: result.timings?.tokens_per_second
          });
        })
        .catch(reject);
    });
  },

  async stop(): Promise<void> {
    if (!this.isAvailable()) return;
    try {
      if (currentContext) {
        await currentContext.release();
      }
      currentContext = null;
      currentModelPath = null;
      console.log('Llama context released.');
    } catch (error) {
      console.warn('Llama stop failed:', error);
    }
  },
};
