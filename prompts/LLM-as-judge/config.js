import 'dotenv/config';
import OpenAI from 'openai';

export const config = {
  openaiApiKey: process.env.OPENAI_API_KEY,
  geminiApiKey: process.env.GEMINI_API_KEY,
  maxRetries: 3,
  requestTimeout: 30000,
};

// Validate required environment variables
if (!config.openaiApiKey) {
  throw new Error('OPENAI_API_KEY environment variable is required');
}

if (!config.geminiApiKey) {
  throw new Error('GEMINI_API_KEY environment variable is required');
}

// Create OpenAI clients for both services
export const openaiClient = new OpenAI({
  apiKey: config.openaiApiKey,
});

export const geminiClient = new OpenAI({
  apiKey: config.geminiApiKey,
  baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai',
});