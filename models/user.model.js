import pool from "../db.js";

export const createUser = async (name, email, password) => {
  try {
    const result = await pool.query(
      `INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *`,
      [name, email, password]
    );
    return result.rows[0];
  } catch (err) {
    console.error("DB insert error:", err); // Log full DB error
    throw err; // Rethrow to let controller handle it
  }
};

export const findUserByEmail = async (email) => {
  const result = await pool.query(`SELECT * FROM users WHERE email = $1`, [
    email,
  ]);
  return result.rows[0];
};

// module.exports = { createUser, findUserByEmail };
