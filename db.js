// db.js
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DB_URL,
  ssl: {
    rejectUnauthorized: false, // Required for Render PostgreSQL
  },
});

pool.on("connect", () => {
  console.log("✅ PostgreSQL connected successfully");
});

export default pool;
