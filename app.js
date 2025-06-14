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

dotenv.config();
// Middleware
app.use(cors());
app.use(express.json());

// Immediately test connection

app.get("/db-test", async (req, res) => {
  res.send("Hello from Postgresql");
});

// Routes
app.use("/api/v1/admin", adminDashboard);
app.use("/api/v1/payments", paymentRouter);
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/seller", sellerRouter);
app.use("/api/v1/blogs", blogRouter);
app.use("/api/v1/ai", aiRouter);
app.use("/api/v1/protected", protectedRoute);
app.use("/api/v1/auth", authRouter);
app.listen(PORT, async () => {
  console.log(`Gach-Pala API Running on ${PORT}`);
});

export default app;
