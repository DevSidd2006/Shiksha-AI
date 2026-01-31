#!/usr/bin/env node

/**
 * Test Vision Model Endpoint
 * Tests the /vision endpoint without OCR or other dependencies
 * 
 * Usage:
 *   node test-vision.js <image_path> [question]
 * 
 * Example:
 *   node test-vision.js /path/to/image.jpg "What is in this image?"
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const TIMEOUT = 120000; // 2 minutes for vision model

async function testVision() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('❌ No image path provided');
    console.log('\nUsage:');
    console.log('  node test-vision.js <image_path> [question]\n');
    console.log('Example:');
    console.log('  node test-vision.js ./test-image.jpg "What is in this image?"\n');
    process.exit(1);
  }

  const imagePath = args[0];
  const question = args[1] || 'Describe this image in detail.';

  // Check if file exists
  if (!fs.existsSync(imagePath)) {
    console.log(`❌ File not found: ${imagePath}`);
    process.exit(1);
  }

  try {
    console.log('\n📸 Vision Model Test');
    console.log('='.repeat(50));
    console.log(`📁 Image: ${imagePath}`);
    console.log(`❓ Question: ${question}`);
    console.log(`🔗 Backend: ${BACKEND_URL}`);
    console.log(`⏱️  Timeout: ${TIMEOUT / 1000}s\n`);

    // Read image and convert to base64
    console.log('📖 Reading image...');
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    console.log(`✅ Image loaded (${(imageBuffer.length / 1024).toFixed(2)} KB)\n`);

    // Send to vision endpoint
    console.log('🚀 Sending to /vision endpoint...');
    const startTime = Date.now();
    
    const response = await axios.post(
      `${BACKEND_URL}/vision`,
      {
        image: base64Image,
        question: question,
        studentGrade: 'Class 9',
      },
      { timeout: TIMEOUT }
    );

    const duration = Date.now() - startTime;

    console.log(`✅ Response received in ${(duration / 1000).toFixed(2)}s\n`);
    console.log('📊 Response:');
    console.log('-'.repeat(50));
    console.log(`Model: ${response.data.model}`);
    console.log(`Confidence: ${response.data.confidence * 100}%`);
    console.log(`\nAnswer:\n${response.data.answer}`);
    console.log('-'.repeat(50));
    console.log('\n✅ Vision model test PASSED\n');

  } catch (error) {
    const duration = Date.now();
    console.log(`\n❌ Vision model test FAILED`);
    console.log('-'.repeat(50));
    
    if (error.code === 'ECONNREFUSED') {
      console.log(`Error: Cannot connect to ${BACKEND_URL}`);
      console.log('Make sure the backend is running: cd backend && npm start\n');
    } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      console.log(`Error: Request timeout after ${TIMEOUT / 1000}s`);
      console.log('The vision model may be slow or not available.\n');
    } else {
      console.log(`Error: ${error.response?.data?.error || error.message}\n`);
      if (error.response?.data?.details) {
        console.log(`Details: ${error.response.data.details}\n`);
      }
    }

    console.log('Troubleshooting:');
    console.log('1. Verify backend is running: cd backend && npm start');
    console.log('2. Check Ollama is running: ollama serve');
    console.log('3. Verify gemma3:latest is installed: ollama list | grep gemma');
    console.log('4. Try a simple text query first: curl http://localhost:11434/api/tags\n');
    
    process.exit(1);
  }
}

testVision();
