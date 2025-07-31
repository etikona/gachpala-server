// routes/adminUsers.route.js
import { Router } from "express";
import {
  getUserProfile,
  updateUserProfile,
  suspendUserAccount,
  deleteUserAccount,
  getUserOrderHistory,
  getUsersList,
  getDashboardStats,
  toggleUserStatus,
} from "../controllers/adminUser.controller.js";
import auth from "../middlewares/auth.middleware.js";
import role from "../middlewares/role.middleware.js";

const adminUsers = Router();

// Apply admin middleware to all routes
// adminUsers.use(auth, role(["admin"]));

adminUsers.get("/", getUsersList);
adminUsers.get("/stats", getDashboardStats);
adminUsers.patch("/:id/status", toggleUserStatus); // Updated suspend endpoint

adminUsers.get("/:id", getUserProfile);
adminUsers.put("/:id", updateUserProfile);
adminUsers.patch("/:id/suspend", suspendUserAccount);
adminUsers.delete("/:id", deleteUserAccount);
adminUsers.get("/:id/orders", getUserOrderHistory);

export default adminUsers;
