import Router from "express";
import productController from "../controllers/product.controller.js";
import ratingController from "../controllers/rating.controller.js";
import auth from "../middlewares/auth.middleware.js";

const productRouter = Router();
productRouter.post("/", auth, productController.addProduct); // Seller only (validated in controller)
productRouter.get("/", productController.listProducts);
productRouter.get("/:productId/ratings", productController.getProductRatings);
productRouter.post("/:productId/ratings", auth, ratingController.rateProduct);

export default productRouter;
