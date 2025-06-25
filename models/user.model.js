import pool from "../db.js";

export const createUser = async (name, email, password) => {
  console.log("Creating user with:", { name, email, password });
  const result = await pool.query(
    `INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *`,
    [name, email, password]
  );
  return result.rows[0];
};

export const findUserByEmail = async (email) => {
  const result = await pool.query(`SELECT * FROM users WHERE email = $1`, [
    email,
  ]);
  return result.rows[0];
};

// module.exports = { createUser, findUserByEmail };
