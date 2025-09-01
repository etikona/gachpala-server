import { Router } from "express";
import userDashboardController from "../controllers/userDashboard.controller.js";
import auth from "../middlewares/auth.middleware.js";
import role from "../middlewares/role.middleware.js";
import validate from "../middlewares/validation.middleware.js";

const router = Router();

// Validation schemas - UPDATED
const updateProfileSchema = {
  body: {
    properties: {
      name: { type: "string", minLength: 2, maxLength: 50 },
      profile_image: { type: "string", format: "uri" },
    },
    // Note: No required fields since we handle "at least one" in controller
  },
};

const updateSubscriptionSchema = {
  body: {
    properties: {
      plan: { type: "string", enum: ["basic", "premium", "vip"] },
    },
    required: ["plan"], // This field is required
  },
};

// Apply authentication and role middleware to all routes
router.use(auth);
router.use(role(["user", "VIP"]));

// Dashboard routes
// Test endpoint to check body parsing

router.get("/dashboard", userDashboardController.getUserDashboard);
router.get("/statistics", userDashboardController.getUserStatistics);
router.patch(
  "/profile",
  validate(updateProfileSchema),
  userDashboardController.updateProfile
);
router.patch(
  "/subscription",
  validate(updateSubscriptionSchema),
  userDashboardController.updateSubscription
);

export default router;
