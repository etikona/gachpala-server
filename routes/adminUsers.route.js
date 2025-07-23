// routes/adminUsers.route.js
import { Router } from "express";
import {
  getUserProfile,
  updateUserProfile,
  suspendUserAccount,
  deleteUserAccount,
  getUserOrderHistory,
} from "../controllers/adminUser.controller.js";
import auth from "../middlewares/auth.middleware.js";
import role from "../middlewares/role.middleware.js";

const adminUsers = Router();

// Apply admin middleware to all routes
adminUsers.use(auth, role(["admin"]));

adminUsers.get("/:id", getUserProfile);
adminUsers.put("/:id", updateUserProfile);
adminUsers.patch("/:id/suspend", suspendUserAccount);
adminUsers.delete("/:id", deleteUserAccount);
adminUsers.get("/:id/orders", getUserOrderHistory);

export default adminUsers;
