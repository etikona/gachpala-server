import pool from "../db.js";

export const UserSubscription = {
  findByUserId: async (userId) => {
    const result = await pool.query(
      `
      SELECT us.*, sp.name as plan_name, sp.price, sp.image_limit 
      FROM user_subscriptions us 
      JOIN subscription_plans sp ON us.plan_id = sp.id 
      WHERE us.user_id = $1 
      ORDER BY us.created_at DESC 
      LIMIT 1
    `,
      [userId]
    );

    return result.rows[0];
  },

  create: async (userId, planId, periodStart, periodEnd) => {
    const result = await pool.query(
      `
      INSERT INTO user_subscriptions 
      (user_id, plan_id, current_period_start, current_period_end) 
      VALUES ($1, $2, $3, $4) 
      RETURNING *
    `,
      [userId, planId, periodStart, periodEnd]
    );

    return result.rows[0];
  },

  update: async (subscriptionId, updates) => {
    const fields = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updates)) {
      fields.push(`${key} = $${paramCount}`);
      values.push(value);
      paramCount++;
    }

    values.push(subscriptionId);

    const result = await pool.query(
      `UPDATE user_subscriptions SET ${fields.join(
        ", "
      )}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return result.rows[0];
  },

  incrementImagesUsed: async (subscriptionId) => {
    const result = await pool.query(
      "UPDATE user_subscriptions SET images_used = images_used + 1, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *",
      [subscriptionId]
    );

    return result.rows[0];
  },

  findAll: async () => {
    const result = await pool.query(`
      SELECT us.*, u.email, sp.name as plan_name, sp.price as price, sp.image_limit 
      FROM user_subscriptions us 
      JOIN users u ON us.user_id = u.id 
      JOIN subscription_plans sp ON us.plan_id = sp.id 
      ORDER BY us.created_at DESC
    `);

    return result.rows;
  },

  findByUserAndPlan: async (userId, planId) => {
    const result = await pool.query(
      "SELECT * FROM user_subscriptions WHERE user_id = $1 AND plan_id = $2 AND status = $3 ORDER BY created_at DESC LIMIT 1",
      [userId, planId, "active"]
    );

    return result.rows[0];
  },

  resetMonthlyUsage: async () => {
    const result = await pool.query(`
      UPDATE user_subscriptions 
      SET images_used = 0, updated_at = CURRENT_TIMESTAMP 
      WHERE status = 'active' AND current_period_end <= CURRENT_DATE
    `);

    return result.rowCount;
  },

  delete: async (subscriptionId) => {
    const result = await pool.query(
      "DELETE FROM user_subscriptions WHERE id = $1 RETURNING *",
      [subscriptionId]
    );
    return result.rows[0];
  },

  // Additional utility functions
  getUserSubscriptionWithPlan: async (userId) => {
    const result = await pool.query(
      `
      SELECT us.*, sp.name as plan_name, sp.image_limit, sp.price
      FROM user_subscriptions us
      JOIN subscription_plans sp ON us.plan_id = sp.id
      WHERE us.user_id = $1 AND us.status = 'active'
      ORDER BY us.created_at DESC
      LIMIT 1
    `,
      [userId]
    );

    return result.rows[0];
  },

  getSubscriptionUsage: async (subscriptionId) => {
    const result = await pool.query(
      `
      SELECT us.images_used, sp.image_limit, (sp.image_limit - us.images_used) as remaining_images
      FROM user_subscriptions us
      JOIN subscription_plans sp ON us.plan_id = sp.id
      WHERE us.id = $1
    `,
      [subscriptionId]
    );

    return result.rows[0];
  },

  updateSubscriptionPeriod: async (subscriptionId, newStart, newEnd) => {
    const result = await pool.query(
      `
      UPDATE user_subscriptions 
      SET current_period_start = $1, current_period_end = $2, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $3 
      RETURNING *
    `,
      [newStart, newEnd, subscriptionId]
    );

    return result.rows[0];
  },

  findExpiredSubscriptions: async () => {
    const result = await pool.query(`
      SELECT us.*, u.email
      FROM user_subscriptions us
      JOIN users u ON us.user_id = u.id
      WHERE us.current_period_end < CURRENT_DATE AND us.status = 'active'
    `);

    return result.rows;
  },

  bulkUpdateStatus: async (subscriptionIds, newStatus) => {
    const result = await pool.query(
      `
      UPDATE user_subscriptions 
      SET status = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ANY($2) 
      RETURNING *
    `,
      [newStatus, subscriptionIds]
    );

    return result.rows;
  },
};
