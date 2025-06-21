import pool from "../db.js";
import {
  createOrder,
  addOrderItem,
  getUserOrders,
  getOrderDetails,
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
