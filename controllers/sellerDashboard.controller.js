import pool from "../db";
import { getSellerByUserId } from "../models/sellerModel";

export const getSellerDashboard = async (req, res) => {
  try {
    const seller = await getSellerByUserId(req.user.id);
    if (!seller) return res.status(403).json({ msg: "Not a seller" });

    // 1) Products
    const products = await pool.query(
      "SELECT * FROM products WHERE seller_id = $1",
      [seller.id]
    );

    // 2) Stock (same as products, but highlighting low stock is frontend logic)
    // 3) Payments
    const payments = await pool.query(
      `
      SELECT pay.*, o.user_id FROM payments pay
      JOIN orders o ON pay.order_id = o.id
      JOIN order_items oi ON oi.order_id = o.id
      JOIN products p ON oi.product_id = p.id
      WHERE p.seller_id = $1
    `,
      [seller.id]
    );

    res.json({
      seller: seller,
      products: products.rows,
      payments: payments.rows,
    });
  } catch (err) {
    res
      .status(500)
      .json({ msg: "Failed to load seller dashboard", error: err.message });
  }
};
