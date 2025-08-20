import { Router } from "express";
import {
  getDashboardOverview,
  getRevenueOverview,
  getUserActivityData,
  getPerformanceData,
  getRecentActivities,
  getCompleteOverview,
} from "../controllers/adminOverview.controller.js";
// Import your auth and admin middleware as needed
// import auth from "../middlewares/auth.middleware.js";
// import role from "../middlewares/role.middleware.js";

const adminOverviewRouter = Router();

// Apply admin middleware to all routes
// adminOverviewRouter.use(auth, role(["admin"]));

// Individual endpoints
adminOverviewRouter.get("/stats", getDashboardOverview); //worked
adminOverviewRouter.get("/revenue", getRevenueOverview); //worked
adminOverviewRouter.get("/user-activity", getUserActivityData);
adminOverviewRouter.get("/metrics", getPerformanceData); //worked
adminOverviewRouter.get("/recent-activity", getRecentActivities);

// Combined endpoint for all overview data
adminOverviewRouter.get("/complete", getCompleteOverview);

export default adminOverviewRouter;
