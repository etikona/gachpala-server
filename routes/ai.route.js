import { Router } from "express";
// import aiController from "../controllers/ai.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import upload from "../middlewares/upload.middleware.js";
import { analyzePlant } from "../controllers/ai.controller.js";

const aiRouter = Router();

aiRouter.post(
  "/plant-image",
  authMiddleware,
  upload.single("plant"),
  analyzePlant
);

export default aiRouter;
