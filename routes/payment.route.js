import { Router } from "express";
import { sellerPayments } from "../controllers/payment.controller.js";
import auth from "../middlewares/auth.middleware.js";

const paymentRouter = Router();
paymentRouter.get("/seller", auth, sellerPayments);

export default paymentRouter;
