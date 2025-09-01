// backend/utils/geminiClient.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import fetch from "node-fetch";

const API_KEY = process.env.GEMINI_API_KEY;
const PLANT_ID_API_KEY = process.env.PLANT_ID_API_KEY;

if (!API_KEY)
  console.error("❌ GEMINI_API_KEY is not set in environment variables.");
if (!PLANT_ID_API_KEY)
  console.error("❌ PLANT_ID_API_KEY is not set in environment variables.");

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

/** Encode image → base64 */
function encodeImageToBase64(imagePath) {
  const imageBuffer = fs.readFileSync(imagePath);
  return imageBuffer.toString("base64");
}

/** Safe JSON extractor for Gemini responses */
function extractJsonFromText(text) {
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start !== -1 && end !== -1) {
      try {
        return JSON.parse(text.slice(start, end + 1));
      } catch (e) {
        console.error("❌ JSON extraction error:", e.message);
        throw new Error("Invalid JSON substring in response");
      }
    }
    throw new Error("No JSON found in response");
  }
}

/** 🌿 Plant.id identification API */
async function identifyPlantWithPlantId(imagePath) {
  if (!PLANT_ID_API_KEY) throw new Error("Plant.id API key not configured");

  const imageBuffer = fs.readFileSync(imagePath);
  const formData = new FormData();
  const blob = new Blob([imageBuffer]);
  formData.append("images", blob);
  formData.append(
    "modifiers",
    JSON.stringify(["crops_fast", "similar_images"])
  );
  formData.append(
    "plant_details",
    JSON.stringify([
      "common_names",
      "url",
      "name_authority",
      "wiki_description",
      "taxonomy",
      "synonyms",
    ])
  );

  const response = await fetch("https://api.plant.id/v3/identification", {
    method: "POST",
    headers: {
      "Api-Key": PLANT_ID_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      images: [imageBuffer.toString("base64")],
      modifiers: ["crops_fast", "similar_images"],
      plant_details: [
        "common_names",
        "url",
        "name_authority",
        "wiki_description",
        "taxonomy",
        "synonyms",
      ],
    }),
  });

  if (!response.ok)
    throw new Error(`Plant.id identify API error: ${response.status}`);

  const data = await response.json();
  if (!data.suggestions?.length)
    throw new Error("No plant identification results from Plant.id");

  const bestMatch = data.suggestions[0];
  return {
    plantType: bestMatch.plant_name || "Unknown Plant",
    scientificName:
      bestMatch.plant_details?.scientific_name || bestMatch.plant_name,
    confidence: Math.round(bestMatch.probability * 100),
    details: bestMatch.plant_details || {},
    commonNames: bestMatch.plant_details?.common_names || [],
    description: bestMatch.plant_details?.wiki_description?.value || "",
    taxonomy: bestMatch.plant_details?.taxonomy || {},
    identificationMethod: "plant_id_api",
  };
}

/** 🩺 Plant.id health API */
export async function analyzePlantHealthWithPlantId(imagePath) {
  if (!PLANT_ID_API_KEY) throw new Error("Plant.id API key not configured");

  try {
    const imageBuffer = fs.readFileSync(imagePath);

    const response = await fetch("https://api.plant.id/v3/health_assessment", {
      method: "POST",
      headers: {
        "Api-Key": PLANT_ID_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        images: [imageBuffer.toString("base64")],
        modifiers: ["crops_fast", "similar_images"],
        disease_details: ["common_names", "url", "description"],
      }),
    });

    if (!response.ok)
      throw new Error(`Plant.id health API error: ${response.status}`);

    const data = await response.json();

    // Check if plant is healthy
    const isHealthy = data.health_assessment?.is_healthy?.probability > 0.5;
    const diseases = data.health_assessment?.diseases || [];

    let status = "Healthy";
    let diseaseNames = [];
    let confidence = Math.round(
      (data.health_assessment?.is_healthy?.probability || 0) * 100
    );

    if (!isHealthy && diseases.length > 0) {
      status = "Unhealthy";
      diseaseNames = diseases
        .filter((d) => d.probability > 0.1)
        .map((d) => d.name)
        .slice(0, 3); // Top 3 diseases
      confidence = Math.round(diseases[0]?.probability * 100) || 50;
    }

    return {
      status,
      disease: diseaseNames.length ? diseaseNames.join(", ") : null,
      description: diseaseNames.length
        ? `Detected issues: ${diseaseNames.join(", ")}`
        : "No visible signs of disease or pest damage.",
      identifiedIssues: diseaseNames,
      confidence,
      healthScore: Math.round(
        (data.health_assessment?.is_healthy?.probability || 0.5) * 100
      ),
      analysisMethod: "plant_id_health_api",
      rawData: data, // Keep for debugging
    };
  } catch (err) {
    console.error("❌ Plant.id health analysis failed:", err.message);
    return null;
  }
}

/** 🔍 Gemini enrichment (personalized care tips) */
async function analyzePlantHealthWithGemini(
  imagePath,
  mimeType,
  plantInfo,
  healthAnalysis
) {
  if (!API_KEY) throw new Error("Gemini API key not configured");

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-pro",
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 2000,
      responseMimeType: "application/json",
    },
  });

  const base64Image = encodeImageToBase64(imagePath);

  const prompt = `
You are an expert plant botanist and plant doctor. Analyze the following plant and provide detailed care instructions.

📌 Plant Information:
- Species: ${plantInfo.plantType} (${plantInfo.scientificName})
- Confidence: ${plantInfo.confidence}%
- Health Status: ${healthAnalysis?.status || "Unknown"}
- Detected Issues: ${healthAnalysis?.disease || "None"}
- Health Score: ${healthAnalysis?.healthScore || "Unknown"}%

📌 Your Task:
Analyze the plant image and the provided information to create comprehensive care recommendations. 
Return ONLY valid JSON with no additional text or markdown.

The JSON structure must be:
{
  "careTips": [
    "Specific care tip 1 for this exact plant species",
    "Specific care tip 2 addressing current health status", 
    "Specific care tip 3 for optimal growth",
    "Specific care tip 4 for maintenance",
    "Specific care tip 5 for long-term health"
  ],
  "watering": {
    "frequency": "Specific frequency (e.g., 'Every 7-10 days' or 'When top 2 inches dry')",
    "amount": "Specific amount guidance",
    "method": "Best watering method for this species",
    "seasonalAdjustment": "How to adjust watering by season"
  },
  "fertilizer": {
    "type": "Specific fertilizer type best for this plant",
    "npkRatio": "Recommended NPK ratio (e.g., '10-10-10' or '20-20-20')",
    "application": "Detailed application instructions",
    "frequency": "Specific frequency (e.g., 'Every 2 weeks during growing season')",
    "seasonalSchedule": "When to fertilize throughout the year"
  },
  "measurements": {
    "humidity": "Specific humidity range (e.g., '45-65%')",
    "light": "Specific light requirements with duration",
    "temperature": "Ideal temperature range in Celsius",
    "soilPh": "Optimal soil pH range",
    "airCirculation": "Air circulation requirements"
  },
  "treatment": {
    "currentIssues": [
      "Address any current health issues detected"
    ],
    "preventiveCare": [
      "Preventive measures for common issues of this species"
    ],
    "commonProblems": [
      "Most common problems for this specific plant type"
    ],
    "solutions": [
      "Specific treatment solutions matching the problems listed"
    ],
    "organicOptions": [
      "Natural/organic treatment alternatives"
    ]
  },
  "seasonalCare": {
    "spring": "Spring care adjustments",
    "summer": "Summer care adjustments", 
    "autumn": "Autumn care adjustments",
    "winter": "Winter care adjustments"
  },
  "repotting": {
    "frequency": "How often to repot",
    "bestTime": "Best time of year to repot",
    "soilMix": "Recommended soil mixture",
    "potSize": "Guidelines for pot sizing"
  }
}

Focus on the specific plant species identified and tailor all recommendations accordingly.
`;

  const imagePart = {
    inlineData: {
      data: base64Image,
      mimeType: mimeType,
    },
  };

  try {
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    return extractJsonFromText(text);
  } catch (err) {
    console.error("❌ Gemini analysis error:", err.message);
    throw err;
  }
}

/** 🧪 Fallback analysis when APIs fail */
async function generateGenericAnalysis() {
  return {
    status: "Analysis Unavailable",
    disease: null,
    confidence: 0,
    plantType: "Unknown Plant",
    scientificName: "Unknown species",
    description:
      "Plant analysis services are temporarily unavailable. Please check your API keys and try again.",
    careTips: [
      "Place in bright, indirect light",
      "Water when top inch of soil feels dry",
      "Maintain humidity around 40-60%",
      "Keep temperature between 18-24°C",
      "Inspect regularly for pests or diseases",
    ],
    watering: {
      frequency: "When top inch dry",
      amount: "Until water drains from bottom",
      method: "Water at soil level",
      seasonalAdjustment: "Reduce in winter",
    },
    fertilizer: {
      type: "Balanced liquid fertilizer",
      npkRatio: "10-10-10",
      application: "Dilute to half strength",
      frequency: "Monthly during growing season",
      seasonalSchedule: "Spring through early fall",
    },
    measurements: {
      humidity: "40-60%",
      light: "Bright indirect light",
      temperature: "18-24°C",
      soilPh: "6.0-7.0",
      airCirculation: "Good ventilation",
    },
    treatment: {
      currentIssues: ["Unable to assess current health"],
      preventiveCare: ["Regular inspection", "Proper watering"],
      commonProblems: ["Overwatering", "Insufficient light", "Pest issues"],
      solutions: [
        "Adjust care routine",
        "Monitor closely",
        "Consult local expert",
      ],
      organicOptions: ["Neem oil for pests", "Compost for nutrition"],
    },
    analysisMethod: "generic_fallback",
  };
}

/** 🌱 Main pipeline: Plant.id → Health → Gemini → Final JSON */
export const generateStructuredPlantAnalysis = async (imagePath, mimeType) => {
  try {
    console.log("🔍 Starting plant identification...");
    const plantIdentification = await identifyPlantWithPlantId(imagePath);
    console.log(`✅ Plant identified: ${plantIdentification.plantType}`);

    console.log("🩺 Analyzing plant health...");
    let healthAnalysis = await analyzePlantHealthWithPlantId(imagePath);
    if (!healthAnalysis) {
      console.log("⚠️ Health analysis failed, using fallback");
      healthAnalysis = {
        status: "Unknown",
        disease: null,
        description: "Health analysis temporarily unavailable",
        confidence: 0,
        healthScore: 50,
      };
    } else {
      console.log(`✅ Health analysis complete: ${healthAnalysis.status}`);
    }

    console.log("🤖 Getting Gemini care recommendations...");
    let enrichment = {};
    try {
      enrichment = await analyzePlantHealthWithGemini(
        imagePath,
        mimeType,
        plantIdentification,
        healthAnalysis
      );
      console.log("✅ Gemini analysis complete");
    } catch (err) {
      console.error("⚠️ Gemini enrichment failed:", err.message);
      // Provide basic care structure if Gemini fails
      enrichment = {
        careTips: [
          `Provide appropriate care for ${plantIdentification.plantType}`,
          "Monitor plant health regularly",
          "Adjust watering based on season",
        ],
        watering: {
          frequency: "As needed for this species",
          amount: "Moderate",
          method: "Standard watering",
        },
        fertilizer: {
          type: "General purpose",
          application: "Follow package instructions",
          frequency: "Monthly during growing season",
        },
        measurements: {
          humidity: "40-60%",
          light: "Appropriate for species",
          temperature: "18-24°C",
        },
        treatment: {
          commonProblems: ["Standard plant care issues"],
          solutions: ["Monitor and adjust care as needed"],
        },
      };
    }

    const finalResult = {
      ...plantIdentification,
      ...healthAnalysis,
      ...enrichment,
      fullAnalysis: true,
      analysisTimestamp: new Date().toISOString(),
    };

    console.log("🎉 Analysis pipeline completed successfully");
    return finalResult;
  } catch (err) {
    console.error("❌ Full pipeline failed:", err.message);
    return await generateGenericAnalysis();
  }
};

/** 🔄 API connectivity check */
export const checkGeminiStatus = async () => {
  const status = {
    gemini: { available: !!API_KEY, status: "Unknown", message: "" },
    plantId: { available: !!PLANT_ID_API_KEY, status: "Unknown", message: "" },
    overall: "Unknown",
  };

  // Check Plant.id API
  if (PLANT_ID_API_KEY) {
    try {
      const res = await fetch("https://api.plant.id/v3/usage_info", {
        method: "GET",
        headers: { "Api-Key": PLANT_ID_API_KEY },
      });

      if (res.ok) {
        const data = await res.json();
        status.plantId.status = "Operational";
        status.plantId.message = `Plant.id API connected. Credits: ${
          data.available || "N/A"
        }`;
      } else {
        status.plantId.status = "Error";
        status.plantId.message = `Plant.id API error: ${res.status}`;
      }
    } catch (err) {
      status.plantId.status = "Error";
      status.plantId.message = "Plant.id API unreachable";
    }
  } else {
    status.plantId.message = "API key not configured";
  }

  // Check Gemini API
  if (API_KEY) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      await model.generateContent("Test connection");
      status.gemini.status = "Operational";
      status.gemini.message = "Gemini API connected";
    } catch (err) {
      status.gemini.status = "Error";
      status.gemini.message = `Gemini API error: ${err.message}`;
    }
  } else {
    status.gemini.message = "API key not configured";
  }

  // Overall status
  status.overall =
    status.gemini.status === "Operational" &&
    status.plantId.status === "Operational"
      ? "Ready"
      : "Partial functionality";

  return status;
};
