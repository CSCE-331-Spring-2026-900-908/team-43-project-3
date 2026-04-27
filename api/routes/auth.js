import { Router } from "express";
import {
  createAppToken,
  getAuthConfig,
  requireAuth,
  resolveUserRole,
  verifyGoogleIdToken,
} from "../auth.js";

const router = Router();

router.get("/config", (_req, res) => {
  res.json(getAuthConfig());
});

router.get("/me", requireAuth(["cashier", "manager"]), (req, res) => {
  res.json({ user: req.user });
});

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