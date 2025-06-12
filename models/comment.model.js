import pool from "../db.js";

export const addComment = async ({ userId, blogId, content }) => {
  const res = await pool.query(
    `INSERT INTO comments (user_id, blog_id, content) VALUES ($1, $2, $3) RETURNING *`,
    [userId, blogId, content]
  );
  return res.rows[0];
};

export const getCommentsByBlog = async (blogId) => {
  const res = await pool.query(
    `SELECT c.*, u.name AS username FROM comments c
     JOIN users u ON c.user_id = u.id
     WHERE c.blog_id = $1 ORDER BY c.created_at DESC`,
    [blogId]
  );
  return res.rows;
};
