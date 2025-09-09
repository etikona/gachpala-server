import Router from "express";
import {
  getProductRatings,
  getRatingStatistics,
  rateProduct,
  updateProductRating,
  deleteProductRating,
  getUserProductRating,
} from "../controllers/rating.controller.js";
import auth from "../middlewares/auth.middleware.js";

const ratingRouter = Router();

// Public routes (anyone can read ratings)
ratingRouter.get("/products/:productId/ratings", getProductRatings);
ratingRouter.get("/products/:productId/ratings/stats", getRatingStatistics);

// Protected routes (authenticated users only)
ratingRouter.get("/products/:productId/my-rating", auth, getUserProductRating);
ratingRouter.post("/products/:productId/ratings", auth, rateProduct);
ratingRouter.put("/ratings/:ratingId", auth, updateProductRating);
ratingRouter.delete("/ratings/:ratingId", auth, deleteProductRating);

export default ratingRouter;
