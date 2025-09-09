// routes/product.route.js
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
import auth from "../middlewares/auth.middleware.js";
import { uploadSingle } from "../middlewares/productUpload.middleware.js"; // Correct named import

const productRouter = Router();

// Public routes
productRouter.get("/", listProducts);
productRouter.get("/:id", getProduct);
productRouter.get("/:productId/ratings", getProductRatings);

// Seller protected routes with file upload AND form data parsing
productRouter.post("/", sellerAuth, uploadSingle, addProduct);
productRouter.get("/seller/my-products", sellerAuth, getSellerProducts);
productRouter.put("/:id", sellerAuth, uploadSingle, updateProductDetails);
productRouter.delete("/:id", sellerAuth, removeProduct);

// User protected routes
productRouter.post("/:productId/ratings", auth, rateProduct);

export default productRouter;
