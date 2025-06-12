import { Router } from "express";
import sellerController from "../controllers/sellerDashboard.controller.js";
import auth from "../middlewares/auth.middleware.js";
import role from "../middlewares/role.middleware.js";

const sellerDashboard = Router();
sellerDashboard.get(
  "/dashboard",
  auth,
  role(["seller"]),
  sellerController.getSellerDashboard
);

export default sellerDashboard;
