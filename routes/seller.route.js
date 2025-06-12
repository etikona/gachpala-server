import { Router } from "express";
import sellerController from "../controllers/seller.controller.js";
import auth from "../middlewares/auth.middleware.js";

const sellerRouter = Router();
sellerRouter.post("/register", auth, sellerController.registerBusiness);
sellerRouter.get("/profile", auth, sellerController.getSellerProfile);

export default sellerRouter;
