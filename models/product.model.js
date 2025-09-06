import pool from "../db.js";

export const createProduct = async ({
  seller_id,
  name,
  description,
  category,
  price,
  stock,
  image,
}) => {
  const res = await pool.query(
    `INSERT INTO products (seller_id, name, description, category, price, stock, image)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [seller_id, name, description, category, price, stock, image]
  );
  return res.rows[0];
};

export const getProducts = async (search, category, seller_id = null) => {
  let query = "SELECT * FROM products WHERE 1=1";
  const params = [];

  if (seller_id) {
    params.push(seller_id);
    query += ` AND seller_id = $${params.length}`;
  }

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

export const getProductById = async (id, seller_id = null) => {
  let query = "SELECT * FROM products WHERE id = $1";
  const params = [id];

  if (seller_id) {
    params.push(seller_id);
    query += " AND seller_id = $2";
  }

  const res = await pool.query(query, params);
  return res.rows[0];
};

export const updateProduct = async (id, seller_id, updates) => {
  const fields = [];
  const values = [];
  let paramCount = 1;

  Object.keys(updates).forEach((key) => {
    if (updates[key] !== undefined) {
      fields.push(`${key} = $${paramCount}`);
      values.push(updates[key]);
      paramCount++;
    }
  });

  if (fields.length === 0) {
    throw new Error("No valid fields to update");
  }

  values.push(id, seller_id);
  const query = `UPDATE products SET ${fields.join(", ")} 
                 WHERE id = $${paramCount} AND seller_id = $${paramCount + 1} 
                 RETURNING *`;

  const res = await pool.query(query, values);
  return res.rows[0];
};

export const deleteProduct = async (id, seller_id) => {
  const res = await pool.query(
    "DELETE FROM products WHERE id = $1 AND seller_id = $2 RETURNING *",
    [id, seller_id]
  );
  return res.rows[0];
};

export const getProductsBySellerId = async (seller_id, search, category) => {
  let query = "SELECT * FROM products WHERE seller_id = $1";
  const params = [seller_id];
  let paramCount = 2;

  if (search) {
    params.push(`%${search}%`);
    query += ` AND name ILIKE $${paramCount}`;
    paramCount++;
  }

  if (category) {
    params.push(category);
    query += ` AND category = $${paramCount}`;
  }

  const res = await pool.query(query + " ORDER BY created_at DESC", params);
  return res.rows;
};
