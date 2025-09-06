import Router from "express";
import {
  addProduct,
  listProducts,
  getSellerProducts,
  getProduct,
  updateProductDetails,
  removeProduct,
  getProductRatings,
} from "../controllers/product.controller.js";
import { rateProduct } from "../controllers/rating.controller.js";
import sellerAuth from "../middlewares/sellerAuth.middleware.js";
import auth from "../middlewares/auth.middleware.js"; // For user ratings

const productRouter = Router();

// Public routes
productRouter.get("/", listProducts);
productRouter.get("/:id", getProduct);
productRouter.get("/:productId/ratings", getProductRatings);
// productRouter.get("/seller/:sellerId", getProductsBySellerIdPublic);
// Seller protected routes (using sellerAuth)
productRouter.post("/", sellerAuth, addProduct);
productRouter.get("/seller/my-products", sellerAuth, getSellerProducts);
productRouter.put("/:id", sellerAuth, updateProductDetails);
productRouter.delete("/:id", sellerAuth, removeProduct);

// User protected routes (using regular auth for ratings)
productRouter.post("/:productId/ratings", auth, rateProduct);

export default productRouter;
