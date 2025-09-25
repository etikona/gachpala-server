import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import upload from "../middlewares/upload.middleware.js";
import {
  analyzePlantImage,
  getUserScansHistory,
  getScanDetails,
  getUserDashboardAnalytics,
  updateScan,
  deleteScan,
} from "../controllers/ai.controller.js";

const aiRouter = Router();

// Plant image analysis - Main feature
aiRouter.post(
  "/analyze",
  authMiddleware,
  upload.single("plant"),
  analyzePlantImage
);

// Get user's scan history with pagination and filters
aiRouter.get("/scans", authMiddleware, getUserScansHistory);

// Get detailed scan information by ID
aiRouter.get("/scans/:id", authMiddleware, getScanDetails);

// Get dashboard analytics for user
aiRouter.get("/dashboard", authMiddleware, getUserDashboardAnalytics);

// Update scan information
aiRouter.put("/scans/:id", authMiddleware, updateScan);

// Delete scan
aiRouter.delete("/scans/:id", authMiddleware, deleteScan);

export default aiRouter;
