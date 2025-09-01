import pool from "../db.js";

// User roles and status constants for maintainability
export const USER_ROLES = {
  USER: "user",
  VIP: "VIP",
  ADMIN: "admin",
};

export const USER_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  SUSPENDED: "suspended",
};

// Create a new user
export const createUser = async (name, email, password) => {
  try {
    const result = await pool.query(
      `INSERT INTO users (name, email, password, role, status) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, name, email, created_at, role, status`,
      [name, email, password, USER_ROLES.USER, USER_STATUS.ACTIVE]
    );
    return result.rows[0];
  } catch (err) {
    console.error("DB insert error:", err);
    throw err;
  }
};

// Find user by email
export const findUserByEmail = async (email) => {
  try {
    const result = await pool.query(`SELECT * FROM users WHERE email = $1`, [
      email,
    ]);
    return result.rows[0];
  } catch (err) {
    console.error("DB query error:", err);
    throw err;
  }
};

// Get user by ID with profile information
export const getUserById = async (id) => {
  try {
    console.log("Fetching user with ID:", id); // Debug log

    const query = `
      SELECT 
        u.id, u.name, u.email, u.profile_image, 
        u.created_at, u.status, u.role,
        COALESCE((
          SELECT COUNT(*) 
          FROM ai_photos 
          WHERE user_id = u.id
        ), 0) as uploaded_images_count
      FROM users u 
      WHERE u.id = $1
    `;

    const result = await pool.query(query, [id]);
    console.log("User query result:", result.rows[0]); // Debug log

    return result.rows[0];
  } catch (err) {
    console.error("DB query error in getUserById:", err);
    throw err;
  }
};

// Update user profile
export const updateUserProfile = async (id, updates) => {
  try {
    const { name, profile_image } = updates;
    const query = `
      UPDATE users 
      SET name = COALESCE($1, name), 
          profile_image = COALESCE($2, profile_image),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3 
      RETURNING id, name, email, profile_image, created_at, status, role
    `;
    const { rows } = await pool.query(query, [name, profile_image, id]);
    return rows[0];
  } catch (err) {
    console.error("DB update error:", err);
    throw err;
  }
};

// Update user subscription plan
export const updateUserSubscription = async (id, plan) => {
  try {
    // Validate plan
    const validPlans = ["basic", "premium", "vip"];
    if (!validPlans.includes(plan)) {
      throw new Error("Invalid subscription plan");
    }

    const role = plan === "vip" ? USER_ROLES.VIP : USER_ROLES.USER;

    const query = `
      UPDATE users 
      SET role = $1, 
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 
      RETURNING id, name, email, profile_image, created_at, status, role
    `;
    const { rows } = await pool.query(query, [role, id]);
    return rows[0];
  } catch (err) {
    console.error("DB update error:", err);
    throw err;
  }
};

// Admin functions (unchanged but improved error handling)
export const getAllUsers = async (page = 1, limit = 10) => {
  try {
    const offset = (page - 1) * limit;
    const query = `
      SELECT 
        u.id, u.name, u.email, u.created_at AS joining_date, 
        u.status, u.role,
        COUNT(o.id) AS orders
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      WHERE u.role IN ($1, $2)
      GROUP BY u.id
      ORDER BY u.created_at DESC
      LIMIT $3 OFFSET $4
    `;
    const { rows } = await pool.query(query, [
      USER_ROLES.USER,
      USER_ROLES.VIP,
      limit,
      offset,
    ]);
    return rows;
  } catch (err) {
    console.error("DB query error:", err);
    throw err;
  }
};

export const getTotalUsersCount = async () => {
  try {
    const { rows } = await pool.query(
      `SELECT COUNT(*) FROM users WHERE role IN ($1, $2)`,
      [USER_ROLES.USER, USER_ROLES.VIP]
    );
    return parseInt(rows[0].count);
  } catch (err) {
    console.error("DB query error:", err);
    throw err;
  }
};

export const getUserStats = async () => {
  try {
    const query = `
      SELECT 
        COUNT(*) AS total_users,
        COUNT(*) FILTER (WHERE status = $1) AS active_users,
        COUNT(*) FILTER (WHERE role = $2) AS vip_users,
        COALESCE(AVG(order_counts.order_count) FILTER (WHERE u.status = $1), 0) AS avg_orders_per_active
      FROM users u
      LEFT JOIN (
        SELECT user_id, COUNT(*) AS order_count 
        FROM orders 
        GROUP BY user_id
      ) AS order_counts ON u.id = order_counts.user_id
      WHERE u.role IN ($3, $4)
    `;
    const { rows } = await pool.query(query, [
      USER_STATUS.ACTIVE,
      USER_ROLES.VIP,
      USER_ROLES.USER,
      USER_ROLES.VIP,
    ]);
    return rows[0];
  } catch (err) {
    console.error("DB query error:", err);
    throw err;
  }
};

export const updateUser = async (id, updates) => {
  try {
    const { name, email, status, role } = updates;
    const query = `
      UPDATE users 
      SET name = $1, email = $2, status = $3, role = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $5 
      RETURNING id, name, email, created_at, status, role
    `;
    const { rows } = await pool.query(query, [name, email, status, role, id]);
    return rows[0];
  } catch (err) {
    console.error("DB update error:", err);
    throw err;
  }
};

export const deleteUser = async (id) => {
  try {
    await pool.query("DELETE FROM users WHERE id = $1", [id]);
  } catch (err) {
    console.error("DB delete error:", err);
    throw err;
  }
};

export const getUserOrders = async (userId) => {
  try {
    const query = `
      SELECT * 
      FROM orders 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `;
    const { rows } = await pool.query(query, [userId]);
    return rows;
  } catch (err) {
    console.error("DB query error:", err);
    throw err;
  }
};
