import { Router } from "express";

import {
  registerSeller,
  loginSeller,
} from "../controllers/seller.controller.js";
import sellerUpload from "../middlewares/sellerUpload.middleware.js";

const sellerRouter = Router();
sellerRouter.post("/register", sellerUpload, registerSeller);
sellerRouter.post("/login", loginSeller);

export default sellerRouter;
