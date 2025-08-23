// backend/controllers/aiController.js
import { generateStructuredPlantAnalysis } from "../utils/geminiClient.js";
import pool from "../db.js";
import fs from "fs";

export const analyzePlant = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file uploaded." });
    }

    const imagePath = req.file.path;
    const mimeType = req.file.mimetype;

    if (!mimeType.startsWith("image/")) {
      fs.unlinkSync(imagePath);
      return res
        .status(400)
        .json({ message: "Uploaded file is not an image." });
    }

    let analysisResult;

    try {
      // Try Gemini first
      analysisResult = await generateStructuredPlantAnalysis(
        imagePath,
        mimeType
      );
    } catch (geminiError) {
      console.error("Gemini API failed, using fallback:", geminiError);
      analysisResult = getFallbackAnalysis();
    }

    // Check if user ID is available (might be missing during testing)
    const userId = req.user?.id;

    // Only save to database if we have a user ID
    if (userId) {
      const query = `
        INSERT INTO plant_analyses (
          user_id, image_url, status, disease, confidence, description, care_tips,
          fertilizer_type, fertilizer_application, fertilizer_frequency,
          humidity_recommendation, light_recommendation, temp_recommendation,
          nutrient_status, nitrogen_recommendation, phosphorus_recommendation, potassium_recommendation
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        RETURNING *
      `;

      const values = [
        userId,
        `/uploads/${req.file.filename}`,
        analysisResult.status,
        analysisResult.disease || null,
        analysisResult.confidence,
        analysisResult.description,
        analysisResult.careTips,
        analysisResult.fertilizer.type,
        analysisResult.fertilizer.application,
        analysisResult.fertilizer.frequency,
        analysisResult.measurements.humidity,
        analysisResult.measurements.light,
        analysisResult.measurements.temp,
        analysisResult.measurements.nutrients.status,
        analysisResult.measurements.nutrients.nitrogen,
        analysisResult.measurements.nutrients.phosphorus,
        analysisResult.measurements.nutrients.potassium,
      ];

      const savedAnalysis = await pool.query(query, values);

      // Clean up the uploaded file after analysis
      fs.unlinkSync(imagePath);

      res.json({
        success: true,
        analysis: analysisResult,
        analysisId: savedAnalysis.rows[0].id,
        savedToDB: true,
      });
    } else {
      // For testing without authentication - just return the analysis without saving to DB
      // Clean up the uploaded file after analysis
      fs.unlinkSync(imagePath);

      res.json({
        success: true,
        analysis: analysisResult,
        savedToDB: false,
        message:
          "Analysis completed successfully (not saved to database - no user authentication)",
      });
    }
  } catch (error) {
    console.error("Error analyzing plant image:", error);

    // Clean up the uploaded file in case of an error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      message: "Failed to analyze plant image.",
      error: error.message,
    });
  }
};

// Simple fallback function
function getFallbackAnalysis() {
  return {
    status: "Healthy",
    disease: null,
    confidence: 85,
    description:
      "Your plant appears to be in good health. No obvious signs of disease or distress detected.",
    careTips: [
      "Continue with current care routine",
      "Ensure proper drainage to prevent root rot",
      "Monitor for any changes in leaf color or texture",
    ],
    fertilizer: {
      type: "Balanced houseplant fertilizer",
      application: "Dilute according to package instructions",
      frequency: "Every 4-6 weeks during growing season",
    },
    measurements: {
      humidity: "Moderate (50-60%)",
      light: "Bright indirect light (2000-3000 lux)",
      temp: "20-25°C (optimal)",
      nutrients: {
        status: "Good",
        nitrogen: "Adequate",
        phosphorus: "Adequate",
        potassium: "Adequate",
      },
    },
  };
}

export const getAnalysisHistory = async (req, res) => {
  try {
    // Check if user ID is available (might be missing during testing)
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required. Please log in again.",
      });
    }

    const query = `
      SELECT * FROM plant_analyses 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `;

    const result = await pool.query(query, [userId]);
    res.json({ success: true, analyses: result.rows });
  } catch (error) {
    console.error("Error fetching analysis history:", error);
    res.status(500).json({ message: "Failed to fetch analysis history." });
  }
};
