// db.js
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

console.log("📦 Initializing PostgreSQL pool...");
console.log("🔍 DB_URL:", process.env.DB_URL);

const pool = new Pool({
  connectionString: process.env.DB_URL,
});

pool.on("connect", () => {
  console.log("✅ PostgreSQL connected successfully");
});

export default pool;
