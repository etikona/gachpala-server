import pool from "../db.js";

export const createSeller = async ({ userId, businessName }) => {
  const res = await pool.query(
    `INSERT INTO sellers (user_id, business_name) VALUES ($1, $2) RETURNING *`,
    [userId, businessName]
  );
  return res.rows[0];
};

export const getSellerByUserId = async (userId) => {
  const res = await pool.query(`SELECT * FROM sellers WHERE user_id = $1`, [
    userId,
  ]);
  return res.rows[0];
};

export const approveSeller = async (id) => {
  const res = await pool.query(
    `UPDATE sellers SET approved = true WHERE id = $1 RETURNING *`,
    [id]
  );
  return res.rows[0];
};
