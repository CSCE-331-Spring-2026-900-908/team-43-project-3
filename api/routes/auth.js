/**
 * Authentication API routes for Google login, auth config, and current-user lookup.
 */
import { Router } from "express";
import {
  createAppToken,
  getAuthConfig,
  requireAuth,
  resolveUserRole,
  verifyGoogleIdToken,
} from "../auth.js";

/**
 * Express router that exposes Google OAuth login and session-check endpoints.
 * @type {import("express").Router}
 */
const router = Router();

/**
 * Sends public authentication configuration to the frontend.
 * @param {import("express").Request} _req - The unused Express request.
 * @param {import("express").Response} res - The Express response.
 * @returns {void}
 */
router.get("/config", (_req, res) => {
  res.json(getAuthConfig());
});

/**
 * Returns the current authenticated app user from the verified token.
 * @param {import("express").Request} req - The authenticated Express request.
 * @param {import("express").Response} res - The Express response.
 * @returns {void}
 */
router.get("/me", requireAuth(["cashier", "manager"]), (req, res) => {
  res.json({ user: req.user });
});

/**
 * Exchanges a Google credential for an app token when the account is authorized.
 * @param {import("express").Request} req - The Express request containing a Google credential.
 * @param {import("express").Response} res - The Express response.
 * @returns {Promise<void>}
 */
router.post("/google", async (req, res) => {
  const { credential } = req.body || {};

  if (!credential) {
    return res.status(400).json({ error: "Missing Google credential" });
  }

  try {
    const googleUser = await verifyGoogleIdToken(credential);
    const role = resolveUserRole(googleUser.email);

    if (!role) {
      return res.status(403).json({ error: "This Google account is not authorized for POS access" });
    }

    const user = {
      googleId: googleUser.googleId,
      email: googleUser.email,
      name: googleUser.name,
      picture: googleUser.picture,
      role,
    };

    res.json({
      token: createAppToken(user),
      user,
    });
  } catch (error) {
    res.status(401).json({ error: error.message || "Google authentication failed" });
  }
});

export default router;
