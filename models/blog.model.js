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
  // Filter out undefined values and convert to snake_case
  const cleanUpdates = Object.entries(updates).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      // Convert camelCase to snake_case
      const snakeKey = key.replace(
        /[A-Z]/g,
        (letter) => `_${letter.toLowerCase()}`
      );
      acc[snakeKey] = value;
    }
    return acc;
  }, {});

  if (Object.keys(cleanUpdates).length === 0) {
    throw new Error("No fields to update");
  }

  const fields = [];
  const values = [];
  let paramIndex = 1;

  Object.entries(cleanUpdates).forEach(([key, value]) => {
    // Quote column names to prevent SQL errors
    fields.push(`"${key}" = $${paramIndex}`);
    values.push(value);
    paramIndex++;
  });

  const query = {
    text: `
      UPDATE blogs
      SET ${fields.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING *
    `,
    values: [...values, id],
  };

  console.log("Executing query:", query.text, query.values);

  try {
    const res = await pool.query(query);
    return res.rows[0];
  } catch (err) {
    console.error("Database error:", err);
    throw new Error(`Database error: ${err.message}`);
  }
};

// DELETE
export const deleteBlog = async (id) => {
  const blogRes = await pool.query("SELECT image FROM blogs WHERE id = $1", [
    id,
  ]);
  const blog = blogRes.rows[0];

  if (!blog) throw new Error("Blog not found");

  // Delete image file if exists
  if (blog.image) {
    const imagePath = path.join(process.cwd(), blog.image);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
  }

  await pool.query("DELETE FROM blogs WHERE id = $1", [id]);
};
