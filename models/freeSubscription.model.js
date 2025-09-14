import pool from "../db.js";

const UserFreeUsage = {
  findByUserId: async (userId) => {
    const result = await pool.query(
      `
      SELECT uf.* 
      FROM user_free_usage uf 
      WHERE uf.user_id = $1 
      AND uf.month = EXTRACT(MONTH FROM CURRENT_DATE)
      AND uf.year = EXTRACT(YEAR FROM CURRENT_DATE)
      LIMIT 1
    `,
      [userId]
    );

    return result.rows[0];
  },

  createOrUpdate: async (userId, imagesUsed = 1) => {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    // Check if record exists
    const existingRecord = await pool.query(
      `
      SELECT * FROM user_free_usage 
      WHERE user_id = $1 AND month = $2 AND year = $3
    `,
      [userId, currentMonth, currentYear]
    );

    if (existingRecord.rows.length > 0) {
      // Update existing record
      const result = await pool.query(
        `
        UPDATE user_free_usage 
        SET images_used = images_used + $1, updated_at = CURRENT_TIMESTAMP 
        WHERE user_id = $2 AND month = $3 AND year = $4 
        RETURNING *
      `,
        [imagesUsed, userId, currentMonth, currentYear]
      );

      return result.rows[0];
    } else {
      // Create new record
      const result = await pool.query(
        `
        INSERT INTO user_free_usage (user_id, month, year, images_used) 
        VALUES ($1, $2, $3, $4) 
        RETURNING *
      `,
        [userId, currentMonth, currentYear, imagesUsed]
      );

      return result.rows[0];
    }
  },

  getMonthlyUsage: async (userId, month, year) => {
    const result = await pool.query(
      `
      SELECT images_used 
      FROM user_free_usage 
      WHERE user_id = $1 AND month = $2 AND year = $3
    `,
      [userId, month, year]
    );

    return result.rows[0]?.images_used || 0;
  },

  resetAllMonthlyUsage: async () => {
    const result = await pool.query(`
      DELETE FROM user_free_usage 
      WHERE (year < EXTRACT(YEAR FROM CURRENT_DATE)) 
      OR (year = EXTRACT(YEAR FROM CURRENT_DATE) AND month < EXTRACT(MONTH FROM CURRENT_DATE))
    `);

    return result.rowCount;
  },
};

module.exports = UserFreeUsage;
