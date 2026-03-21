const express = require('express');
const cors = require('cors');
const axios = require('axios');
const Tesseract = require('tesseract.js');
const path = require('path');
const { pathToFileURL } = require('url');
require('dotenv').config();
const {
  ensureUser,
  recordTutorEvent,
  getDashboardStats,
  getDatabaseHealth,
} = require('./db/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for base64 images

// Ollama configuration
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'hf.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF:Q4_K_M';
const TRANSLATOR_SERVICE_URL = process.env.TRANSLATOR_SERVICE_URL || 'http://localhost:3001';

const NLLB_TO_ISO = {
  hin_Deva: 'hi',
  mar_Deva: 'mr',
  ben_Beng: 'bn',
  tam_Taml: 'ta',
  tel_Telu: 'te',
  kan_Knda: 'kn',
  mal_Mlym: 'ml',
  guj_Gujr: 'gu',
  pan_Guru: 'pa',
  urd_Arab: 'ur',
  spa_Latn: 'es',
  fra_Latn: 'fr',
  deu_Latn: 'de',
  arb_Arab: 'ar',
  por_Latn: 'pt',
  ita_Latn: 'it',
  rus_Cyrl: 'ru',
  jpn_Jpan: 'ja',
  kor_Hang: 'ko',
  zho_Hans: 'zh',
};

let cachedCloudTranslate = undefined;

const getCloudTranslate = async () => {
  if (cachedCloudTranslate !== undefined) {
    return cachedCloudTranslate;
  }

  try {
    const mod = await import('@vitalets/google-translate-api');
    cachedCloudTranslate = mod.translate || mod.default?.translate || null;
  } catch (error) {
    console.log('Cloud translator package is unavailable:', error.message);
    cachedCloudTranslate = null;
  }

  return cachedCloudTranslate;
};

// Check Ollama availability
let ollamaAvailable = false;

const checkOllama = async () => {
  try {
    const response = await axios.get(`${OLLAMA_HOST}/api/tags`, { timeout: 2000 });
    ollamaAvailable = response.status === 200;
    console.log('✅ Ollama is available');
    return true;
  } catch (error) {
    console.log('❌ Ollama is not available (using local fallback if possible)');
    ollamaAvailable = false;
    return false;
  }
};

// Check Ollama on startup
checkOllama();
ensureUser('student_default');

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Shiksha AI Backend is running',
    version: '1.0.0',
    ollama: ollamaAvailable ? 'connected' : 'disconnected',
    aiModel: OLLAMA_MODEL,
    database: getDatabaseHealth() ? 'connected' : 'disconnected'
  });
});

app.get('/dashboard/:userId', (req, res) => {
  try {
    const userId = req.params.userId || 'student_default';
    const stats = getDashboardStats(userId);
    res.json(stats);
  } catch (error) {
    console.error('❌ Dashboard stats error:', error.message);
    res.status(500).json({ error: 'Failed to load dashboard stats' });
  }
});

// System prompt for student context
const getSystemPrompt = (studentGrade = 'Class 9') => {
  return `You are an expert AI Tutor specifically for Class 9 students (strictly following NCERT/Class 9 level curriculum).

CORE INSTRUCTIONS:
- The student is in Class 9. Tailor all explanations to their level of understanding.
- DO NOT give long, wordy answers. Keep it brief.
- Be concise but complete. Explain the core concept fully but without filler.
- Be helpful and academic.
- Format with bullet points if helpful for clarity.
- Use simple analogies to explain complex scientific or mathematical concepts.

MATH FORMATTING RULE:
- Use LaTeX only for full equations or non-trivial expressions.
- Do NOT wrap every single symbol/variable (like u, v, t, a) in separate LaTeX blocks.
- Prefer plain readable steps with short lines.
- For stand-alone equations, use display mode when helpful: e.g., $$s = ut + \\frac{1}{2}at^2$$
- For fractions and square roots, use proper LaTeX (e.g., $\\frac{96}{13}$, $\\sqrt{x}$).
- Avoid excessive equation boxes. Keep math formatting minimal and clear.

Mantra: Short, complete, and formatted correctly with LaTeX.`;
};

// Language Translation (Using NLLB-200 microservice)
const translateText = async (text, targetLang) => {
  try {
    const response = await axios.post(`${TRANSLATOR_SERVICE_URL}/translate`, {
      text: text,
      tgt_lang: targetLang,
      src_lang: 'eng_Latn'
    }, { timeout: 15000 });

    const translated = typeof response?.data?.translation === 'string'
      ? response.data.translation.trim()
      : '';

    if (translated.length > 0) {
      return translated;
    }
  } catch (error) {
    console.error('Translation service error:', error.message);
  }

  try {
    const cloudTranslate = await getCloudTranslate();
    const targetIso = NLLB_TO_ISO[targetLang] || targetLang;

    if (cloudTranslate && targetIso) {
      const result = await cloudTranslate(text, { from: 'en', to: targetIso });
      const cloudText = typeof result?.text === 'string' ? result.text.trim() : '';
      if (cloudText.length > 0) {
        return cloudText;
      }
    }
  } catch (error) {
    console.error('Cloud translation fallback error:', error.message);
  }

  return text;
};

// Generate answer using Ollama
const generateWithOllama = async (question, studentGrade = 'Class 9') => {
  const systemPrompt = getSystemPrompt(studentGrade);

  const getErrorMessage = (error) => {
    const status = error?.response?.status;
    const data = error?.response?.data;
    const dataText = typeof data === 'string' ? data : JSON.stringify(data || {});
    return `status=${status || 'n/a'} details=${dataText}`;
  };

  try {
    const response = await axios.post(
      `${OLLAMA_HOST}/api/generate`,
      {
        model: OLLAMA_MODEL,
        prompt: `${systemPrompt}\n\nStudent question: ${question}`,
        stream: false,
        options: {
          temperature: 0.6,
          num_predict: 256,
        },
      },
      { timeout: 120000 }
    );

    let answer = typeof response?.data?.response === 'string'
      ? response.data.response.trim()
      : '';

    if (!answer) {
      const retry = await axios.post(
        `${OLLAMA_HOST}/api/generate`,
        {
          model: OLLAMA_MODEL,
          prompt: `${systemPrompt}\n\nStudent question: ${question}\n\nReturn a short direct answer in 3-5 lines.`,
          stream: false,
          options: {
            temperature: 0.4,
            num_predict: 192,
          },
        },
        { timeout: 120000 }
      );

      answer = typeof retry?.data?.response === 'string'
        ? retry.data.response.trim()
        : '';
    }

    if (!answer) {
      return null;
    }

    return {
      answer,
      model: OLLAMA_MODEL,
      source: 'ollama',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Ollama primary error:', error.message, getErrorMessage(error));

    // Fallback #1: simplified generate request with no options
    try {
      const simple = await axios.post(
        `${OLLAMA_HOST}/api/generate`,
        {
          model: OLLAMA_MODEL,
          prompt: `You are a concise Class 9 tutor. Answer clearly in short steps.\n\nQuestion: ${question}`,
          stream: false,
        },
        { timeout: 120000 }
      );

      const answer = typeof simple?.data?.response === 'string' ? simple.data.response.trim() : '';
      if (answer) {
        return {
          answer,
          model: OLLAMA_MODEL,
          source: 'ollama',
          timestamp: new Date().toISOString(),
        };
      }
    } catch (simpleError) {
      console.error('Ollama fallback-generate error:', simpleError.message, getErrorMessage(simpleError));
    }

    // Fallback #2: chat endpoint for instruct-style models
    try {
      const chatResponse = await axios.post(
        `${OLLAMA_HOST}/api/chat`,
        {
          model: OLLAMA_MODEL,
          stream: false,
          messages: [
            { role: 'system', content: 'You are a concise AI Tutor for Class 9 students. Keep the answer accurate and short.' },
            { role: 'user', content: question },
          ],
          options: {
            temperature: 0.4,
            num_predict: 192,
          },
        },
        { timeout: 120000 }
      );

      const answer = typeof chatResponse?.data?.message?.content === 'string'
        ? chatResponse.data.message.content.trim()
        : '';

      if (answer) {
        return {
          answer,
          model: OLLAMA_MODEL,
          source: 'ollama',
          timestamp: new Date().toISOString(),
        };
      }
    } catch (chatError) {
      console.error('Ollama fallback-chat error:', chatError.message, getErrorMessage(chatError));
    }

    if (error.code === 'ECONNABORTED' || /timeout/i.test(error.message || '')) {
      const timeoutError = new Error('Ollama response timed out.');
      timeoutError.code = 'OLLAMA_TIMEOUT';
      throw timeoutError;
    }
    throw error;
  }
};

// Main tutor endpoint
app.post('/tutor', async (req, res) => {
  const requestStartedAt = Date.now();
  try {
    const {
      question,
      studentGrade = 'Class 9',
      userId = 'student_default',
      subject = 'General',
    } = req.body;

    if (!question || typeof question !== 'string') {
      return res.status(400).json({
        error: 'Invalid request. Question is required.'
      });
    }

    console.log(`\n📚 Question received: ${question}`);
    console.log(`👨‍🎓 Student: ${studentGrade}`);

    if (!ollamaAvailable) {
      // Try one last quick check
      await checkOllama();

      if (!ollamaAvailable) {
        return res.status(503).json({
          error: 'Ollama is currently unavailable.',
          suggestion: `Ensure Ollama is running locally with ${OLLAMA_MODEL} installed: ollama pull ${OLLAMA_MODEL}`,
        });
      }
    }

    console.log(`🔄 Generating response with Ollama (${OLLAMA_MODEL})...`);
    const result = await generateWithOllama(question, studentGrade);

    if (!result || !result.answer || result.answer.trim().length === 0) {
      throw new Error('Ollama failed to generate a response');
    }

    recordTutorEvent({
      userId,
      subject,
      question,
      responseTimeMs: Date.now() - requestStartedAt,
    });

    console.log(`✅ Normalized Answer generated`);
    console.log(`📏 Length: ${result.answer.length} characters\n`);

    res.json(result);

  } catch (error) {
    console.error('❌ Error processing question:', error.message);

    if (error.code === 'OLLAMA_TIMEOUT') {
      return res.status(504).json({
        error: 'The AI model took too long to respond.',
        details: 'Please try a shorter question or retry in a few seconds.',
      });
    }

    res.status(500).json({
      error: 'Failed to process your question. Please try again.',
      details: error.message
    });
  }
});

/**
 * Enhanced document processing endpoint (OCR -> Llama Pipeline)
 * Implements tasks: correct, summarize, qa, extract
 */
app.post('/process-document', async (req, res) => {
  try {
    const { text, task = 'correct', customPrompt = null, studentGrade = 'Class 9' } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text content is required' });
    }

    console.log(`\n📄 Doc Process: Task=${task} | Grade=${studentGrade}`);

    let systemPrompt = '';
    let userPrompt = '';

    if (customPrompt) {
      userPrompt = `${customPrompt}\n\nContent:\n${text}`;
    } else {
      switch (task) {
        case 'correct':
          systemPrompt = `You are an OCR correction assistant for ${studentGrade} student. 
          Fix OCR errors, spelling, and formatting. Return ONLY the corrected text, no conversational filler.`;
          userPrompt = `Correct this OCR text:\n\n${text}`;
          break;
        case 'summarize':
          systemPrompt = `You are a summarization assistant for ${studentGrade} student. Provide a concise summary of the provided text. Keep it simple and helpful.`;
          userPrompt = `Summarize this:\n\n${text}`;
          break;
        case 'qa':
          systemPrompt = `Answer questions based ONLY on the provided text for a ${studentGrade} student. If the answer isn't there, say "I cannot find this in the document."`;
          userPrompt = text;
          break;
        case 'extract':
          systemPrompt = `Extract key scientific or historical concepts, names, and dates in structured JSON format.`;
          userPrompt = `Extract from:\n\n${text}`;
          break;
        default:
          userPrompt = text;
      }
    }

    const response = await axios.post(`${OLLAMA_HOST}/api/generate`, {
      model: OLLAMA_MODEL,
      prompt: systemPrompt ? `${systemPrompt}\n\n${userPrompt}` : userPrompt,
      stream: false,
      options: { temperature: 0.3 }
    });

    res.json({
      result: response.data.response,
      task: task,
      model: OLLAMA_MODEL,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Doc processing error:', error.message);
    res.status(500).json({ error: 'Failed to process document with AI' });
  }
});

// Translation endpoint (using NLLB-200)
app.post('/translate', async (req, res) => {
  try {
    const { text, targetLang } = req.body;
    if (!text || !targetLang) {
      return res.status(400).json({ error: 'Text and targetLang are required.' });
    }
    const translation = await translateText(text, targetLang);
    res.json({ translation });
  } catch (error) {
    res.status(500).json({ error: 'Translation failed.' });
  }
});

// Vision endpoint using hf.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF:Q4_K_M (proxied to Ollama)
const VISION_MODEL = process.env.OLLAMA_MODEL || 'hf.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF:Q4_K_M';

app.post('/vision', async (req, res) => {
  try {
    const { image, question, studentGrade = 'Class 9' } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Base64 image data is required' });
    }

    console.log(`\n🔍 Vision request: ${question}`);
    console.log(`📷 Processing with ${VISION_MODEL}...`);

    const systemPrompt = `You are a helpful AI Assistant for ${studentGrade} students. Analyze the provided image and answer the student's question accurately.

GUIDELINES:
- Keep explanations short, concise, and complete.
- If the question is about text in the image, extract and explain it.
- Be highly useful and direct. Use academic but simple language.`;

    const response = await axios.post(
      `${OLLAMA_HOST}/api/generate`,
      {
        model: VISION_MODEL,
        prompt: question || 'Describe this image in detail.',
        system: systemPrompt,
        images: [image], // Ollama expects raw base64 (no data URI prefix)
        stream: false,
        options: {
          temperature: 0.1,
          num_predict: 1024,
        },
      },
      { timeout: 120000 } // 2 minute timeout for vision
    );

    console.log('✅ Vision model responded');

    res.json({
      answer: response.data.response,
      model: VISION_MODEL,
      confidence: 0.95,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Vision error:', error.message);
    res.status(500).json({
      error: 'Vision processing failed',
      details: error.message
    });
  }
});

// OCR endpoint using Tesseract.js (runs on Node.js server)
let tesseractWorker = null;
let tesseractWorkerPromise = null;

const TESSDATA_DIR = path.join(__dirname);
const TESSDATA_LANG_PATH = pathToFileURL(TESSDATA_DIR).href;

const initTesseract = async () => {
  if (!tesseractWorker) {
    if (!tesseractWorkerPromise) {
      tesseractWorkerPromise = (async () => {
        console.log('🔧 Initializing Tesseract OCR worker...');
        const worker = await Tesseract.createWorker('eng+hin', 1, {
          langPath: TESSDATA_LANG_PATH,
          gzip: false,
        });
        console.log(`✅ Tesseract OCR ready (English + Hindi) from ${TESSDATA_DIR}`);
        tesseractWorker = worker;
        return worker;
      })().catch((error) => {
        tesseractWorkerPromise = null;
        throw error;
      });
    }

    return tesseractWorkerPromise;
  }
  return tesseractWorker;
};

// Initialize Tesseract on startup
initTesseract().catch(err => console.error('Tesseract init failed:', err));

app.post('/ocr', async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Base64 image data is required' });
    }

    console.log('📷 Processing OCR request...');
    const worker = await initTesseract();

    // Create buffer from base64
    const imageBuffer = Buffer.from(image, 'base64');

    const { data } = await worker.recognize(imageBuffer);

    console.log(`✅ OCR completed - Confidence: ${data.confidence}%`);

    res.json({
      text: data.text,
      confidence: data.confidence / 100,
      language: 'eng+hin',
      words: data.words?.length || 0
    });

  } catch (error) {
    console.error('❌ OCR Error:', error.message);
    res.status(500).json({ error: 'OCR processing failed', details: error.message });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Shiksha AI Backend running on http://0.0.0.0:${PORT}`);
  console.log(`📚 Accessible at http://192.168.0.109:${PORT} (network)`);
  console.log(`📚 Local Ollama Engine: ${OLLAMA_MODEL}`);
  console.log(`🗄️ Database: ${getDatabaseHealth() ? 'connected' : 'disconnected'}`);
  console.log(`📚 Ready to help students learn!`);
});
