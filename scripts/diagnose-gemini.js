// backend/scripts/diagnose-gemini.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;
console.log(API_KEY);
async function diagnoseGemini() {
  console.log("🔍 Diagnosing Gemini API Configuration...");
  console.log("API Key present:", !!API_KEY);

  if (!API_KEY) {
    console.log("❌ GEMINI_API_KEY is not set in environment variables.");
    console.log(
      "Please add GEMINI_API_KEY=your_actual_api_key to your .env file"
    );
    return;
  }

  console.log("API Key format:", API_KEY.substring(0, 10) + "...");

  const genAI = new GoogleGenerativeAI(API_KEY);

  try {
    // Test 1: List available models
    console.log("\n1. Testing model discovery...");
    try {
      const models = await genAI.listModels();
      console.log("✅ Model discovery successful");
      console.log(
        "Available models:",
        models.models.map((m) => m.name).join(", ")
      );
    } catch (error) {
      console.log("❌ Model discovery failed:", error.message);
    }

    // Test 2: Try to use a specific model
    console.log("\n2. Testing model access...");
    const testModels = ["gemini-pro", "models/gemini-pro"];

    for (const modelName of testModels) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hello");
        console.log(`✅ Model ${modelName}: Success`);
        break;
      } catch (error) {
        console.log(`❌ Model ${modelName}: ${error.message}`);
      }
    }
  } catch (error) {
    console.log("❌ General API error:", error.message);
    console.log("\n🔧 Troubleshooting steps:");
    console.log("1. Check if your API key is valid");
    console.log("2. Ensure Gemini API is enabled in Google Cloud Console");
    console.log("3. Verify your billing is set up correctly");
    console.log("4. Check if your API key has proper permissions");
  }
}

diagnoseGemini();
