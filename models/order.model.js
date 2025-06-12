import pool from "../db";

export const createOrder = async ({ userId, total }) => {
  const res = await pool.query(
    `INSERT INTO orders (user_id, total) VALUES ($1, $2) RETURNING *`,
    [userId, total]
  );
  return res.rows[0];
};

export const addOrderItem = async ({ orderId, productId, quantity, price }) => {
  await pool.query(
    `INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)`,
    [orderId, productId, quantity, price]
  );
};

export const getUserOrders = async (userId) => {
  const res = await pool.query(
    `SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  return res.rows;
};

export const getOrderDetails = async (orderId) => {
  const res = await pool.query(
    `SELECT oi.*, p.name FROM order_items oi
     JOIN products p ON oi.product_id = p.id
     WHERE oi.order_id = $1`,
    [orderId]
  );
  return res.rows;
};
