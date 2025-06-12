import pool from "../db";

export const getAdminDashboard = async (req, res) => {
  try {
    // i) Blog Post Count
    const blogs = await pool.query(
      "SELECT * FROM blogs ORDER BY created_at DESC"
    );

    // ii) Pending Sellers
    const pendingSellers = await pool.query(
      "SELECT * FROM sellers WHERE status = 'pending'"
    );

    // iii) All Sellers
    const allSellers = await pool.query("SELECT * FROM sellers");

    // iv) All Users
    const allUsers = await pool.query(
      "SELECT id, name, email, created_at FROM users WHERE role = 'user'"
    );

    // v) User Uploaded Photos
    const photos = await pool.query(
      "SELECT * FROM ai_photos ORDER BY uploaded_at DESC"
    );

    // vi) Products + Stock
    const products = await pool.query(
      "SELECT * FROM products ORDER BY created_at DESC"
    );

    // vii) Payments
    const payments = await pool.query(
      "SELECT * FROM payments ORDER BY created_at DESC"
    );

    res.json({
      blogs: blogs.rows,
      pendingSellers: pendingSellers.rows,
      sellers: allSellers.rows,
      users: allUsers.rows,
      photos: photos.rows,
      products: products.rows,
      payments: payments.rows,
    });
  } catch (err) {
    res
      .status(500)
      .json({ msg: "Failed to load admin dashboard", error: err.message });
  }
};
