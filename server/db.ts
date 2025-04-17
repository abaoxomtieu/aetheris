import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { log } from "./vite";
import "dotenv/config";
// Initialize Postgres client with the database connection string
const connectionString = process.env.DATABASE_URL!;
log(`Connecting to database: ${connectionString.split("@")[1]}`, "postgres");

// For use with Drizzle ORM
const client = postgres(connectionString);
export const db = drizzle(client);

// Health check function to verify DB connection
export async function checkDatabaseConnection() {
  try {
    const result = await client`SELECT 1`;
    if (result && result.length > 0) {
      return true;
    }
    return false;
  } catch (error) {
    console.error("Database connection error:", error);
    return false;
  }
}