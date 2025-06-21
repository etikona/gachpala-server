import { Router } from "express";

import {
  getSellerProfile,
  registerBusiness,
} from "../controllers/seller.controller.js";
import auth from "../middlewares/auth.middleware.js";

const sellerRouter = Router();
sellerRouter.post("/register", auth, registerBusiness);
sellerRouter.get("/profile", auth, getSellerProfile);

export default sellerRouter;
