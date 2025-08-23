// backend/routes/ai.route.js
import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import upload from "../middlewares/upload.middleware.js";
import {
  analyzePlant,
  getAnalysisHistory,
} from "../controllers/ai.controller.js";

const aiRouter = Router();

//Temporary endpoint for testing without auth
aiRouter.post(
  "/plant-image-test", // Different endpoint for testing without auth
  upload.single("plant"),
  analyzePlant
);

aiRouter.post(
  "/plant-image",
  authMiddleware,
  upload.single("plant"),
  analyzePlant
);

aiRouter.get("/analysis-history", authMiddleware, getAnalysisHistory);

export default aiRouter;
