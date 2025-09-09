import {
  addRating,
  getRatingsForProduct,
  getRatingById,
  getUserRatingForProduct,
  updateRating,
  deleteRating,
  getProductRatingStats,
} from "../models/rating.model.js";

// Get all ratings for a product
export const getProductRatings = async (req, res) => {
  try {
    const { productId } = req.params;
    const ratings = await getRatingsForProduct(productId);
    res.json(ratings);
  } catch (err) {
    res.status(500).json({
      msg: "Error fetching ratings",
      error: err.message,
    });
  }
};

// Get rating statistics for a product
export const getRatingStatistics = async (req, res) => {
  try {
    const { productId } = req.params;
    const stats = await getProductRatingStats(productId);

    // Format the stats
    const formattedStats = {
      total_ratings: parseInt(stats.total_ratings),
      average_rating: parseFloat(stats.average_rating) || 0,
      rating_distribution: {
        5: parseInt(stats.five_star) || 0,
        4: parseInt(stats.four_star) || 0,
        3: parseInt(stats.three_star) || 0,
        2: parseInt(stats.two_star) || 0,
        1: parseInt(stats.one_star) || 0,
      },
    };

    res.json(formattedStats);
  } catch (err) {
    res.status(500).json({
      msg: "Error fetching rating statistics",
      error: err.message,
    });
  }
};

// Add or update a rating
export const rateProduct = async (req, res) => {
  try {
    const { rating, review } = req.body;
    const { productId } = req.params;
    const userId = req.user.id;

    // Check if user already rated this product
    const existingRating = await getUserRatingForProduct(userId, productId);

    let result;
    if (existingRating) {
      // Update existing rating
      result = await updateRating(existingRating.id, { rating, review });
    } else {
      // Create new rating
      result = await addRating({ userId, productId, rating, review });
    }

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({
      msg: "Error submitting rating",
      error: err.message,
    });
  }
};

// Update a rating (only by owner or admin)
export const updateProductRating = async (req, res) => {
  try {
    const { ratingId } = req.params;
    const { rating, review } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Get the rating to check ownership
    const existingRating = await getRatingById(ratingId);

    if (!existingRating) {
      return res.status(404).json({ msg: "Rating not found" });
    }

    // Check if user is owner or admin
    if (existingRating.user_id !== userId && userRole !== "admin") {
      return res.status(403).json({
        msg: "Not authorized to update this rating",
      });
    }

    const updatedRating = await updateRating(ratingId, { rating, review });
    res.json(updatedRating);
  } catch (err) {
    res.status(500).json({
      msg: "Error updating rating",
      error: err.message,
    });
  }
};

// Delete a rating (only by owner or admin)
export const deleteProductRating = async (req, res) => {
  try {
    const { ratingId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Get the rating to check ownership
    const existingRating = await getRatingById(ratingId);

    if (!existingRating) {
      return res.status(404).json({ msg: "Rating not found" });
    }

    // Check if user is owner or admin
    if (existingRating.user_id !== userId && userRole !== "admin") {
      return res.status(403).json({
        msg: "Not authorized to delete this rating",
      });
    }

    const deletedRating = await deleteRating(ratingId);
    res.json({
      msg: "Rating deleted successfully",
      rating: deletedRating,
    });
  } catch (err) {
    res.status(500).json({
      msg: "Error deleting rating",
      error: err.message,
    });
  }
};

// Get user's rating for a product
export const getUserProductRating = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    const rating = await getUserRatingForProduct(userId, productId);
    res.json(rating || null);
  } catch (err) {
    res.status(500).json({
      msg: "Error fetching user rating",
      error: err.message,
    });
  }
};
