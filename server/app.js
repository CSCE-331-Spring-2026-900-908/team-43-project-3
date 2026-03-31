/**
 * Main Express application configuration.
 *
 * This file loads environment variables, enables JSON and CORS handling,
 * and mounts the feature routers under their API prefixes.
 *
 * @type {import("express").Express}
 */
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

import menuRoutes from "./routes/menu.js";
import orderRoutes from "./routes/orders.js";
import inventoryRoutes from "./routes/inventory.js";
import employeeRoutes from "./routes/employees.js";
import reportRoutes from "./routes/reports.js";
import externalRoutes from "./routes/external.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/external", externalRoutes);

export default app;
