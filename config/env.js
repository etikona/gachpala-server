import { config } from "dotenv";

// Always load base .env first
config({ path: `.env.${process.env.NODE_ENV || "development"}.local` });

// Then load environment-specific file
// if (process.env.NODE_ENV) {
//   config({ path: `.env.${process.env.NODE_ENV || "development"}.local` });
// }

export const {
  PORT,
  NODE_ENV,
  DB_URL,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  GEMINI_API_KEY,
  PLANT_ID_API_KEY,
} = process.env;
