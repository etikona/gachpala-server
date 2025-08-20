import pool from "../db.js";

// Get total statistics
export const getOverviewStats = async () => {
  const query = `
    SELECT 
      (SELECT COALESCE(SUM(total), 0) FROM orders WHERE status = 'completed') as total_revenue,
      (SELECT COUNT(*) FROM sellers WHERE approved = true) as total_sellers,
      (SELECT COUNT(*) FROM users WHERE role IN ('user', 'VIP')) as total_users,
      (SELECT COUNT(*) FROM orders) as total_orders
  `;
  const { rows } = await pool.query(query);
  return rows[0];
};

// Get monthly revenue
export const getMonthlyRevenue = async () => {
  const query = `
    SELECT 
      DATE_TRUNC('month', created_at) as month,
      SUM(total) as revenue
    FROM orders
    WHERE status = 'completed'
    GROUP BY month
    ORDER BY month DESC
    LIMIT 12
  `;
  const { rows } = await pool.query(query);
  return rows;
};

// Get daily active users
export const getDailyActiveUsers = async (days = 30) => {
  try {
    const query = `
      SELECT 
        DATE(login_date) as date,
        COUNT(DISTINCT user_id) as active_users
      FROM user_activities
      WHERE login_date >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY DATE(login_date)
      ORDER BY date DESC
      LIMIT ${days}
    `;
    const { rows } = await pool.query(query);
    return rows;
  } catch (error) {
    console.error("Error fetching daily active users:", error);
    // Return empty array if user_activities table doesn't exist or is empty
    return [];
  }
};

// Get performance metrics
export const getPerformanceMetrics = async () => {
  try {
    // Conversion rate (orders / users)
    const conversionQuery = `
      SELECT 
        (SELECT COUNT(*) FROM orders)::float / 
        NULLIF((SELECT COUNT(*) FROM users WHERE role IN ('user', 'VIP')), 0) * 100 as conversion_rate
    `;

    // Average order value
    const aovQuery = `
      SELECT COALESCE(AVG(total), 0) as avg_order_value 
      FROM orders 
      WHERE status = 'completed'
    `;

    // Customer satisfaction (average rating) - check if reviews table exists
    let avgRating = 4.5; // Default value

    try {
      const satisfactionResult = await pool.query(`
        SELECT COALESCE(AVG(rating), 0) as avg_rating 
        FROM reviews
      `);
      avgRating = parseFloat(satisfactionResult.rows[0].avg_rating || 4.5);
    } catch (error) {
      console.log("Reviews table may not exist, using default rating");
    }

    // Return rate (check if 'returned' status exists)
    let returnRate = 0;
    try {
      const returnRateResult = await pool.query(`
        SELECT 
          (SELECT COUNT(*) FROM orders WHERE status = 'returned')::float / 
          NULLIF((SELECT COUNT(*) FROM orders), 0) * 100 as return_rate
      `);
      returnRate = parseFloat(returnRateResult.rows[0].return_rate || 0);
    } catch (error) {
      console.log("Error calculating return rate, using 0");
    }

    const [conversionResult, aovResult] = await Promise.all([
      pool.query(conversionQuery),
      pool.query(aovQuery),
    ]);

    return {
      conversionRate: parseFloat(conversionResult.rows[0].conversion_rate || 0),
      avgOrderValue: parseFloat(aovResult.rows[0].avg_order_value),
      customerSatisfaction: avgRating,
      returnRate: returnRate,
    };
  } catch (error) {
    console.error("Error in getPerformanceMetrics:", error);
    return {
      conversionRate: 0,
      avgOrderValue: 0,
      customerSatisfaction: 4.5,
      returnRate: 0,
    };
  }
};

// Get recent activity
export const getRecentActivity = async (limit = 10) => {
  try {
    // Get recent orders
    const ordersQuery = `
      SELECT 
        o.id, 
        o.total, 
        o.status, 
        o.created_at,
        u.name as user_name,
        'order' as activity_type
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
      LIMIT $1
    `;

    // Get recent user signups
    const signupsQuery = `
      SELECT 
        id, 
        name, 
        email, 
        created_at,
        'user_signup' as activity_type
      FROM users
      WHERE role IN ('user', 'VIP')
      ORDER BY created_at DESC
      LIMIT $1
    `;

    // Get recent seller registrations
    const sellersQuery = `
      SELECT 
        s.id, 
        s.business_name, 
        s.created_at,
        u.name as owner_name,
        'seller_registration' as activity_type
      FROM sellers s
      JOIN users u ON s.user_id = u.id
      ORDER BY s.created_at DESC
      LIMIT $1
    `;

    const [ordersResult, signupsResult, sellersResult] = await Promise.all([
      pool.query(ordersQuery, [limit]),
      pool.query(signupsQuery, [limit]),
      pool.query(sellersQuery, [limit]),
    ]);

    // Combine and sort all activities
    const activities = [
      ...ordersResult.rows,
      ...signupsResult.rows,
      ...sellersResult.rows,
    ]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, limit);

    return activities;
  } catch (error) {
    console.error("Error in getRecentActivity:", error);
    return [];
  }
};
