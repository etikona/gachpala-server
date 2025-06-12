import pool from "../db";

export const createProduct = async ({
  sellerId,
  name,
  description,
  category,
  price,
  stock,
}) => {
  const res = await pool.query(
    `INSERT INTO products (seller_id, name, description, category, price, stock)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [sellerId, name, description, category, price, stock]
  );
  return res.rows[0];
};

export const getProducts = async (search, category) => {
  let query = "SELECT * FROM products WHERE 1=1";
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    query += ` AND name ILIKE $${params.length}`;
  }

  if (category) {
    params.push(category);
    query += ` AND category = $${params.length}`;
  }

  const res = await pool.query(query + " ORDER BY created_at DESC", params);
  return res.rows;
};
