import { Router } from "express";
import getUserDashboard from "../controllers/userDashboard.controller.js";
import auth from "../middlewares/auth.middleware.js";
import role from "../middlewares/role.middleware.js";

const userDashboard = Router();
userDashboard.get("/dashboard", auth, role(["user"]), getUserDashboard);

export default userDashboard;
