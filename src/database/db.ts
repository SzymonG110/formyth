import "dotenv/config";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

const DATABASE_URL = process.env["DATABASE_URL"] as string;

const pool = new Pool({
  connectionString: DATABASE_URL,
});

export const db = drizzle(pool);
