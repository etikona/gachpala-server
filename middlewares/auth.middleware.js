import jwt from "jsonwebtoken";
import pool from "../db.js";
const checkBlacklistedToken = async (token) => {
  try {
    const result = await pool.query(
      "SELECT * FROM blacklisted_tokens WHERE token = $1",
      [token]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error("Error checking blacklisted token:", error);
    return false;
  }
};
const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer "))
    return res.status(401).json({ msg: "No token provided" });

  const token = authHeader.split(" ")[1];
  // Check if token is blacklisted
  const isBlacklisted = await checkBlacklistedToken(token);
  if (isBlacklisted) {
    return res
      .status(401)
      .json({ success: false, message: "Token has been invalidated" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // contains id and role
    next();
  } catch (err) {
    return res.status(401).json({ msg: "Invalid or expired token" });
  }
};

export default authMiddleware;
