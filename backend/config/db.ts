import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config({ path: "./.env", quiet: true });

const DB_URI = process.env.DB_URI;

if (!DB_URI) {
  throw new Error("DB_URI is not defined in environment variables");
}

const pool = new Pool({
  connectionString: DB_URI,
  ssl: {
    rejectUnauthorized: false,
  },
});

const connectDb = async (): Promise<void> => {
  try {
    await pool.query("SELECT 1");
    console.log("Connected to PostgreSQL successfully");
  } catch (error) {
    console.error("Error connecting to PostgreSQL:", error);
    throw error;
  }
};

export default connectDb;
