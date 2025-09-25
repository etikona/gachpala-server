import {
  generateStructuredPlantAnalysis,
  checkGeminiStatus,
} from "../utils/geminiClient.js";
import {
  savePlantAnalysis,
  getUserPlantAnalyses,
  getPlantAnalysisById,
  deletePlantAnalysis,
  getUserAnalyticsData,
  updatePlantAnalysis,
} from "../models/plantAnalysis.model.js";
import fs from "fs";
import path from "path";

export const analyzePlantImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file uploaded",
      });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const imagePath = req.file.path;
    const mimeType = req.file.mimetype;

    // Validate file type
    if (!mimeType.startsWith("image/")) {
      fs.unlinkSync(imagePath);
      return res.status(400).json({
        success: false,
        message: "Invalid file type. Please upload an image file",
      });
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (req.file.size > maxSize) {
      fs.unlinkSync(imagePath);
      return res.status(400).json({
        success: false,
        message: "File too large. Maximum size is 10MB",
      });
    }

    let analysisResult;
    try {
      // Perform AI analysis
      analysisResult = await generateStructuredPlantAnalysis(
        imagePath,
        mimeType
      );
    } catch (analysisError) {
      fs.unlinkSync(imagePath);
      return res.status(500).json({
        success: false,
        message: "Failed to analyze plant image",
        error: "Please try again with a clearer image",
      });
    }

    // Save to database
    let savedAnalysisId = null;
    try {
      const analysisData = {
        userId,
        imageUrl: `/uploads/${req.file.filename}`,
        status: analysisResult.status || "Unknown",
        disease: analysisResult.disease || "None",
        confidence: analysisResult.confidence || 0,
        description: analysisResult.description || "Analysis completed",
        careTips: analysisResult.careTips || [],
        fertilizer: analysisResult.fertilizer || {
          type: "General purpose fertilizer",
          application: "Apply as directed",
          frequency: "Monthly",
        },
        measurements: analysisResult.measurements || {
          humidity: "40-60%",
          light: "Bright indirect light",
          temp: "18-24°C",
          nutrients: {
            status: "Good",
            nitrogen: "Moderate",
            phosphorus: "Moderate",
            potassium: "Moderate",
          },
        },
        plantType: analysisResult.plantType || "Unknown Plant",
        scientificName: analysisResult.scientificName || "Unknown species",
        healthScore: analysisResult.healthScore || 0,
        analysisMethod: "ai_analysis",
      };

      const savedAnalysis = await savePlantAnalysis(analysisData);
      savedAnalysisId = savedAnalysis.id;
    } catch (dbError) {
      console.error("Database save failed:", dbError.message);
      // Continue without failing - user still gets analysis
    }

    // Clean up uploaded file
    try {
      fs.unlinkSync(imagePath);
    } catch (cleanupError) {
      console.error("File cleanup failed:", cleanupError.message);
    }

    // Return analysis result
    res.json({
      success: true,
      message: "Plant analysis completed successfully",
      data: {
        id: savedAnalysisId,
        plantType: analysisResult.plantType || "Unknown Plant",
        scientificName: analysisResult.scientificName || "Unknown species",
        status: analysisResult.status || "Unknown",
        healthScore: analysisResult.healthScore || 0,
        confidence: analysisResult.confidence || 0,
        disease: analysisResult.disease || "None",
        description: analysisResult.description || "Analysis completed",
        careTips: analysisResult.careTips || [],
        fertilizer: analysisResult.fertilizer || {},
        measurements: analysisResult.measurements || {},
        imageUrl: `/uploads/${req.file.filename}`,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Plant analysis error:", error);

    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error("File cleanup failed:", cleanupError.message);
      }
    }

    res.status(500).json({
      success: false,
      message: "Internal server error occurred during analysis",
    });
  }
};

export const getUserScansHistory = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const plantType = req.query.plantType;
    const sortBy = req.query.sortBy || "created_at";
    const sortOrder = req.query.sortOrder || "DESC";

    const result = await getUserPlantAnalyses(userId, {
      page,
      limit,
      status,
      plantType,
      sortBy,
      sortOrder,
    });

    // Format results for frontend
    const formattedScans = result.analyses.map((scan) => ({
      id: scan.id,
      plantType: scan.plant_type,
      scientificName: scan.scientific_name,
      status: scan.status,
      healthScore: scan.health_score,
      confidence: scan.confidence,
      disease: scan.disease,
      imageUrl: scan.image_url,
      createdAt: scan.created_at,
      description: scan.description,
    }));

    res.json({
      success: true,
      data: formattedScans,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Error fetching scans history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch scans history",
    });
  }
};

export const getScanDetails = async (req, res) => {
  try {
    const userId = req.user?.id;
    const scanId = req.params.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const scan = await getPlantAnalysisById(scanId, userId);

    if (!scan) {
      return res.status(404).json({
        success: false,
        message: "Scan not found",
      });
    }

    // Format detailed response
    const detailedScan = {
      id: scan.id,
      plantType: scan.plant_type,
      scientificName: scan.scientific_name,
      status: scan.status,
      healthScore: scan.health_score,
      confidence: scan.confidence,
      disease: scan.disease,
      description: scan.description,
      careTips: scan.care_tips,
      imageUrl: scan.image_url,
      createdAt: scan.created_at,
      updatedAt: scan.updated_at,

      // Care recommendations
      fertilizer: {
        type: scan.fertilizer_type,
        application: scan.fertilizer_application,
        frequency: scan.fertilizer_frequency,
      },
      environmental: {
        humidity: scan.humidity_recommendation,
        light: scan.light_recommendation,
        temperature: scan.temp_recommendation,
      },
      nutrients: {
        status: scan.nutrient_status,
        nitrogen: scan.nitrogen_recommendation,
        phosphorus: scan.phosphorus_recommendation,
        potassium: scan.potassium_recommendation,
      },
      analysisMethod: scan.analysis_method,
    };

    res.json({
      success: true,
      data: detailedScan,
    });
  } catch (error) {
    console.error("Error fetching scan details:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch scan details",
    });
  }
};

export const getUserDashboardAnalytics = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const analytics = await getUserAnalyticsData(userId);

    // Format analytics for dashboard
    const dashboardData = {
      summary: {
        totalScans: parseInt(analytics.overview.total_scans) || 0,
        healthyPlants: parseInt(analytics.overview.healthy_count) || 0,
        unhealthyPlants: parseInt(analytics.overview.unhealthy_count) || 0,
        averageHealthScore: parseFloat(
          analytics.overview.avg_health_score || 0
        ).toFixed(1),
        averageConfidence: parseFloat(
          analytics.overview.avg_confidence || 0
        ).toFixed(1),
        uniquePlantTypes: parseInt(analytics.overview.unique_plant_types) || 0,
      },

      charts: {
        healthDistribution: analytics.healthDistribution.map((item) => ({
          status: item.status,
          count: parseInt(item.count),
        })),

        plantTypes: analytics.plantTypes.map((item) => ({
          type: item.plant_type,
          count: parseInt(item.count),
          avgHealth: parseFloat(item.avg_health || 0).toFixed(1),
        })),

        monthlyTrends: analytics.monthlyTrends.map((item) => ({
          month: item.month,
          scanCount: parseInt(item.scan_count),
          avgHealthScore: parseFloat(item.avg_health_score || 0).toFixed(1),
        })),
      },

      recentScans: analytics.recentScans.map((scan) => ({
        id: scan.id,
        plantType: scan.plant_type,
        status: scan.status,
        healthScore: scan.health_score,
        createdAt: scan.created_at,
        imageUrl: scan.image_url,
      })),
    };

    res.json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    console.error("Error fetching dashboard analytics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard analytics",
    });
  }
};

export const updateScan = async (req, res) => {
  try {
    const userId = req.user?.id;
    const scanId = req.params.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const updatedScan = await updatePlantAnalysis(scanId, userId, req.body);

    if (!updatedScan) {
      return res.status(404).json({
        success: false,
        message: "Scan not found or unauthorized",
      });
    }

    res.json({
      success: true,
      message: "Scan updated successfully",
      data: updatedScan,
    });
  } catch (error) {
    console.error("Error updating scan:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update scan",
    });
  }
};

export const deleteScan = async (req, res) => {
  try {
    const userId = req.user?.id;
    const scanId = req.params.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const deletedScan = await deletePlantAnalysis(scanId, userId);

    if (!deletedScan) {
      return res.status(404).json({
        success: false,
        message: "Scan not found or unauthorized",
      });
    }

    // Delete associated image file
    if (deletedScan.image_url) {
      const imagePath = path.join(
        process.cwd(),
        "public",
        deletedScan.image_url
      );
      try {
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      } catch (fileError) {
        console.error("Failed to delete image file:", fileError.message);
      }
    }

    res.json({
      success: true,
      message: "Scan deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting scan:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete scan",
    });
  }
};
