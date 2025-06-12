import { Router } from "express";
import orderController from "../controllers/order.controller.js";
import auth from "../middlewares/auth.middleware.js";

const orderRouter = Router();
orderRouter.post("/", auth, orderController.placeOrder);
orderRouter.get("/", auth, orderController.userOrders);
orderRouter.get("/:orderId", auth, orderController.orderDetails);

export default orderRouter;
