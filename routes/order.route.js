import { Router } from "express";
import {
  placeOrder,
  userOrders,
  sellerOrders,
  orderDetails,
  adminGetAllOrders,
  adminGetOrderStats,
  adminGetOrderDetails,
  adminUpdateOrderStatus,
  adminUpdateOrderNotes,
  adminCancelOrder,
  adminDeleteOrder,
  userCancelOrder,
  sellerCancelOrder,
} from "../controllers/order.controller.js";
import auth from "../middlewares/auth.middleware.js";
import verifyAdmin from "../middlewares/admin.middleware.js";
import sellerAuth from "../middlewares/sellerAuth.middleware.js";

const orderRouter = Router();

// Customer routes - require authentication
orderRouter.post("/", auth, placeOrder);
orderRouter.get("/", auth, userOrders);
orderRouter.get("/:orderId", auth, orderDetails);
orderRouter.put("/:orderId/cancel", auth, userCancelOrder);

// Seller routes - require authentication and seller role
orderRouter.get("/seller/orders", auth, sellerAuth, sellerOrders);
orderRouter.put("/seller/:orderId/cancel", auth, sellerAuth, sellerCancelOrder);

// Admin routes - require authentication and admin role
orderRouter.get("/admin/all", auth, verifyAdmin, adminGetAllOrders);
orderRouter.get("/admin/stats", auth, verifyAdmin, adminGetOrderStats);
orderRouter.get("/admin/:orderId", auth, verifyAdmin, adminGetOrderDetails);
orderRouter.put(
  "/admin/:orderId/status",
  auth,
  verifyAdmin,
  adminUpdateOrderStatus
);

//!Issue here
orderRouter.put(
  "/admin/:orderId/notes",
  auth,
  verifyAdmin,
  adminUpdateOrderNotes
);
orderRouter.put("/admin/:orderId/cancel", auth, verifyAdmin, adminCancelOrder);
orderRouter.delete("/admin/:orderId", auth, verifyAdmin, adminDeleteOrder);

export default orderRouter;
