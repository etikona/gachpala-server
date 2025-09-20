import { Router } from "express";
import { register, login } from "../controllers/auth.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";
import pool from "../db.js";

const authRouter = Router();
authRouter.post("/register", register);
authRouter.post("/login", login);
// Logout route.post("/logout", authMiddleware, async (req, res) => {
authRouter.post("/logout", authMiddleware, async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const { id, role } = req.user;

    // Add token to blacklist
    await pool.query(
      "INSERT INTO blacklisted_tokens (token, user_id, user_type) VALUES ($1, $2, $3)",
      [token, id, role]
    );

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during logout",
    });
  }
});

export default authRouter;
