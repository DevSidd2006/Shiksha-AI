const express = require('express');
const cors = require('cors');
const axios = require('axios');
const Tesseract = require('tesseract.js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for base64 images

// Ollama configuration
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:3b';
const TRANSLATOR_SERVICE_URL = process.env.TRANSLATOR_SERVICE_URL || 'http://localhost:3001';

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

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Siksha AI Backend is running',
    version: '1.0.0',
    ollama: ollamaAvailable ? 'connected' : 'disconnected',
    aiModel: OLLAMA_MODEL
  });
});

// System prompt for student context
const getSystemPrompt = (studentGrade = 'Class 9') => {
  return `You are an expert AI Tutor specifically for Class 9 students (strictly following NCERT/Class 9 level curriculum).

CORE INSTRUCTIONS:
- The student is in Class 9. Tailor all explanations to their level of understanding.
- DO NOT give long, wordy answers. Keep it brief.
- Be concise but complete. Explain the core concept fully but without filler.
- Use a helpful, encouraging, and academic tone.
- Format with bullet points if helpful for clarity.
- Ensure the answer is highly useful and directly addresses the query.
- Use simple analogies to explain complex scientific or mathematical concepts.

Mantra: Short, complete, and useful.`;
};

// Language Translation (Using NLLB-200 microservice)
const translateText = async (text, targetLang) => {
  try {
    const response = await axios.post(`${TRANSLATOR_SERVICE_URL}/translate`, {
      text: text,
      tgt_lang: targetLang,
      src_lang: 'eng_Latn'
    });
    return response.data.translation;
  } catch (error) {
    console.error('Translation service error:', error.message);
    return text; // Fallback to original text
  }
};

// Generate answer using Ollama
const generateWithOllama = async (question, studentGrade = 'Class 9') => {
  try {
    const response = await axios.post(
      `${OLLAMA_HOST}/api/generate`,
      {
        model: OLLAMA_MODEL,
        prompt: `${getSystemPrompt(studentGrade)}\n\nStudent question: ${question}`,
        stream: false,
        temperature: 0.7,
      },
      { timeout: 30000 }
    );

    return {
      answer: response.data.response,
      model: OLLAMA_MODEL,
      source: 'ollama',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Ollama error:', error.message);
    return null;
  }
};

// Main tutor endpoint
app.post('/tutor', async (req, res) => {
  try {
    const { question, studentGrade = 'Class 9' } = req.body;

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
          suggestion: 'Ensure Ollama is running locally with llama3.2:3b installed.',
        });
      }
    }

    console.log(`🔄 Generating response with Ollama (${OLLAMA_MODEL})...`);
    const result = await generateWithOllama(question, studentGrade);

    if (!result) {
      throw new Error('Ollama failed to generate a response');
    }

    console.log(`✅ Normalized Answer generated`);
    console.log(`📏 Length: ${result.answer.length} characters\n`);

    res.json(result);

  } catch (error) {
    console.error('❌ Error processing question:', error.message);

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

// OCR endpoint using Tesseract.js (runs on Node.js server)
let tesseractWorker = null;

const initTesseract = async () => {
  if (!tesseractWorker) {
    console.log('🔧 Initializing Tesseract OCR worker...');
    tesseractWorker = await Tesseract.createWorker('eng+hin');
    console.log('✅ Tesseract OCR ready (English + Hindi)');
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
app.listen(PORT, () => {
  console.log(`🚀 Siksha AI Backend running on http://localhost:${PORT}`);
  console.log(`📚 Local Ollama Engine: ${OLLAMA_MODEL}`);
  console.log(`📚 Ready to help students learn!`);
});
