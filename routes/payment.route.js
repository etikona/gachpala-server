import { Router } from "express";
import paymentController from "../controllers/payment.controller.js";
import auth from "../middlewares/auth.middleware.js";

const paymentRouter = Router();
paymentRouter.get("/seller", auth, paymentController.sellerPayments);

export default paymentRouter;
