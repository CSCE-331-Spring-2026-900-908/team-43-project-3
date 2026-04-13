/**
 * Re-export the Express app for serverless or alternate entrypoints.
 *
 * This keeps the application wiring centralized in `server/app.js` while
 * allowing other runtimes to import the configured app directly.
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
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/external", externalRoutes);

const clientDist = path.resolve(__dirname, "../client/dist");
app.use(express.static(clientDist));
app.get("/{*splat}", (_req, res) => {
  res.sendFile(path.join(clientDist, "index.html"));
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`[server] listening on http://localhost:${PORT}`);
  });
}

export default app;
