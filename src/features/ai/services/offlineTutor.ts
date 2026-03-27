import { TutorResponse } from './api';
import { llamaBridge } from './nativeLlama';
import { getActiveModelPath } from './modelDownloadService';

let configuredModelPath = process.env.EXPO_PUBLIC_LLAMA_MODEL_PATH || '';

export function setOfflineModelPath(modelPath: string): void {
  configuredModelPath = modelPath.trim();
}

const tips = [
  'Break the problem into smaller steps and solve one part at a time.',
  'Write down the known facts and the unknowns before you start solving.',
  'If you get stuck, restate the question in your own words.',
  'Check units and conversions; they are a common source of mistakes.',
  'Try a simple example to see how the pattern works.',
  'Explain your idea as if teaching a friend-gaps will surface quickly.',
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
      'Explain in simple language with short sentences.',
      'Use normal text math like 40/20 = 2, not LaTeX.',
      'Always follow this format:',
      'Simple Answer: 1-2 short lines',
      'Steps: 2-5 short points',
      'Final Answer: one line',
      `Question: ${question}`,
    ].join('\n');

    const result = await llamaBridge.generate(prompt, {
      modelPath: configuredModelPath,
      maxTokens: 120,
      temperature: 0.7,
    });

    return {
      answer: result.text,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.warn('Native llama generation failed, falling back:', error);
    return null;
  }
}

export async function generateOfflineAnswer(question: string): Promise<TutorResponse> {
  const trimmed = question.trim();
  const limitedQuestion = trimmed.slice(0, 240);

  const native = await tryNativeLlama(limitedQuestion);
  if (native) return native;

  const guidance = tips[Math.floor(Math.random() * tips.length)];
  const answer = [
    'Offline helper (compact):',
    `You asked: "${limitedQuestion || 'your question'}".`,
    'I cannot reach the cloud model right now, so here is a quick reasoning outline you can try locally:',
    `1) ${guidance}`,
    '2) List what is given, what is needed, and write one formula or fact that links them.',
    '3) Attempt a short solution path in 3-5 steps and check if it answers the original question.',
  ].join('\n');

  return {
    answer,
    timestamp: new Date().toISOString(),
  };
}
