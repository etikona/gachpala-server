import { Router } from "express";

import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";

const protectedRoute = Router();

protectedRoute.get(
  "/admin-only",
  authMiddleware,
  roleMiddleware("admin"),
  (req, res) => {
    res.send("Hello Admin!");
  }
);

protectedRoute.get(
  "/seller-only",
  authMiddleware,
  roleMiddleware("seller"),
  (req, res) => {
    res.send("Hello Seller!");
  }
);

export default protectedRoute;
