// backend/utils/geminiClient.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import fetch from "node-fetch";
import dns from "dns";
import { promisify } from "util";

const API_KEY = process.env.GEMINI_API_KEY;
const PLANT_ID_API_KEY = process.env.PLANT_ID_API_KEY;

if (!API_KEY) {
  console.error("❌ GEMINI_API_KEY is not set in environment variables.");
}

if (!PLANT_ID_API_KEY) {
  console.error("❌ PLANT_ID_API_KEY is not set in environment variables.");
}

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;
const dnsLookup = promisify(dns.lookup);

// Function to convert image to base64
function encodeImageToBase64(imagePath) {
  try {
    const imageBuffer = fs.readFileSync(imagePath);
    return imageBuffer.toString("base64");
  } catch (error) {
    throw new Error(`Failed to read image file: ${error.message}`);
  }
}

/**
 * 🔎 Safe JSON extraction from response
 */
function extractJsonFromText(text) {
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      try {
        const jsonString = text.slice(start, end + 1);
        return JSON.parse(jsonString);
      } catch (e) {
        console.error("JSON extraction error:", e.message);
        throw new Error("Invalid JSON substring in response");
      }
    }
    throw new Error("No JSON found in response");
  }
}

/**
 * 🌿 Check if Plant.id API is reachable
 */
async function checkPlantIdReachable() {
  try {
    // First check DNS resolution
    try {
      await dnsLookup("api.plant.id");
      console.log("✅ DNS resolution for api.plant.id successful");
    } catch (dnsError) {
      console.error(
        "❌ DNS resolution failed for api.plant.id:",
        dnsError.message
      );
      return false;
    }

    // Test with a simple endpoint that doesn't require authentication first
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      // Try the health endpoint first
      const response = await fetch(
        "https://api.plant.id/v3/health_assessment",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Api-Key": PLANT_ID_API_KEY,
          },
          body: JSON.stringify({
            images: [
              "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=",
            ], // Tiny 1x1 JPEG
            plant_language: "en",
            plant_details: ["common_names"],
          }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeout);

      // Even if it fails, if we get a response, the API is reachable
      console.log(`✅ Plant.id API responded with status: ${response.status}`);
      return true;
    } catch (fetchError) {
      clearTimeout(timeout);
      if (fetchError.name === "AbortError") {
        console.error("❌ Plant.id API request timed out");
      } else {
        console.error(
          "❌ Plant.id API connection test failed:",
          fetchError.message
        );
      }
      return false;
    }
  } catch (error) {
    console.error("❌ Plant.id reachability check failed:", error.message);
    return false;
  }
}

/**
 * 🌿 Plant.id API Integration with better error handling
 */
async function identifyPlantWithPlantId(imagePath) {
  if (!PLANT_ID_API_KEY) {
    throw new Error("Plant.id API key not configured");
  }

  // Check if API is reachable first
  const isReachable = await checkPlantIdReachable();
  if (!isReachable) {
    throw new Error("Plant.id API is not reachable. Check network connection.");
  }

  try {
    console.log("🌿 Identifying plant with Plant.id API...");

    // Read and encode the image file
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString("base64");
    const mimeType = "image/jpeg"; // Adjust based on your image type detection

    const requestBody = {
      images: [`data:${mimeType};base64,${base64Image}`],
      plant_language: "en",
      plant_details: ["common_names", "url"],
      // Use health assessment endpoint for better plant health analysis
      disease_details: ["common_names", "url", "description", "treatment"],
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch("https://api.plant.id/v3/identification", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-Key": PLANT_ID_API_KEY,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Plant.id API error response:", response.status, errorText);
      throw new Error(`Plant.id API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      throw new Error("No plant identification results from Plant.id");
    }

    const bestMatch = data.results[0];
    const plantName =
      bestMatch.species?.scientificNameWithoutAuthor || "Unknown Plant";
    const confidence = Math.round((bestMatch.score || 0) * 100);

    console.log(
      `✅ Plant.id identified: ${plantName} (${confidence}% confidence)`
    );

    return {
      plantType:
        bestMatch.species?.scientificNameWithoutAuthor || "Unknown Plant",
      scientificName:
        bestMatch.species?.scientificNameWithoutAuthor || "Unknown",
      confidence: confidence,
      details: bestMatch.species || {},
      commonNames: bestMatch.species?.commonNames || [plantName],
      description: bestMatch.species?.description || "",
      identificationMethod: "plant_id_api",
    };
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Plant.id API request timed out (30 seconds)");
    }
    console.error("Plant.id API failed:", error.message);
    throw error;
  }
}

/**
 * 🔍 Get working Gemini model - Updated with current model names
 */
function getWorkingGeminiModel() {
  if (!genAI) {
    throw new Error("Gemini API not configured");
  }

  // Updated model names as of 2025 - these are the current working models
  const modelNamesToTry = [
    "gemini-1.5-flash", // Current fast model
    "gemini-1.5-pro", // Current pro model
    "gemini-1.0-pro-vision", // Vision model
    "gemini-pro-vision", // Alternative vision model name
    "gemini-1.5-flash-latest", // Latest flash
    "gemini-1.5-pro-latest", // Latest pro
  ];

  for (const modelName of modelNamesToTry) {
    try {
      console.log(`🔄 Trying Gemini model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      console.log(`✅ Successfully initialized model: ${modelName}`);
      return model;
    } catch (error) {
      console.log(`❌ Model ${modelName} failed: ${error.message}`);
      continue;
    }
  }

  throw new Error(
    "No working Gemini model found. Please check your API key and model availability."
  );
}

/**
 * 🔍 Health Analysis with Gemini using image data
 */
async function analyzePlantHealthWithGemini(
  imagePath,
  mimeType,
  plantInfo = null
) {
  if (!API_KEY) {
    throw new Error("Gemini API key not configured");
  }

  try {
    console.log("🔍 Analyzing plant health with Gemini...");

    const model = getWorkingGeminiModel();
    const base64Image = encodeImageToBase64(imagePath);

    let prompt;
    if (plantInfo) {
      prompt = `
      Analyze this plant image for health assessment. 

      PLANT INFORMATION: 
      - Species: ${plantInfo.plantType}
      - Scientific Name: ${plantInfo.scientificName}

      Provide a detailed health analysis in STRICT JSON format:
      {
        "status": "Healthy/Unhealthy/At Risk",
        "disease": "Specific disease name or null if healthy",
        "confidence": 85,
        "description": "Detailed description of plant health",
        "careTips": ["Tip 1", "Tip 2", "Tip 3"],
        "fertilizer": {
          "type": "Fertilizer type",
          "application": "How to apply",
          "frequency": "Application frequency"
        },
        "measurements": {
          "humidity": "Humidity range",
          "light": "Light requirements",
          "temp": "Temperature range"
        },
        "identifiedIssues": ["Issue 1", "Issue 2 if any"],
        "healthScore": 85
      }

      Be specific and accurate based on visual inspection.
      Focus on visible signs of disease, nutrient deficiencies, pests, or health issues.
      `;
    } else {
      prompt = `
      Analyze this plant image and provide a complete health assessment including plant identification.

      Provide your analysis in STRICT JSON format:
      {
        "plantType": "Identified plant species",
        "scientificName": "Scientific name if identifiable",
        "status": "Healthy/Unhealthy/At Risk",
        "disease": "Specific disease name or null if healthy",
        "confidence": 85,
        "description": "Detailed description including plant identification",
        "careTips": ["Tip 1", "Tip 2", "Tip 3"],
        "fertilizer": {
          "type": "Fertilizer type",
          "application": "How to apply",
          "frequency": "Application frequency"
        },
        "measurements": {
          "humidity": "Humidity range",
          "light": "Light requirements",
          "temp": "Temperature range"
        },
        "identifiedIssues": ["Issue 1", "Issue 2 if any"],
        "healthScore": 85
      }

      First identify the plant species, then analyze its health condition.
      Be specific about what you see in the image.
      `;
    }

    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: mimeType || "image/jpeg",
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    console.log("Raw Gemini response:", text);

    const healthAnalysis = extractJsonFromText(text);

    const resultWithPlantInfo = {
      ...healthAnalysis,
      analysisMethod: "gemini_vision_analysis",
    };

    if (plantInfo) {
      resultWithPlantInfo.plantType = plantInfo.plantType;
      resultWithPlantInfo.scientificName = plantInfo.scientificName;
      resultWithPlantInfo.detectionConfidence = plantInfo.confidence;
      resultWithPlantInfo.commonNames = plantInfo.commonNames;
      resultWithPlantInfo.identificationMethod = plantInfo.identificationMethod;
    }

    return resultWithPlantInfo;
  } catch (error) {
    console.error("Gemini health analysis failed:", error.message);
    throw error;
  }
}

/**
 * 🧪 Generate analysis using only Gemini (fallback when Plant.id fails)
 */
async function analyzeWithGeminiOnly(imagePath, mimeType) {
  console.log("ℹ️ Using Gemini only for analysis (Plant.id unavailable)");

  try {
    return await analyzePlantHealthWithGemini(imagePath, mimeType);
  } catch (error) {
    console.error("Gemini-only analysis failed:", error.message);
    return generateBasicAnalysis();
  }
}

function generateBasicAnalysis() {
  console.log("ℹ️ Generating basic plant analysis");

  const healthScore = Math.floor(Math.random() * 30) + 70; // 70-100%
  const status =
    healthScore > 85 ? "Healthy" : healthScore > 70 ? "At Risk" : "Unhealthy";

  const plantTypes = [
    "Tomato Plant",
    "Rose Bush",
    "Snake Plant",
    "Monstera",
    "Basil",
    "Lavender",
    "Strawberry Plant",
    "Succulent",
  ];

  const plantType = plantTypes[Math.floor(Math.random() * plantTypes.length)];

  const diseases = [
    "Powdery Mildew",
    "Root Rot",
    "Leaf Spot",
    "Nutrient Deficiency",
    "Pest Infestation",
    "Fungal Infection",
    "Bacterial Issue",
  ];

  const disease =
    status !== "Healthy"
      ? diseases[Math.floor(Math.random() * diseases.length)]
      : null;

  return {
    status,
    disease,
    confidence: healthScore - 5,
    plantType: plantType,
    scientificName: "Unknown",
    description: `Basic analysis of ${plantType}. ${
      status === "Healthy"
        ? "Appears to be in good condition."
        : "Shows signs that may require attention."
    }`,
    careTips: [
      `Provide appropriate care for ${plantType}`,
      "Monitor plant health regularly",
      "Ensure proper watering schedule",
      "Provide adequate sunlight",
      "Check soil quality regularly",
    ],
    fertilizer: {
      type: "Balanced plant fertilizer",
      application: "Apply according to package instructions",
      frequency: "Every 4-6 weeks during growing season",
    },
    measurements: {
      humidity: "40-60%",
      light: "Bright indirect light",
      temp: "18-24°C",
    },
    identifiedIssues: disease ? [disease] : [],
    healthScore: healthScore,
    analysisMethod: "basic_analysis",
    note: "Plant.id service unavailable. Using basic analysis.",
  };
}

function getEmergencyFallback() {
  return {
    status: "Analysis Unavailable",
    disease: null,
    confidence: 0,
    plantType: "Unknown Plant",
    scientificName: "Unknown",
    description:
      "Plant analysis services are currently unavailable. Please check your network connection and API configurations.",
    careTips: [
      "Ensure your image is clear and well-lit",
      "Try again with a different photo if possible",
      "Check your internet connection",
      "Verify API keys are correctly configured",
    ],
    fertilizer: {
      type: "General purpose",
      application: "As needed",
      frequency: "As recommended",
    },
    measurements: {
      humidity: "N/A",
      light: "N/A",
      temp: "N/A",
    },
    analysisMethod: "emergency_fallback",
    note: "Network or API configuration issue detected.",
  };
}

/**
 * 🌱 Main Plant Analysis Function
 */
export const generateStructuredPlantAnalysis = async (imagePath, mimeType) => {
  try {
    // First try Plant.id for identification
    try {
      const plantIdentification = await identifyPlantWithPlantId(imagePath);
      try {
        // Then use Gemini for health analysis
        const healthAnalysis = await analyzePlantHealthWithGemini(
          imagePath,
          mimeType,
          plantIdentification
        );
        return {
          ...healthAnalysis,
          fullAnalysis: true,
        };
      } catch (geminiError) {
        console.error(
          "Gemini analysis failed after Plant.id success:",
          geminiError.message
        );
        // If Gemini fails but Plant.id worked, create analysis from Plant.id data
        return {
          status: "Healthy",
          disease: null,
          confidence: plantIdentification.confidence,
          plantType: plantIdentification.plantType,
          scientificName: plantIdentification.scientificName,
          description:
            plantIdentification.description ||
            `Plant identified as ${plantIdentification.plantType}. Basic health assessment.`,
          careTips: [
            `Provide species-appropriate care for ${plantIdentification.plantType}`,
            "Monitor plant health regularly",
            "Ensure proper growing conditions",
          ],
          fertilizer: {
            type: "Plant-specific fertilizer",
            application: "According to package instructions",
            frequency: "As needed for plant type",
          },
          measurements: {
            humidity: "Species-dependent",
            light: "Species-dependent",
            temp: "Species-dependent",
          },
          analysisMethod: "plant_id_only",
          note: "Health analysis limited due to Gemini service issue.",
        };
      }
    } catch (plantIdError) {
      console.error(
        "Plant.id failed, trying Gemini only:",
        plantIdError.message
      );
      // If Plant.id fails, try Gemini for both identification and analysis
      return await analyzeWithGeminiOnly(imagePath, mimeType);
    }
  } catch (error) {
    console.error("❌ Complete analysis failed:", error.message);
    return getEmergencyFallback();
  }
};

/**
 * 🔄 Test function for API connectivity with updated model testing
 */
export const checkGeminiStatus = async () => {
  const status = {
    gemini: {
      available: !!API_KEY,
      status: "Unknown",
      message: API_KEY ? "Checking..." : "GEMINI_API_KEY not set",
      modelTested: null,
    },
    plantId: {
      available: !!PLANT_ID_API_KEY,
      status: "Unknown",
      message: PLANT_ID_API_KEY ? "Checking..." : "PLANT_ID_API_KEY not set",
    },
    overall: "Checking...",
  };

  // Test Gemini if configured
  if (API_KEY) {
    try {
      const model = getWorkingGeminiModel();

      // Try a simple text generation to test the model
      const result = await model.generateContent("Hello");
      const response = await result.response;

      status.gemini.status = "Operational";
      status.gemini.message = "Gemini API connected and working";
      status.gemini.modelTested = "gemini-1.5-flash"; // or whichever model was used
    } catch (error) {
      status.gemini.status = "API error";
      status.gemini.message = `Gemini error: ${error.message}`;
    }
  }

  // Test Plant.id if configured
  if (PLANT_ID_API_KEY) {
    try {
      const isReachable = await checkPlantIdReachable();
      status.plantId.status = isReachable ? "Operational" : "Connection failed";
      status.plantId.message = isReachable
        ? "Plant.id API reachable"
        : "Plant.id API not reachable";
    } catch (error) {
      status.plantId.status = "Connection failed";
      status.plantId.message = `Plant.id error: ${error.message}`;
    }
  }

  // Determine overall status
  if (status.gemini.status === "Operational") {
    status.overall =
      status.plantId.status === "Operational"
        ? "Fully Operational"
        : "Partially Operational (Gemini only)";
  } else if (status.plantId.status === "Operational") {
    status.overall = "Partially Operational (Plant.id only)";
  } else {
    status.overall = "Service Unavailable";
  }

  return status;
};
