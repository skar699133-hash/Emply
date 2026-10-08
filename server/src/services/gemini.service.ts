import { GoogleGenAI } from '@google/genai';
import { config } from '../config.js';

let genAIClient: GoogleGenAI | null = null;

function getClient(): GoogleGenAI | null {
  const apiKey = config.geminiApiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    return null;
  }
  if (!genAIClient) {
    try {
      genAIClient = new GoogleGenAI({ apiKey: apiKey.trim() });
      console.log(`[GeminiService] Initialized Google Gemini client (${config.geminiModel})`);
    } catch (err) {
      console.warn('[GeminiService] Could not initialize GoogleGenAI client:', err);
      genAIClient = null;
    }
  }
  return genAIClient;
}

// Initial check
if (config.geminiApiKey) {
  getClient();
} else {
  console.log('[GeminiService] No GEMINI_API_KEY detected in environment. Intelligent deterministic engine will run until GEMINI_API_KEY is provided in server/.env.');
}

export async function generateGeminiJson<T>(prompt: string, systemInstruction?: string): Promise<T | null> {
  const client = getClient();
  if (!client) {
    return null;
  }

  try {
    const response = await client.models.generateContent({
      model: config.geminiModel,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text) as T;
  } catch (error) {
    console.error('[GeminiService] Gemini API call failed, falling back to deterministic reasoning engine:', error);
    return null;
  }
}

export async function generateGeminiText(prompt: string, systemInstruction?: string): Promise<string | null> {
  const client = getClient();
  if (!client) {
    return null;
  }

  try {
    const response = await client.models.generateContent({
      model: config.geminiModel,
      contents: prompt,
      config: {
        systemInstruction,
      },
    });

    return response.text || null;
  } catch (error) {
    console.error('[GeminiService] Gemini API text call failed:', error);
    return null;
  }
}
