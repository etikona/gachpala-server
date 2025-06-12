import { Router } from "express";
import userController from "../controllers/userDashboard.controller.js";
import auth from "../middlewares/auth.middleware.js";
import role from "../middlewares/role.middleware.js";

const userDashboard = Router();
userDashboard.get(
  "/dashboard",
  auth,
  role(["user"]),
  userController.getUserDashboard
);

export default userDashboard;
