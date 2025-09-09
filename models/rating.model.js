import pool from "../db.js";

export const addRating = async ({ userId, productId, rating, review }) => {
  const res = await pool.query(
    `INSERT INTO ratings (user_id, product_id, rating, review) 
     VALUES ($1, $2, $3, $4) 
     RETURNING *`,
    [userId, productId, rating, review]
  );
  return res.rows[0];
};

export const getRatingsForProduct = async (productId) => {
  const res = await pool.query(
    `SELECT r.*, u.name AS username
     FROM ratings r
     JOIN users u ON r.user_id = u.id
     WHERE r.product_id = $1 
     ORDER BY r.created_at DESC`,
    [productId]
  );
  return res.rows;
};

export const getRatingById = async (ratingId) => {
  const res = await pool.query(
    `SELECT r.*, u.name AS username, u.avatar AS user_avatar 
     FROM ratings r
     JOIN users u ON r.user_id = u.id
     WHERE r.id = $1`,
    [ratingId]
  );
  return res.rows[0];
};

export const getUserRatingForProduct = async (userId, productId) => {
  const res = await pool.query(
    `SELECT * FROM ratings 
     WHERE user_id = $1 AND product_id = $2`,
    [userId, productId]
  );
  return res.rows[0];
};

export const updateRating = async (ratingId, updates) => {
  const { rating, review } = updates;
  const res = await pool.query(
    `UPDATE ratings 
     SET rating = $1, review = $2, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $3 
     RETURNING *`,
    [rating, review, ratingId]
  );
  return res.rows[0];
};

export const deleteRating = async (ratingId) => {
  const res = await pool.query(
    `DELETE FROM ratings 
     WHERE id = $1 
     RETURNING *`,
    [ratingId]
  );
  return res.rows[0];
};

export const getProductRatingStats = async (productId) => {
  const res = await pool.query(
    `SELECT 
       COUNT(*) as total_ratings,
       AVG(rating) as average_rating,
       COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star,
       COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
       COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
       COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
       COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star
     FROM ratings 
     WHERE product_id = $1`,
    [productId]
  );
  return res.rows[0];
};
