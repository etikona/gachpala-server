import { Router } from "express";
import orderController from "../controllers/orderController";
import auth from "../middlewares/authMiddleware";

const orderRouter = Router();
orderRouter.post("/", auth, orderController.placeOrder);
orderRouter.get("/", auth, orderController.userOrders);
orderRouter.get("/:orderId", auth, orderController.orderDetails);

export default orderRouter;
