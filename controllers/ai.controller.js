// backend/controllers/aiController.js
import {
  generateStructuredPlantAnalysis,
  checkGeminiStatus,
} from "../utils/geminiClient.js";
import { savePlantAnalysis } from "../models/plantAnalysis.model.js";
import pool from "../db.js";
import fs from "fs";
import path from "path";

export const analyzePlant = async (req, res) => {
  try {
    // Validate file upload
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file uploaded.",
      });
    }

    const imagePath = req.file.path;
    const mimeType = req.file.mimetype;

    // Validate file type
    if (!mimeType.startsWith("image/")) {
      fs.unlinkSync(imagePath);
      return res.status(400).json({
        success: false,
        message: "Uploaded file is not an image.",
      });
    }

    // Validate file size (optional - add max size limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (req.file.size > maxSize) {
      fs.unlinkSync(imagePath);
      return res.status(400).json({
        success: false,
        message: "Image file too large. Maximum size is 10MB.",
      });
    }

    console.log(`🔍 Starting analysis for: ${req.file.filename}`);
    console.log(`📁 File path: ${imagePath}`);
    console.log(`📊 File size: ${(req.file.size / 1024 / 1024).toFixed(2)}MB`);

    // Check API status first
    const apiStatus = await checkGeminiStatus();
    console.log("🔗 API Status:", apiStatus);

    let analysisResult;
    try {
      // Perform plant analysis
      analysisResult = await generateStructuredPlantAnalysis(
        imagePath,
        mimeType
      );
      console.log("✅ Analysis completed successfully");

      // Add metadata to result
      analysisResult.metadata = {
        fileName: req.file.filename,
        fileSize: req.file.size,
        uploadDate: new Date().toISOString(),
        processingTime: Date.now() - req.startTime, // Add this middleware to track time
      };
    } catch (analysisError) {
      console.error("❌ Analysis failed:", analysisError.message);
      fs.unlinkSync(imagePath);

      return res.status(500).json({
        success: false,
        message: "Plant analysis failed",
        error: analysisError.message,
        suggestion: "Please try again with a clearer image of the plant",
        apiStatus,
      });
    }

    const userId = req.user?.id;
    let savedAnalysisId = null;

    // Save to database if user is authenticated
    if (userId) {
      try {
        console.log(`💾 Saving analysis to database for user: ${userId}`);

        // Prepare data for database
        const analysisData = {
          userId,
          imageUrl: `/uploads/${req.file.filename}`,
          status: analysisResult.status || "Unknown",
          disease: analysisResult.disease,
          confidence: analysisResult.confidence || 0,
          description: analysisResult.description || "No description available",
          careTips: analysisResult.careTips || [],
          fertilizer: analysisResult.fertilizer || {
            type: "General purpose",
            application: "As directed",
            frequency: "Monthly",
          },
          measurements: analysisResult.measurements || {
            humidity: "40-60%",
            light: "Bright indirect",
            temp: "18-24°C",
            nutrients: {
              status: "Good",
              nitrogen: "Moderate",
              phosphorus: "Moderate",
              potassium: "Moderate",
            },
          },
          // Additional fields
          plantType: analysisResult.plantType,
          scientificName: analysisResult.scientificName,
          healthScore: analysisResult.healthScore,
          analysisMethod: analysisResult.analysisMethod,
        };

        // Enhanced database query with all fields
        const query = `
          INSERT INTO plant_analyses (
            user_id, image_url, status, disease, confidence, description, care_tips,
            fertilizer_type, fertilizer_application, fertilizer_frequency,
            humidity_recommendation, light_recommendation, temp_recommendation,
            nutrient_status, nitrogen_recommendation, phosphorus_recommendation, 
            potassium_recommendation, plant_type, scientific_name, health_score,
            analysis_method, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, NOW(), NOW())
          RETURNING id, created_at
        `;

        const values = [
          userId,
          analysisData.imageUrl,
          analysisData.status,
          analysisData.disease,
          analysisData.confidence,
          analysisData.description,
          JSON.stringify(analysisData.careTips),
          analysisData.fertilizer.type,
          analysisData.fertilizer.application,
          analysisData.fertilizer.frequency,
          analysisData.measurements.humidity,
          analysisData.measurements.light,
          analysisData.measurements.temp,
          analysisData.measurements.nutrients?.status || "Good",
          analysisData.measurements.nutrients?.nitrogen || "Moderate",
          analysisData.measurements.nutrients?.phosphorus || "Moderate",
          analysisData.measurements.nutrients?.potassium || "Moderate",
          analysisData.plantType,
          analysisData.scientificName,
          analysisData.healthScore,
          analysisData.analysisMethod,
        ];

        const savedAnalysis = await pool.query(query, values);
        savedAnalysisId = savedAnalysis.rows[0].id;

        console.log(
          `✅ Analysis saved to database with ID: ${savedAnalysisId}`
        );
      } catch (dbError) {
        console.error("❌ Database save failed:", dbError.message);
        // Don't fail the request if DB save fails - user still gets analysis
      }
    }

    // Always clean up the uploaded file after processing
    try {
      fs.unlinkSync(imagePath);
      console.log(`🗑️ Cleaned up temporary file: ${imagePath}`);
    } catch (cleanupError) {
      console.error("⚠️ File cleanup failed:", cleanupError.message);
    }

    // Return comprehensive response
    const response = {
      success: true,
      message: "Plant analysis completed successfully",
      analysis: {
        // Plant identification
        plantType: analysisResult.plantType,
        scientificName: analysisResult.scientificName,
        commonNames: analysisResult.commonNames,
        confidence: analysisResult.confidence,

        // Health assessment
        healthStatus: analysisResult.status,
        healthScore: analysisResult.healthScore,
        disease: analysisResult.disease,
        description: analysisResult.description,

        // Care recommendations
        careTips: analysisResult.careTips,
        watering: analysisResult.watering,
        fertilizer: analysisResult.fertilizer,
        measurements: analysisResult.measurements,
        treatment: analysisResult.treatment,

        // Additional care info if available
        seasonalCare: analysisResult.seasonalCare,
        repotting: analysisResult.repotting,

        // Metadata
        analysisMethod: analysisResult.analysisMethod,
        timestamp: analysisResult.analysisTimestamp,
      },
      savedToDB: !!savedAnalysisId,
      analysisId: savedAnalysisId,
      apiStatus,
      metadata: analysisResult.metadata,
    };

    res.json(response);
  } catch (error) {
    console.error("💥 Critical error in plant analysis:", error);

    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error("⚠️ File cleanup failed:", cleanupError.message);
      }
    }

    res.status(500).json({
      success: false,
      message: "Failed to analyze plant image",
      error: error.message,
      suggestion:
        "Please try again with a different image or contact support if the issue persists",
    });
  }
};

export const getApiStatus = async (req, res) => {
  try {
    const status = await checkGeminiStatus();

    res.json({
      success: true,
      status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ API status check failed:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check API status",
      error: error.message,
    });
  }
};

export const getAnalysisHistory = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required to view analysis history",
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM plant_analyses WHERE user_id = $1`;
    const countResult = await pool.query(countQuery, [userId]);
    const totalCount = parseInt(countResult.rows[0].count);

    // Get analyses with pagination
    const query = `
      SELECT 
        id, image_url, status, disease, confidence, description, care_tips,
        fertilizer_type, fertilizer_application, fertilizer_frequency,
        humidity_recommendation, light_recommendation, temp_recommendation,
        plant_type, scientific_name, health_score, analysis_method,
        created_at, updated_at
      FROM plant_analyses 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2 OFFSET $3
    `;

    const result = await pool.query(query, [userId, limit, offset]);

    // Format the results
    const analyses = result.rows.map((row) => ({
      id: row.id,
      plantType: row.plant_type,
      scientificName: row.scientific_name,
      status: row.status,
      disease: row.disease,
      confidence: row.confidence,
      healthScore: row.health_score,
      description: row.description,
      imageUrl: row.image_url,
      careTips: Array.isArray(row.care_tips)
        ? row.care_tips
        : JSON.parse(row.care_tips || "[]"),
      fertilizer: {
        type: row.fertilizer_type,
        application: row.fertilizer_application,
        frequency: row.fertilizer_frequency,
      },
      measurements: {
        humidity: row.humidity_recommendation,
        light: row.light_recommendation,
        temperature: row.temp_recommendation,
      },
      analysisMethod: row.analysis_method,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    res.json({
      success: true,
      analyses,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching analysis history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch analysis history",
      error: error.message,
    });
  }
};

export const getAnalysisById = async (req, res) => {
  try {
    const userId = req.user?.id;
    const analysisId = req.params.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const query = `
      SELECT * FROM plant_analyses 
      WHERE id = $1 AND user_id = $2
    `;

    const result = await pool.query(query, [analysisId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Analysis not found",
      });
    }

    const analysis = result.rows[0];

    res.json({
      success: true,
      analysis: {
        id: analysis.id,
        plantType: analysis.plant_type,
        scientificName: analysis.scientific_name,
        status: analysis.status,
        disease: analysis.disease,
        confidence: analysis.confidence,
        description: analysis.description,
        imageUrl: analysis.image_url,
        careTips: JSON.parse(analysis.care_tips || "[]"),
        fertilizer: {
          type: analysis.fertilizer_type,
          application: analysis.fertilizer_application,
          frequency: analysis.fertilizer_frequency,
        },
        measurements: {
          humidity: analysis.humidity_recommendation,
          light: analysis.light_recommendation,
          temperature: analysis.temp_recommendation,
          nutrients: {
            status: analysis.nutrient_status,
            nitrogen: analysis.nitrogen_recommendation,
            phosphorus: analysis.phosphorus_recommendation,
            potassium: analysis.potassium_recommendation,
          },
        },
        healthScore: analysis.health_score,
        analysisMethod: analysis.analysis_method,
        createdAt: analysis.created_at,
        updatedAt: analysis.updated_at,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching analysis:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch analysis",
      error: error.message,
    });
  }
};

export const deleteAnalysis = async (req, res) => {
  try {
    const userId = req.user?.id;
    const analysisId = req.params.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // First check if analysis exists and belongs to user
    const checkQuery = `
      SELECT image_url FROM plant_analyses 
      WHERE id = $1 AND user_id = $2
    `;
    const checkResult = await pool.query(checkQuery, [analysisId, userId]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Analysis not found",
      });
    }

    // Delete from database
    const deleteQuery = `DELETE FROM plant_analyses WHERE id = $1 AND user_id = $2`;
    await pool.query(deleteQuery, [analysisId, userId]);

    // Try to delete associated image file
    const imageUrl = checkResult.rows[0].image_url;
    if (imageUrl) {
      const imagePath = path.join(process.cwd(), "public", imageUrl);
      try {
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
          console.log(`🗑️ Deleted image file: ${imagePath}`);
        }
      } catch (fileError) {
        console.error("⚠️ Failed to delete image file:", fileError.message);
        // Don't fail the request if image deletion fails
      }
    }

    res.json({
      success: true,
      message: "Analysis deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error deleting analysis:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete analysis",
      error: error.message,
    });
  }
};
