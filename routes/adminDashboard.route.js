import { Router } from "express";
import { getAdminDashboard } from "../controllers/adminDashboard.controller.js";
import auth from "../middlewares/auth.middleware.js";
import role from "../middlewares/role.middleware.js";

const adminDashboard = Router();
adminDashboard.get("/dashboard", auth, role(["admin"]), getAdminDashboard);

export default adminDashboard;
