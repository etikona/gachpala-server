import {
  getUserById,
  updateUserProfile,
  updateUserSubscription,
} from "../models/user.model.js";
import pool from "../db.js";

// Utility function for handling errors
const handleError = (res, err, message = "Server error") => {
  console.error(`${message}:`, err);
  res.status(500).json({
    success: false,
    message,
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
};

// Get user dashboard data
const getUserDashboard = async (req, res) => {
  try {
    console.log("Request user object:", req.user);

    const userId = req.user.id;
    console.log("Extracted user ID:", userId);

    // Get user profile with image count
    const userProfile = await getUserById(userId);
    console.log("User profile from DB:", userProfile);

    if (!userProfile) {
      return res.status(404).json({
        success: false,
        message: "User not found in database",
        userId: userId,
      });
    }

    // Get additional dashboard data in parallel for better performance
    const [blogs, comments, orders, images] = await Promise.all([
      pool.query("SELECT * FROM blogs ORDER BY created_at DESC"),
      pool.query("SELECT * FROM comments WHERE user_id = $1", [userId]),
      pool.query(
        "SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC",
        [userId]
      ),
      pool.query(
        "SELECT * FROM ai_photos WHERE user_id = $1 ORDER BY uploaded_at DESC",
        [userId]
      ),
    ]);

    res.json({
      success: true,
      data: {
        user: {
          id: userProfile.id,
          name: userProfile.name,
          email: userProfile.email,
          profile_image: userProfile.profile_image,
          role: userProfile.role,
          status: userProfile.status,
          created_at: userProfile.created_at,
          uploaded_images_count: userProfile.uploaded_images_count,
        },
        blogs: blogs.rows,
        comments: comments.rows,
        orders: orders.rows,
        uploadedPhotos: images.rows,
      },
    });
  } catch (err) {
    handleError(res, err, "Failed to load user dashboard");
  }
};

// Get user statistics
const getUserStatistics = async (req, res) => {
  try {
    console.log("Request user object:", req.user);

    const userId = req.user.id;
    console.log("Extracted user ID for statistics:", userId);

    // Get counts of various user activities
    const [imagesCount, ordersCount, commentsCount] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM ai_photos WHERE user_id = $1", [userId]),
      pool.query("SELECT COUNT(*) FROM orders WHERE user_id = $1", [userId]),
      pool.query("SELECT COUNT(*) FROM comments WHERE user_id = $1", [userId]),
    ]);

    console.log("Statistics results:", {
      images: imagesCount.rows[0],
      orders: ordersCount.rows[0],
      comments: commentsCount.rows[0],
    });

    res.json({
      success: true,
      data: {
        uploaded_images: parseInt(imagesCount.rows[0].count),
        orders: parseInt(ordersCount.rows[0].count),
        comments: parseInt(commentsCount.rows[0].count),
      },
    });
  } catch (err) {
    handleError(res, err, "Failed to load user statistics");
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, profile_image } = req.body;

    // Custom validation for at least one field
    if (!name && !profile_image) {
      return res.status(400).json({
        success: false,
        message: "At least one field (name or profile_image) is required",
      });
    }

    const updatedUser = await updateUserProfile(userId, {
      name,
      profile_image,
    });

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (err) {
    handleError(res, err, "Failed to update profile");
  }
};

// Update subscription plan
const updateSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    const { plan } = req.body;

    const updatedUser = await updateUserSubscription(userId, plan);

    res.json({
      success: true,
      message: "Subscription updated successfully",
      data: updatedUser,
    });
  } catch (err) {
    if (err.message === "Invalid subscription plan") {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
    handleError(res, err, "Failed to update subscription");
  }
};

export default {
  getUserDashboard,
  updateProfile,
  updateSubscription,
  getUserStatistics,
};
