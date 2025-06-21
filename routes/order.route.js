import { Router } from "express";
import {
  placeOrder,
  userOrders,
  orderDetails,
} from "../controllers/order.controller.js";
import auth from "../middlewares/auth.middleware.js";

const orderRouter = Router();
orderRouter.post("/", auth, placeOrder);
orderRouter.get("/", auth, userOrders);
orderRouter.get("/:orderId", auth, orderDetails);

export default orderRouter;
