/**
 * Production server entrypoint.
 *
 * Serves the built client bundle and falls back to `index.html` for
 * client-side routing before starting the HTTP listener.
 */
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import app from "./app.js";

const PORT = process.env.PORT || 3001;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(__dirname, "../client/dist");
app.use(express.static(clientDist));
app.get("/{*splat}", (_req, res) => {
  res.sendFile(path.join(clientDist, "index.html"));
});

app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
});
