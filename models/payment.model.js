import pool from "../db.js";

// In your payment.model.js
export const createPayment = async ({
  orderId,
  amount,
  method,
  status = "pending",
}) => {
  const res = await pool.query(
    `INSERT INTO payments (order_id, amount, method, status) VALUES ($1, $2, $3, $4) RETURNING *`,
    [orderId, amount, method, status]
  );
  return res.rows[0];
};

export const getPaymentsForSeller = async (sellerId) => {
  const res = await pool.query(
    `SELECT pay.*, o.user_id
     FROM payments pay
     JOIN orders o ON pay.order_id = o.id
     JOIN order_items oi ON oi.order_id = o.id
     JOIN products p ON oi.product_id = p.id
     WHERE p.seller_id = $1`,
    [sellerId]
  );
  return res.rows;
};
