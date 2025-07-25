import pool from "../db.js";
import { generateSlug } from "../utils/slugify.js"; // New utility

//New Create
// export const createBlog = async (blogData) => {
//   const {
//     title,
//     slug,
//     content,
//     category,
//     excerpt,
//     image,
//     tags,
//     author,
//     publish_date
//   } = blogData;

//   const res = await pool.query(
//     `INSERT INTO blogs (
//       title, slug, content, category, excerpt, image, tags, author, publish_date
//     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
//     [
//       title,
//       slug,
//       content,
//       category,
//       excerpt,
//       image,
//       tags,
//       author,
//       publish_date
//     ]
//   );

//   return res.rows[0];
// };

// CREATE
export const createBlog = async (blogData) => {
  const {
    title,
    slug,
    content,
    category,
    excerpt,
    image,
    tags,
    author,
    publish_date,
  } = blogData;

  const res = await pool.query(
    `INSERT INTO blogs (
      title, slug, content, category, excerpt, image, tags, author, publish_date
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [title, slug, content, category, excerpt, image, tags, author, publish_date]
  );

  return res.rows[0];
};

// READ ALL
export const getAllBlogs = async (search, category, tag) => {
  let query = "SELECT * FROM blogs WHERE 1=1";
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    query += ` AND (title ILIKE $${params.length} OR excerpt ILIKE $${params.length})`;
  }

  if (category) {
    params.push(category);
    query += ` AND category = $${params.length}`;
  }

  if (tag) {
    params.push(tag);
    query += ` AND $${params.length} = ANY(tags)`;
  }

  query += " ORDER BY publish_date DESC";
  const res = await pool.query(query, params);
  return res.rows;
};

// READ SINGLE
export const getBlogById = async (id) => {
  const res = await pool.query("SELECT * FROM blogs WHERE id = $1", [id]);
  return res.rows[0];
};

export const getBlogBySlug = async (slug) => {
  const res = await pool.query("SELECT * FROM blogs WHERE slug = $1", [slug]);
  return res.rows[0];
};

// UPDATE
export const updateBlog = async (id, updates) => {
  const fields = [];
  const values = [];
  let paramIndex = 1;

  Object.entries(updates).forEach(([key, value]) => {
    if (key === "title" && updates.slug === undefined) {
      fields.push("slug");
      values.push(generateSlug(value));
    }
    if (value !== undefined) {
      fields.push(key);
      values.push(value);
    }
  });

  if (fields.length === 0) throw new Error("No fields to update");

  const setClause = fields
    .map((field, index) => `${field} = $${index + 1}`)
    .join(", ");

  const query = `
    UPDATE blogs
    SET ${setClause}
    WHERE id = $${fields.length + 1}
    RETURNING *
  `;
  const res = await pool.query(query, [...values, id]);
  return res.rows[0];
};

// DELETE
export const deleteBlog = async (id) => {
  await pool.query("DELETE FROM blogs WHERE id = $1", [id]);
};
