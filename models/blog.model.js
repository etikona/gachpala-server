import pool from "../db.js";

export const createBlog = async ({ title, content, category }) => {
  const res = await pool.query(
    `INSERT INTO blogs (title, content, category) VALUES ($1, $2, $3) RETURNING *`,
    [title, content, category]
  );
  return res.rows[0];
};

export const getAllBlogs = async (search, category) => {
  let query = "SELECT * FROM blogs WHERE 1=1";
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    query += ` AND title ILIKE $${params.length}`;
  }
  if (category) {
    params.push(category);
    query += ` AND category = $${params.length}`;
  }

  const res = await pool.query(query + " ORDER BY created_at DESC", params);
  return res.rows;
};

export const getBlogById = async (id) => {
  const res = await pool.query("SELECT * FROM blogs WHERE id = $1", [id]);
  return res.rows[0];
};
