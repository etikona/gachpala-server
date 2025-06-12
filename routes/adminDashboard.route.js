import { Router } from "express";
import adminController from "../controllers/adminDashboard.controller.js";
import auth from "../middlewares/auth.middleware.js";
import role from "../middlewares/role.middleware.js";

const adminDashboard = Router();
adminDashboard.get(
  "/dashboard",
  auth,
  role(["admin"]),
  adminController.getAdminDashboard
);

export default adminDashboard;
