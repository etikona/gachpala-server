// backend/utils/geminiClient.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error("GEMINI_API_KEY is not set in environment variables.");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

// Try different model names that might work
const tryModelNames = [
  "gemini-1.0-pro",
  "gemini-pro",
  "models/gemini-pro",
  "gemini-1.5-pro",
  "models/gemini-1.5-pro",
];

export const getGeminiModel = (modelName = "gemini-1.0-pro") => {
  try {
    return genAI.getGenerativeModel({ model: modelName });
  } catch (error) {
    console.log(`Model ${modelName} failed, trying alternatives...`);

    // Try alternative model names
    for (const alternativeModel of tryModelNames) {
      if (alternativeModel !== modelName) {
        try {
          console.log(`Trying model: ${alternativeModel}`);
          return genAI.getGenerativeModel({ model: alternativeModel });
        } catch (e) {
          console.log(`Model ${alternativeModel} also failed`);
          continue;
        }
      }
    }

    throw new Error("All model attempts failed: " + error.message);
  }
};

// Function to convert image to base64
function encodeImageToBase64(imagePath) {
  const imageBuffer = fs.readFileSync(imagePath);
  return imageBuffer.toString("base64");
}

export const generateStructuredPlantAnalysis = async (imagePath, mimeType) => {
  let model;
  let successfulModel = "";

  // Try each model until one works
  for (const modelName of tryModelNames) {
    try {
      model = genAI.getGenerativeModel({ model: modelName });
      successfulModel = modelName;
      console.log(`Using model: ${modelName}`);
      break;
    } catch (error) {
      console.log(`Model ${modelName} failed: ${error.message}`);
      continue;
    }
  }

  if (!model) {
    throw new Error("No working Gemini model found");
  }

  // Convert image to base64
  const base64Image = encodeImageToBase64(imagePath);

  const prompt = `
  Analyze this plant image (provided as base64 data) and provide a detailed health assessment in JSON format with the following structure:
  {
    "status": "Healthy/Unhealthy/At Risk",
    "disease": "Name of disease if any, otherwise null",
    "confidence": 0-100 percentage,
    "description": "Detailed description of plant health",
    "careTips": ["Array of care tips"],
    "fertilizer": {
      "type": "Recommended fertilizer type",
      "application": "How to apply",
      "frequency": "Application frequency"
    },
    "measurements": {
      "humidity": "Recommended humidity level",
      "light": "Recommended light level",
      "temp": "Recommended temperature",
      "nutrients": {
        "status": "Overall nutrient status",
        "nitrogen": "Nitrogen level recommendation",
        "phosphorus": "Phosphorus level recommendation",
        "potassium": "Potassium level recommendation"
      }
    }
  }
  
  I will provide the image data as base64. Please analyze it and provide only valid JSON without any additional text or markdown formatting.
  
  Image data: data:${mimeType};base64,${base64Image}
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log("Raw AI response:", text);

    // Clean the response to extract only JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error(
        "AI response is not in valid JSON format. Response was: " + text
      );
    }

    const parsedResponse = JSON.parse(jsonMatch[0]);
    console.log("Successfully parsed response with model:", successfulModel);

    return parsedResponse;
  } catch (error) {
    console.error(
      "Error generating structured analysis with model",
      successfulModel,
      ":",
      error
    );
    throw error;
  }
};
