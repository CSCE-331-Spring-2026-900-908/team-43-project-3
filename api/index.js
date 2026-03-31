/**
 * Re-export the Express app for serverless or alternate entrypoints.
 *
 * This keeps the application wiring centralized in `server/app.js` while
 * allowing other runtimes to import the configured app directly.
 *
 * @type {import("express").Express}
 */
import app from "../server/app.js";

export default app;
