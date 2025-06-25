import pool from "../db.js";

const getUserDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1) Blogs + Comments
    const blogs = await pool.query(
      "SELECT * FROM blogs ORDER BY created_at DESC"
    );
    const comments = await pool.query(
      "SELECT * FROM comments WHERE user_id = $1",
      [userId]
    );

    // 2) Orders
    const orders = await pool.query(
      "SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );

    // 3) Uploaded Images
    const images = await pool.query(
      "SELECT * FROM ai_photos WHERE user_id = $1 ORDER BY uploaded_at DESC",
      [userId]
    );

    res.json({
      blogs: blogs.rows,
      comments: comments.rows,
      orders: orders.rows,
      uploadedPhotos: images.rows,
    });
  } catch (err) {
    res
      .status(500)
      .json({ msg: "Failed to load user dashboard", error: err.message });
  }
};

export default getUserDashboard;
