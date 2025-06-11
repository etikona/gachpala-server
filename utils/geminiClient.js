// backend/utils/geminiClient.js
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error("GEMINI_API_KEY is not set in environment variables.");
  // In a real app, you might want to throw an error or handle this more gracefully
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

export const getGeminiModel = (modelName = "gemini-pro-vision") => {
  return genAI.getGenerativeModel({ model: modelName });
};
