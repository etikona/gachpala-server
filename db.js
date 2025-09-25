import { Pool } from "pg";
import { DB_URL, NODE_ENV } from "./config/env.js";

console.log("🔍 Database connection setup:");
console.log("   Environment:", NODE_ENV);
console.log("   DB_URL exists:", !!DB_URL);

// Create connection configuration
let connectionConfig;

if (NODE_ENV === "production") {
  // Production: Use Supabase with SSL
  connectionConfig = {
    connectionString: DB_URL,
    ssl: {
      rejectUnauthorized: false, // Required for Supabase
    },
  };
  console.log("🌐 Using production database (Supabase) with SSL");
} else {
  // Development: Use local PostgreSQL without SSL
  connectionConfig = {
    connectionString: DB_URL,
    ssl: false, // Local PostgreSQL doesn't need SSL
  };
  console.log("💻 Using development database (Local PostgreSQL)");
}

// Create the connection pool
const pool = new Pool(connectionConfig);

// Connection event handlers
pool.on("connect", () => {
  console.log("✅ PostgreSQL connected successfully");
});

pool.on("error", (err) => {
  console.error("❌ PostgreSQL pool error:", err.message);
  console.error("🔧 Check your database connection settings");
});

// Test the connection immediately
pool.query("SELECT NOW() as current_time", (err, res) => {
  if (err) {
    console.error("❌ Database connection test failed:", err.message);
  } else {
    console.log("✅ Database connection test successful");
    console.log("⏰ Database time:", res.rows[0].current_time);
  }
});

export default pool;
