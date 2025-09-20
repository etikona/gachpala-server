// backend/routes/ai.route.js
import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import upload from "../middlewares/upload.middleware.js";
import {
  analyzePlant,
  deleteAnalysis,
  getAnalysisById,
  getAnalysisHistory,
  getApiStatus,
} from "../controllers/ai.controller.js";
import pool from "../db.js";
import { savePlantAnalysis } from "../models/plantAnalysis.model.js";
const aiRouter = Router();

//Temporary endpoint for testing without auth
// Update your test-add route
aiRouter.post("/test-add", async (req, res) => {
  try {
    const testData = {
      userId: 19, // CHANGE FROM 1 TO 19 to match your JWT user ID
      imageUrl: "/uploads/test-plant.jpg",
      status: "Healthy",
      disease: "None",
      confidence: 85,
      description: "Test plant description",
      careTips: ["Water regularly", "Provide sunlight"],
      fertilizer: {
        type: "Test fertilizer",
        application: "As directed",
        frequency: "Monthly",
      },
      measurements: {
        humidity: "50%",
        light: "Bright",
        temp: "22°C",
        nutrients: {
          status: "Good",
          nitrogen: "Moderate",
          phosphorus: "Moderate",
          potassium: "Moderate",
        },
      },
      plantType: "Test Plant",
      scientificName: "Testus plantus",
      healthScore: 90,
      analysisMethod: "test",
    };

    const result = await savePlantAnalysis(testData);

    res.json({
      success: true,
      message: "Test data added successfully",
      data: result,
    });
  } catch (error) {
    console.error("Test add error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

aiRouter.get("/debug-analysis-history", authMiddleware, async (req, res) => {
  try {
    // For testing: Get analyses for ANY user (remove the user_id filter)
    const query = `
      SELECT 
        id, 
        image_url, 
        status, 
        disease, 
        confidence, 
        description, 
        care_tips,
        plant_type,
        scientific_name,
        health_score,
        created_at,
        user_id
      FROM plant_analyses 
      ORDER BY created_at DESC 
      LIMIT 10
    `;

    const result = await pool.query(query);

    console.log("All analyses:", result.rows);

    // Format the results
    const analyses = result.rows.map((row) => ({
      id: row.id,
      plantType: row.plant_type,
      scientificName: row.scientific_name,
      status: row.status,
      disease: row.disease,
      confidence: row.confidence,
      description: row.description,
      careTips: row.care_tips,
      healthScore: row.health_score,
      imageUrl: row.image_url,
      createdAt: row.created_at,
      plantName: row.plant_type,
      healthStatus: row.status,
      overallHealth: row.health_score,
      recommendations: row.care_tips,
      userId: row.user_id, // Include for debugging
    }));

    res.json({
      success: true,
      data: analyses,
      message: "Showing all analyses (debug mode)",
    });
  } catch (error) {
    console.error("Error in debug route:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

aiRouter.post(
  "/plant-image-test", // Different endpoint for testing without auth
  upload.single("plant"),
  authMiddleware,
  analyzePlant
);

aiRouter.post(
  "/plant-image",
  authMiddleware,
  upload.single("plant"),
  analyzePlant
);

aiRouter.get("/api-status", getApiStatus);
aiRouter.get("/analysis/:id", authMiddleware, getAnalysisById);

aiRouter.get("/analysis-history", authMiddleware, getAnalysisHistory);
aiRouter.delete("/analysis/:id", authMiddleware, deleteAnalysis);
export default aiRouter;
