// backend/utils/geminiDiscovery.js
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error("GEMINI_API_KEY is not set in environment variables.");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

export const listAvailableModels = async () => {
  try {
    const result = await genAI.listModels();
    console.log("Available models:");
    result.models.forEach((model) => {
      console.log(
        `- ${model.name} (Supported methods: ${
          model.supportedGenerationMethods?.join(", ") || "None"
        })`
      );
    });
    return result.models;
  } catch (error) {
    console.error("Error listing models:", error);
    throw error;
  }
};

// Run this to discover models
// listAvailableModels().catch(console.error);
