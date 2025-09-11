import pool from "../db.js";
import {
  createOrder,
  // addOrderItem,
  getUserOrders,
  getSellerOrders,
  getOrderDetails,
  getAllOrders,
  getOrderStats,
  getFullOrderDetails,
  updateOrderStatus,
  updateOrderAdminNotes,
  cancelOrder,
  deleteOrder,
  getOrderById,
} from "../models/order.model.js";
import { createPayment } from "../models/payment.model.js";

export const placeOrder = async (req, res) => {
  const { items, paymentMethod, shippingAddress, userName, userEmail } =
    req.body;
  const userId = req.user.id;

  try {
    await pool.query("BEGIN");

    // For single product orders (since your table only supports one product per order)
    if (items.length !== 1) {
      throw new Error(
        "Your database structure only supports single product orders. Please modify your schema for multiple products."
      );
    }

    const item = items[0];

    const result = await pool.query(
      `SELECT price, stock FROM products WHERE id = $1`,
      [item.productId]
    );

    if (result.rows.length === 0) {
      throw new Error(`Product with ID ${item.productId} not found`);
    }

    const price = parseFloat(result.rows[0].price);
    const stock = parseInt(result.rows[0].stock);

    if (stock < item.quantity) {
      throw new Error(
        `Insufficient stock for product ID ${item.productId}. Available: ${stock}, Requested: ${item.quantity}`
      );
    }

    const total = price * item.quantity;

    // Create the order with product_id
    const order = await createOrder({
      userId,
      total,
      quantity: item.quantity,
      shippingAddress,
      paymentMethod,
      userName,
      userEmail,
      productId: item.productId, // Add productId
    });

    // Reduce stock
    await pool.query(`UPDATE products SET stock = stock - $1 WHERE id = $2`, [
      item.quantity,
      item.productId,
    ]);

    // Create payment record
    const payment = await createPayment({
      orderId: order.id,
      amount: total,
      method: paymentMethod,
      status: "pending",
    });

    await pool.query("COMMIT");

    res.status(201).json({
      message: "Order placed successfully",
      order,
      payment,
    });
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error("Order placement error:", err);
    res.status(500).json({
      msg: "Order failed",
      error: err.message,
    });
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

export const sellerOrders = async (req, res) => {
  try {
    const orders = await getSellerOrders(req.user.id);
    res.json(orders);
  } catch (err) {
    res
      .status(500)
      .json({ msg: "Failed to fetch seller orders", error: err.message });
  }
};

export const orderDetails = async (req, res) => {
  try {
    // Check if the order belongs to the user
    const order = await getOrderById(req.params.orderId);

    if (!order) {
      return res.status(404).json({ msg: "Order not found" });
    }

    if (order.user_id !== req.user.id) {
      return res.status(403).json({ msg: "Access denied" });
    }

    const details = await getOrderDetails(req.params.orderId);
    res.json({ order, items: details });
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
  if (!req.body) {
    return res.status(400).json({ msg: "Request body is missing" });
  }

  const { status } = req.body;

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

export const adminUpdateOrderNotes = async (req, res) => {
  if (!req.body) {
    return res.status(400).json({ msg: "Request body is missing" });
  }

  // Accept both adminNotes and admin_notes
  const { adminNotes, admin_notes } = req.body;
  const notes = adminNotes || admin_notes;

  console.log("Admin notes received:", notes);

  if (!notes) {
    return res.status(400).json({
      msg: "Admin notes are required",
      hint: "Use either 'adminNotes' or 'admin_notes' field in the request body",
    });
  }

  try {
    const order = await updateOrderAdminNotes(req.params.orderId, notes);
    res.json(order);
  } catch (err) {
    res
      .status(500)
      .json({ msg: "Failed to update order notes", error: err.message });
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

export const adminDeleteOrder = async (req, res) => {
  try {
    const order = await deleteOrder(req.params.orderId);
    if (!order) {
      return res.status(404).json({ msg: "Order not found" });
    }
    res.json({ msg: "Order deleted successfully" });
  } catch (err) {
    res.status(500).json({ msg: "Failed to delete order", error: err.message });
  }
};

export const userCancelOrder = async (req, res) => {
  try {
    // Check if the order belongs to the user
    const order = await getOrderById(req.params.orderId);

    if (!order) {
      return res.status(404).json({ msg: "Order not found" });
    }

    if (order.user_id !== req.user.id) {
      return res.status(403).json({ msg: "Access denied" });
    }

    // Only allow cancellation if order is still pending
    if (order.status !== "pending") {
      return res
        .status(400)
        .json({ msg: "Only pending orders can be cancelled" });
    }

    const cancelledOrder = await cancelOrder(req.params.orderId);
    res.json(cancelledOrder);
  } catch (err) {
    res.status(500).json({ msg: "Failed to cancel order", error: err.message });
  }
};

export const sellerCancelOrder = async (req, res) => {
  try {
    // Check if the order contains products from this seller
    const orderDetails = await getFullOrderDetails(req.params.orderId);

    if (!orderDetails) {
      return res.status(404).json({ msg: "Order not found" });
    }

    const hasSellerProducts = orderDetails.items.some(
      (item) => item.seller_id === req.user.id
    );

    if (!hasSellerProducts) {
      return res.status(403).json({ msg: "Access denied" });
    }

    // Only allow cancellation if order is still pending
    if (orderDetails.status !== "pending") {
      return res
        .status(400)
        .json({ msg: "Only pending orders can be cancelled" });
    }

    const cancelledOrder = await cancelOrder(req.params.orderId);
    res.json(cancelledOrder);
  } catch (err) {
    res.status(500).json({ msg: "Failed to cancel order", error: err.message });
  }
};
