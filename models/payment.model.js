import pool from "../db.js";

export const createPayment = async ({ orderId, amount, method }) => {
  const res = await pool.query(
    `INSERT INTO payments (order_id, amount, method, status)
     VALUES ($1, $2, $3, 'success') RETURNING *`,
    [orderId, amount, method]
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
