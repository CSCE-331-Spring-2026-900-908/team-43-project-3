/**
 * Shared PostgreSQL connection pool.
 *
 * The pool is configured from environment variables and reused across all
 * route handlers so database access stays consistent and efficient.
 *
 * @type {import("pg").Pool}
 */
import pg from "pg";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(__dirname, ".env") });

const pool = new pg.Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
  max: 10,
});

pool.on("connect", () => console.log("[db] new client connected"));
pool.on("error", (err) => console.error("[db] pool error", err.message));

export default pool;
