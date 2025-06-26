import express from "express";
import { PORT } from "./config/env.js";
import cors from "cors";
const app = express();
import pool from "./db.js";
import authRouter from "./routes/auth.route.js";
import protectedRoute from "./routes/protected.route.js";
import dotenv from "dotenv";
import aiRouter from "./routes/ai.route.js";
import blogRouter from "./routes/blog.route.js";
import sellerRouter from "./routes/seller.route.js";
import productRouter from "./routes/product.route.js";
import orderRouter from "./routes/order.route.js";
import paymentRouter from "./routes/payment.route.js";
import adminDashboard from "./routes/adminDashboard.route.js";
import userDashboard from "./routes/userDashboard.route.js";

dotenv.config();
// Middleware
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

// Immediately test connection

app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW() as time");
    res.json({
      status: "success",
      time: result.rows[0].time,
      dbConfig: pool.options, // Shows connection details
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
      config: pool.options,
    });
  }
});

// Routes
app.use("/api/v1/admin", adminDashboard);
app.use("/api/v1/user", userDashboard);
app.use("/api/v1/payments", paymentRouter);
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/seller", sellerRouter);
app.use("/api/v1/blog", blogRouter);
app.use("/api/v1/ai", aiRouter);
app.use("/api/v1/protected", protectedRoute);
app.use("/api/v1/auth", authRouter);
app.listen(PORT, async () => {
  console.log(`Gach-Pala API Running on ${PORT}`);
});

export default app;
