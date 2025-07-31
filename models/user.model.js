import pool from "../db.js";

// Existing functions (keep unchanged)
export const createUser = async (name, email, password) => {
  try {
    const result = await pool.query(
      `INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *`,
      [name, email, password]
    );
    return result.rows[0];
  } catch (err) {
    console.error("DB insert error:", err);
    throw err;
  }
};

export const findUserByEmail = async (email) => {
  const result = await pool.query(`SELECT * FROM users WHERE email = $1`, [
    email,
  ]);
  return result.rows[0];
};

// New admin dashboard functions
export const getAllUsers = async (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  const query = `
    SELECT 
      u.id, u.name, u.email, u.created_at AS joining_date, 
      u.status, u.role,
      COUNT(o.id) AS orders
    FROM users u
    LEFT JOIN orders o ON u.id = o.user_id
    WHERE u.role IN ('user', 'VIP')
    GROUP BY u.id
    ORDER BY u.created_at DESC
    LIMIT $1 OFFSET $2
  `;
  const { rows } = await pool.query(query, [limit, offset]);
  return rows;
};

export const getTotalUsersCount = async () => {
  const { rows } = await pool.query(
    `SELECT COUNT(*) FROM users WHERE role IN ('user', 'VIP')`
  );
  return parseInt(rows[0].count);
};

export const getUserStats = async () => {
  const query = `
    SELECT 
      COUNT(*) AS total_users,
      COUNT(*) FILTER (WHERE status = 'active') AS active_users,
      COUNT(*) FILTER (WHERE role = 'VIP') AS vip_users,
      COALESCE(AVG(order_counts.order_count) FILTER (WHERE u.status = 'active'), 0) AS avg_orders_per_active
    FROM users u
    LEFT JOIN (
      SELECT user_id, COUNT(*) AS order_count 
      FROM orders 
      GROUP BY user_id
    ) AS order_counts ON u.id = order_counts.user_id
    WHERE u.role IN ('user', 'VIP')
  `;
  const { rows } = await pool.query(query);
  return rows[0];
};
export const getUserById = async (id) => {
  const query = `
    SELECT id, name, email, created_at, status, role 
    FROM users WHERE id = $1
  `;
  const { rows } = await pool.query(query, [id]);
  return rows[0];
};

export const updateUser = async (id, updates) => {
  const { name, email, status, role } = updates;
  const query = `
    UPDATE users 
    SET name = $1, email = $2, status = $3, role = $4 
    WHERE id = $5 
    RETURNING id, name, email, created_at, status, role
  `;
  const { rows } = await pool.query(query, [name, email, status, role, id]);
  return rows[0];
};

export const deleteUser = async (id) => {
  await pool.query("DELETE FROM users WHERE id = $1", [id]);
};

export const getUserOrders = async (userId) => {
  const query = `
    SELECT * 
    FROM orders 
    WHERE user_id = $1 
    ORDER BY created_at DESC
  `;
  const { rows } = await pool.query(query, [userId]);
  return rows;
};
