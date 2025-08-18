import pool from "../db.js";
import {
  createOrder,
  addOrderItem,
  getUserOrders,
  getOrderDetails,
  getAllOrders,
  getOrderStats,
  getFullOrderDetails,
  updateOrderStatus,
  cancelOrder,
} from "../models/order.model.js";
import { createPayment } from "../models/payment.model.js";

export const placeOrder = async (req, res) => {
  const { items, paymentMethod } = req.body;
  const userId = req.user.id;

  try {
    await pool.query("BEGIN");

    // Calculate total
    let total = 0;
    for (let item of items) {
      const result = await pool.query(
        `SELECT price FROM products WHERE id = $1`,
        [item.productId]
      );
      const price = result.rows[0]?.price;
      if (!price) throw new Error("Invalid product");
      total += price * item.quantity;
      item.price = price;
    }

    const order = await createOrder({ userId, total });

    for (let item of items) {
      await addOrderItem({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      });

      // Reduce stock
      await pool.query(
        `UPDATE products SET stock = stock - $1 WHERE id = $2 AND stock >= $1`,
        [item.quantity, item.productId]
      );
    }

    const payment = await createPayment({
      orderId: order.id,
      amount: total,
      method: paymentMethod,
    });

    await pool.query("COMMIT");

    res.status(201).json({ order, payment });
  } catch (err) {
    await pool.query("ROLLBACK");
    res.status(500).json({ msg: "Order failed", error: err.message });
  }
};

export const userOrders = async (req, res) => {
  try {
    const orders = await getUserOrders(req.user.id);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ msg: "Failed to fetch orders", error: err.message });
  }
};

export const orderDetails = async (req, res) => {
  try {
    const details = await getOrderDetails(req.params.orderId);
    res.json(details);
  } catch (err) {
    res
      .status(500)
      .json({ msg: "Failed to fetch order details", error: err.message });
  }
};

export const adminGetAllOrders = async (req, res) => {
  try {
    const orders = await getAllOrders();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ msg: "Failed to fetch orders", error: err.message });
  }
};

export const adminGetOrderStats = async (req, res) => {
  try {
    const stats = await getOrderStats();
    res.json(stats);
  } catch (err) {
    res
      .status(500)
      .json({ msg: "Failed to fetch order stats", error: err.message });
  }
};

export const adminGetOrderDetails = async (req, res) => {
  try {
    const order = await getFullOrderDetails(req.params.orderId);
    if (!order) {
      return res.status(404).json({ msg: "Order not found" });
    }
    res.json(order);
  } catch (err) {
    res
      .status(500)
      .json({ msg: "Failed to fetch order details", error: err.message });
  }
};

export const adminUpdateOrderStatus = async (req, res) => {
  // Check if body exists
  if (!req.body) {
    return res.status(400).json({ msg: "Request body is missing" });
  }

  const { status } = req.body;

  // Check if status exists in body
  if (!status) {
    return res.status(400).json({ msg: "Status is required in request body" });
  }

  const validStatuses = [
    "pending",
    "processing",
    "shipped",
    "completed",
    "cancelled",
  ];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ msg: "Invalid status value" });
  }

  try {
    const order = await updateOrderStatus(req.params.orderId, status);
    res.json(order);
  } catch (err) {
    res
      .status(500)
      .json({ msg: "Failed to update order status", error: err.message });
  }
};

export const adminCancelOrder = async (req, res) => {
  try {
    const order = await cancelOrder(req.params.orderId);
    res.json(order);
  } catch (err) {
    res.status(500).json({ msg: "Failed to cancel order", error: err.message });
  }
};
