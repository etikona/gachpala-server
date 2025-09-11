import pool from "../db.js";

export const createOrder = async ({
  userId,
  total,
  quantity,
  shippingAddress,
  paymentMethod,
  userName,
  userEmail,
  productId, // Add productId since it's in your orders table
}) => {
  try {
    const res = await pool.query(
      `INSERT INTO orders (user_id, total, quantity, shipping_address, payment_method, user_name, user_email, status, product_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8) RETURNING *`,
      [
        parseInt(userId),
        parseFloat(total),
        parseInt(quantity),
        shippingAddress,
        paymentMethod,
        userName,
        userEmail,
        parseInt(productId),
      ]
    );
    return res.rows[0];
  } catch (error) {
    console.error("Error in createOrder:", error);
    throw error;
  }
};
// export const addOrderItem = async ({ orderId, productId, quantity, price }) => {
//   await pool.query(
//     `INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)`,
//     [orderId, productId, quantity, price]
//   );
// };

export const getUserOrders = async (userId) => {
  const res = await pool.query(
    `SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  return res.rows;
};

export const getSellerOrders = async (sellerId) => {
  const res = await pool.query(
    `SELECT o.*, oi.product_id, p.seller_id
     FROM orders o
     JOIN order_items oi ON o.id = oi.order_id
     JOIN products p ON oi.product_id = p.id
     WHERE p.seller_id = $1
     GROUP BY o.id, oi.product_id, p.seller_id
     ORDER BY o.created_at DESC`,
    [sellerId]
  );
  return res.rows;
};

export const getOrderDetails = async (orderId) => {
  const res = await pool.query(
    `SELECT oi.*, p.name FROM order_items oi
     JOIN products p ON oi.product_id = p.id
     WHERE oi.order_id = $1`,
    [orderId]
  );
  return res.rows;
};

export const getAllOrders = async () => {
  const res = await pool.query(
    `SELECT o.*, u.name as customer_name, u.email as customer_email 
     FROM orders o
     JOIN users u ON o.user_id = u.id
     ORDER BY o.created_at DESC`
  );
  return res.rows;
};

export const getOrderStats = async () => {
  const res = await pool.query(`
    SELECT 
      COUNT(*) as total_orders,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_orders,
      SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing_orders,
      SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders,
      SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END) as shipped_orders,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_orders
    FROM orders
  `);
  return res.rows[0];
};

export const getFullOrderDetails = async (orderId) => {
  // Get order info
  const orderRes = await pool.query(
    `SELECT o.*, u.name as customer_name, u.email as customer_email, u.phone as customer_phone
     FROM orders o
     JOIN users u ON o.user_id = u.id
     WHERE o.id = $1`,
    [orderId]
  );

  if (orderRes.rows.length === 0) {
    return null;
  }

  // Get order items
  const itemsRes = await pool.query(
    `SELECT oi.*, p.name, p.image, p.seller_id
     FROM order_items oi
     JOIN products p ON oi.product_id = p.id
     WHERE oi.order_id = $1`,
    [orderId]
  );

  // Get payment info
  const paymentRes = await pool.query(
    `SELECT * FROM payments WHERE order_id = $1`,
    [orderId]
  );

  return {
    ...orderRes.rows[0],
    items: itemsRes.rows,
    payment: paymentRes.rows[0] || null,
  };
};

export const updateOrderStatus = async (orderId, status) => {
  const res = await pool.query(
    `UPDATE orders SET status = $1 WHERE id = $2 RETURNING *`,
    [status, orderId]
  );
  return res.rows[0];
};

export const updateOrderAdminNotes = async (orderId, adminNotes) => {
  const res = await pool.query(
    `UPDATE orders SET admin_notes = $1 WHERE id = $2 RETURNING *`,
    [adminNotes, orderId]
  );
  return res.rows[0];
};

export const cancelOrder = async (orderId) => {
  try {
    await pool.query("BEGIN");

    // Update order status
    const order = await updateOrderStatus(orderId, "cancelled");

    // Restore product stock
    const items = await pool.query(
      `SELECT product_id, quantity FROM order_items WHERE order_id = $1`,
      [orderId]
    );

    for (const item of items.rows) {
      await pool.query(`UPDATE products SET stock = stock + $1 WHERE id = $2`, [
        item.quantity,
        item.product_id,
      ]);
    }

    await pool.query("COMMIT");
    return order;
  } catch (err) {
    await pool.query("ROLLBACK");
    throw err;
  }
};

export const deleteOrder = async (orderId) => {
  try {
    await pool.query("BEGIN");

    // Delete order items first (due to foreign key constraint)
    await pool.query(`DELETE FROM order_items WHERE order_id = $1`, [orderId]);

    // Delete payments
    await pool.query(`DELETE FROM payments WHERE order_id = $1`, [orderId]);

    // Delete the order
    const res = await pool.query(
      `DELETE FROM orders WHERE id = $1 RETURNING *`,
      [orderId]
    );

    await pool.query("COMMIT");
    return res.rows[0];
  } catch (err) {
    await pool.query("ROLLBACK");
    throw err;
  }
};

export const getOrderById = async (orderId) => {
  const res = await pool.query(`SELECT * FROM orders WHERE id = $1`, [orderId]);
  return res.rows[0];
};
