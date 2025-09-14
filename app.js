import dotenv from "dotenv";
import express from "express";
import { PORT } from "./config/env.js";
import "./db-init.js";

import cors from "cors";
// import { fileURLToPath } from "url";
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
const app = express();
import pool from "./db.js";
import path from "path";
import authRouter from "./routes/auth.route.js";
import protectedRoute from "./routes/protected.route.js";
import blogRouter from "./routes/blog.route.js";
import sellerRouter from "./routes/seller.route.js";
import productRouter from "./routes/product.route.js";
import orderRouter from "./routes/order.route.js";
// import paymentRouter from "./routes/payment.route.js";
import adminDashboard from "./routes/adminDashboard.route.js";
import userDashboard from "./routes/userDashboard.route.js";
import adminAuthRouter from "./routes/admin.route.js";
import adminUsers from "./routes/adminUsers.route.js";
import adminSellerRoute from "./routes/adminSeller.route.js";
import adminOverviewRouter from "./routes/adminOverview.route.js";
import aiRouter from "./routes/ai.route.js";
import subscriptionRouter from "./routes/subscription.route.js";

dotenv.config();
// Middleware
app.use(
  cors({
    origin: "*" || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
// Serve static files from root directory
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

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
app.use("/api/v1/auth/admin", adminAuthRouter);
app.use("/api/v1/admin", adminDashboard);
app.use("/api/v1/admin/users", adminUsers);
app.use("/api/v1/admin/sellers", adminSellerRoute);
app.use("/api/v1/admin/overview", adminOverviewRouter);
app.use("/api/v1/user", userDashboard);
// app.use("/api/v1/payments", paymentRouter);
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/subscription", subscriptionRouter);
app.use("/api/v1/seller", sellerRouter);
app.use("/api/v1/blog", blogRouter);
app.use("/api/v1/ai", aiRouter);
app.use("/api/v1/protected", protectedRoute);
app.use("/api/v1/auth", authRouter);

// ! APP Listening
app.listen(PORT, async () => {
  console.log(`Gach-Pala API Running on ${PORT}`);
});

export default app;
