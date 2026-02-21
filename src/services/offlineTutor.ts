import { TutorResponse } from './api';
import { llamaBridge } from './nativeLlama';
import { getActiveModel, Model, getActiveModelPath } from './modelDownloadService';

let configuredModelPath = process.env.EXPO_PUBLIC_LLAMA_MODEL_PATH || '';
let activeOllamaModel: string | null = null;

export function setOfflineModelPath(modelPath: string): void {
  configuredModelPath = modelPath.trim();
}

export function setOllamaModel(model: string): void {
  activeOllamaModel = model;
}

const tips = [
  'Break the problem into smaller steps and solve one part at a time.',
  'Write down the known facts and the unknowns before you start solving.',
  'If you get stuck, restate the question in your own words.',
  'Check units and conversions; they are a common source of mistakes.',
  'Try a simple example to see how the pattern works.',
  'Explain your idea as if teaching a friend—gaps will surface quickly.',
];

async function tryNativeLlama(question: string): Promise<TutorResponse | null> {
  if (!llamaBridge.isAvailable()) return null;
  if (!configuredModelPath) {
    configuredModelPath = (await getActiveModelPath()) || '';
  }
  if (!configuredModelPath) return null;

  try {
    const prompt = [
      'You are a concise AI Tutor for Class 9 students.',
      'Explain concepts in a short, complete, and highly useful manner.',
      'Avoid long paragraphs. Be direct and accurate for a 9th grade level.',
      `Question: ${question}`,
    ].join('\n');

    const text = await llamaBridge.generate(prompt, {
      modelPath: configuredModelPath,
      maxTokens: 120,
      temperature: 0.7,
    });

    return {
      answer: text,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.warn('Native llama generation failed, falling back:', error);
    return null;
  }
}

async function tryOllama(question: string): Promise<TutorResponse | null> {
  if (!activeOllamaModel) return null;

  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: activeOllamaModel,
        prompt: [
          'You are a concise AI Tutor for Class 9 students.',
          'Explain concepts in a short, complete, and highly useful manner.',
          'Avoid long paragraphs. Be direct and accurate for a 9th grade level.',
          `Question: ${question}`,
        ].join('\n'),
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 120,
        },
      }),
    });

    if (!response.ok) {
      console.warn('Ollama request failed:', response.status);
      return null;
    }

    const data = await response.json();
    return {
      answer: data.response || '',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.warn('Ollama generation failed:', error);
    return null;
  }
}

export async function generateOfflineAnswer(question: string): Promise<TutorResponse> {
  const trimmed = question.trim();
  const limitedQuestion = trimmed.slice(0, 240);

  const activeModel = await getActiveModel();
  
  if (activeModel?.type === 'ollama' && activeModel.ollamaModel) {
    setOllamaModel(activeModel.ollamaModel);
    const ollamaResult = await tryOllama(limitedQuestion);
    if (ollamaResult) return ollamaResult;
  }

  const native = await tryNativeLlama(limitedQuestion);
  if (native) return native;

  const guidance = tips[Math.floor(Math.random() * tips.length)];
  const answer = [
    'Offline helper (compact):',
    `You asked: "${limitedQuestion || 'your question'}".`,
    'I cannot reach the cloud model right now, so here is a quick reasoning outline you can try locally:',
    `1) ${guidance}`,
    '2) List what is given, what is needed, and write one formula or fact that links them.',
    '3) Attempt a short solution path in 3–5 steps and check if it answers the original question.',
  ].join('\n');

  return {
    answer,
    timestamp: new Date().toISOString(),
  };
}
