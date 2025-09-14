import Router from "express";
import {
  getPlans,
  getCurrentSubscription,
  subscribeToPlan,
  cancelSubscription,
  trackImageGeneration,
  getAllSubscriptions,
  updateSubscription,
  adminGetPlans,
  adminCreatePlan,
  adminUpdatePlan,
  adminDeletePlan,
  getSubscriptionStats,
  adminResetImageUsage,
  getSubscriptionHistory,
  upgradeSubscription,
  checkImageGeneration,
} from "../controllers/subscription.controller.js";
import auth from "../middlewares/auth.middleware.js";
import verifyAdmin from "../middlewares/admin.middleware.js";
const subscriptionRouter = Router();
// Public routes
subscriptionRouter.get("/plans", getPlans);

// Protected routes (require authentication)
// subscriptionRouter.use(auth);

// User subscription routes
subscriptionRouter.get("/current", auth, getCurrentSubscription);
subscriptionRouter.get("/history", auth, getSubscriptionHistory);
subscriptionRouter.post("/subscribe", auth, subscribeToPlan);
subscriptionRouter.post("/upgrade", auth, upgradeSubscription);
subscriptionRouter.post("/cancel", auth, cancelSubscription);
subscriptionRouter.post("/track-image", auth, trackImageGeneration);
subscriptionRouter.get("/check-generation", checkImageGeneration);

// Admin routes // !add in every api (auth, verifyAdmin),
subscriptionRouter.get("/admin/all", getAllSubscriptions);
subscriptionRouter.get("/admin/stats", getSubscriptionStats);
subscriptionRouter.put(
  "/admin/subscription/:id",
  auth,
  verifyAdmin,
  updateSubscription
);
subscriptionRouter.post(
  "/admin/reset-usage/:subscriptionId",
  auth,
  verifyAdmin,
  adminResetImageUsage
);
subscriptionRouter.get("/admin/plans", auth, verifyAdmin, adminGetPlans);
subscriptionRouter.post("/admin/plans", auth, verifyAdmin, adminCreatePlan);
subscriptionRouter.put("/admin/plans/:id", adminUpdatePlan);
subscriptionRouter.delete("/admin/plans/:id", adminDeletePlan);

export default subscriptionRouter;
