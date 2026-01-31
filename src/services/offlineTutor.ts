import { TutorResponse } from './api';
import { llamaBridge } from './nativeLlama';

// Path to the bundled or downloaded GGUF model. Set this after adding the native bridge.
const DEFAULT_MODEL_PATH = '';

// Lightweight offline generator to provide basic, on-device guidance when llama.cpp is unavailable.
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
  if (!DEFAULT_MODEL_PATH) return null;

  try {
    const prompt = [
      'You are a concise AI Tutor for Class 9 students.',
      'Explain concepts in a short, complete, and highly useful manner.',
      'Avoid long paragraphs. Be direct and accurate for a 9th grade level.',
      `Question: ${question}`,
    ].join('\n');

    const text = await llamaBridge.generate(prompt, {
      modelPath: DEFAULT_MODEL_PATH,
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

export async function generateOfflineAnswer(question: string): Promise<TutorResponse> {
  const trimmed = question.trim();
  const limitedQuestion = trimmed.slice(0, 240);

  // Prefer native llama.cpp if present and configured.
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
