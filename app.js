import express from "express";
import { PORT } from "./config/env.js";
import cors from "cors";
const app = express();
import pool from "./db.js";

// Middleware
app.use(cors());
app.use(express.json());

// Immediately test connection

app.get("/db-test", async (req, res) => {
  res.send("Hello from Postgresql");
});

app.listen(PORT, async () => {
  console.log(`GachPala API Running on ${PORT}`);
});

export default app;
