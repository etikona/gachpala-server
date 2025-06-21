import pool from "../db.js";

export const addRating = async ({ userId, productId, rating, review }) => {
  const res = await pool.query(
    `INSERT INTO ratings (user_id, product_id, rating, review) VALUES ($1, $2, $3, $4) RETURNING *`,
    [userId, productId, rating, review]
  );
  return res.rows[0];
};

export const getRatingsForProduct = async (productId) => {
  const res = await pool.query(
    `SELECT r.*, u.name AS username FROM ratings r
     JOIN users u ON r.user_id = u.id
     WHERE r.product_id = $1`,
    [productId]
  );
  return res.rows;
};
