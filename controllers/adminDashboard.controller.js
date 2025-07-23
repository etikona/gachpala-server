// controllers/adminDashboard.controller.js
import pool from "../db.js";
import { getAllUsers, getUserStats } from "../models/user.model.js"; // Import new functions

export const getAdminDashboard = async (req, res) => {
  try {
    // Existing dashboard data
    const [blogs, pendingSellers, allSellers, photos, products, payments] =
      await Promise.all([
        pool.query("SELECT * FROM blogs ORDER BY created_at DESC"),
        pool.query("SELECT * FROM sellers WHERE status = 'pending'"),
        pool.query("SELECT * FROM sellers"),
        pool.query("SELECT * FROM ai_photos ORDER BY uploaded_at DESC"),
        pool.query("SELECT * FROM products ORDER BY created_at DESC"),
        pool.query("SELECT * FROM payments ORDER BY created_at DESC"),
      ]);

    // New user data and statistics using model functions
    const [users, userStats] = await Promise.all([
      getAllUsers(),
      getUserStats(),
    ]);

    // Calculate average orders per active user
    const avgOrders =
      userStats.active_users > 0
        ? userStats.total_orders_by_active / userStats.active_users
        : 0;

    res.json({
      blogs: blogs.rows,
      pendingSellers: pendingSellers.rows,
      sellers: allSellers.rows,
      photos: photos.rows,
      products: products.rows,
      payments: payments.rows,
      users, // New user table data
      userStats: {
        // New statistics
        ...userStats,
        avg_orders_per_active: parseFloat(avgOrders.toFixed(2)),
      },
    });
  } catch (err) {
    res.status(500).json({
      msg: "Failed to load admin dashboard",
      error: err.message,
    });
  }
};
