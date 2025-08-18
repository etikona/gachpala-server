// routes/order.route.js
import { Router } from "express";
import {
  placeOrder,
  userOrders,
  orderDetails,
  adminGetAllOrders,
  adminGetOrderStats,
  adminGetOrderDetails,
  adminUpdateOrderStatus,
  adminCancelOrder,
} from "../controllers/order.controller.js";
// import auth from "../middlewares/auth.middleware.js";
// import admin from "../middlewares/admin.middleware.js";

const orderRouter = Router();

// Customer routes
// auth
orderRouter.post("/", placeOrder);
// Fix the fetch issues.
orderRouter.get("/", userOrders);
orderRouter.get("/:orderId", orderDetails);

// Admin routes
// !auth, admin
//working
orderRouter.get("/admin/all", adminGetAllOrders);
orderRouter.get("/admin/stats", adminGetOrderStats);
orderRouter.get("/admin/:orderId", adminGetOrderDetails);

orderRouter.put("/admin/:orderId/status", adminUpdateOrderStatus);
orderRouter.put("/admin/:orderId/cancel", adminCancelOrder);

export default orderRouter;
