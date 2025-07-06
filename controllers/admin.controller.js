// controllers/adminAuth.controller.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../db.js";

export const loginAdmin = async (req, res) => {
  try {
    console.log("Admin Login Request Body:", req.body);

    const { email, password } = req.body;

    const result = await pool.query("SELECT * FROM admins WHERE email = $1", [
      email,
    ]);
    const admin = result.rows[0];
    if (!admin) return res.status(404).json({ msg: "Admin not found" });

    const match = await bcrypt.compare(password, admin.password);
    if (!match) return res.status(401).json({ msg: "Invalid credentials" });

    const token = jwt.sign(
      { id: admin.id, role: "admin" },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.json({ token, adminId: admin.id });
  } catch (err) {
    res.status(500).json({ msg: "Admin login failed", error: err.message });
  }
};
