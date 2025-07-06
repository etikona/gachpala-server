import { Router } from "express";
import { getAdminDashboard } from "../controllers/adminDashboard.controller.js";
import auth from "../middlewares/auth.middleware.js";
import role from "../middlewares/role.middleware.js";
import { verifyAdmin } from "../middlewares/admin.middleware.js";

const adminDashboard = Router();
adminDashboard.get(
  "/dashboard",
  auth,
  role(["admin"]),
  verifyAdmin,
  getAdminDashboard
);

export default adminDashboard;
