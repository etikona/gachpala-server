import pool from "../db.js";

export const SubscriptionPlan = {
  findAll: async () => {
    const result = await pool.query(
      "SELECT * FROM subscription_plans WHERE is_active = TRUE ORDER BY price"
    );
    return result.rows;
  },

  findById: async (id) => {
    const result = await pool.query(
      "SELECT * FROM subscription_plans WHERE id = $1",
      [id]
    );
    return result.rows[0];
  },

  findByName: async (name) => {
    const result = await pool.query(
      "SELECT * FROM subscription_plans WHERE name = $1",
      [name]
    );
    return result.rows[0];
  },

  create: async (planData) => {
    const {
      name,
      price,
      image_limit,
      description,
      is_active = true,
    } = planData;
    const result = await pool.query(
      "INSERT INTO subscription_plans (name, price, image_limit, description, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [name, price, image_limit, description, is_active]
    );
    return result.rows[0];
  },

  update: async (id, updates) => {
    const fields = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updates)) {
      fields.push(`${key} = $${paramCount}`);
      values.push(value);
      paramCount++;
    }

    values.push(id);

    const result = await pool.query(
      `UPDATE subscription_plans SET ${fields.join(
        ", "
      )}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return result.rows[0];
  },

  delete: async (id) => {
    const result = await pool.query(
      "DELETE FROM subscription_plans WHERE id = $1 RETURNING *",
      [id]
    );
    return result.rows[0];
  },
};
