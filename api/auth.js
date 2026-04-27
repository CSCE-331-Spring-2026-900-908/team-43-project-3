import crypto from "crypto";

function base64UrlEncode(value) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = (4 - (normalized.length % 4)) % 4;
  return Buffer.from(`${normalized}${"=".repeat(padding)}`, "base64").toString("utf8");
}

function getAppSecret() {
  return process.env.APP_AUTH_SECRET || process.env.GOOGLE_CLIENT_IDS || "dev-auth-secret";
}

function getAllowedClientIds() {
  return (process.env.GOOGLE_CLIENT_IDS || process.env.GOOGLE_CLIENT_ID || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function getAllowedEmails(varName) {
  return new Set(
    (process.env[varName] || "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function resolveUserRole(email) {
  const normalizedEmail = email.trim().toLowerCase();
  const managerEmails = getAllowedEmails("GOOGLE_MANAGER_EMAILS");
  const cashierEmails = getAllowedEmails("GOOGLE_CASHIER_EMAILS");
  const allowedDomain = (process.env.GOOGLE_ALLOWED_DOMAIN || "").trim().toLowerCase();

  if (managerEmails.has(normalizedEmail)) return "manager";
  if (cashierEmails.has(normalizedEmail)) return "cashier";
  if (allowedDomain && normalizedEmail.endsWith(`@${allowedDomain}`)) return "cashier";
  return null;
}

export async function verifyGoogleIdToken(idToken) {
  const clientIds = getAllowedClientIds();
  if (clientIds.length === 0) {
    throw new Error("Google OAuth is not configured on the server");
  }

  const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error_description || payload.error || "Google token verification failed");
  }

  if (!clientIds.includes(payload.aud)) {
    throw new Error("Google token audience mismatch");
  }

  if (payload.email_verified !== "true") {
    throw new Error("Google account email is not verified");
  }

  return {
    googleId: payload.sub,
    email: payload.email,
    name: payload.name || payload.email,
    picture: payload.picture || "",
  };
}

export function createAppToken(user) {
  const header = { alg: "HS256", typ: "JWT" };
  const payload = {
    ...user,
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 8),
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = crypto
    .createHmac("sha256", getAppSecret())
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export function verifyAppToken(token) {
  if (!token) {
    throw new Error("Missing token");
  }

  const [encodedHeader, encodedPayload, signature] = token.split(".");
  if (!encodedHeader || !encodedPayload || !signature) {
    throw new Error("Malformed token");
  }

  const expectedSignature = crypto
    .createHmac("sha256", getAppSecret())
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    throw new Error("Invalid token signature");
  }

  const payload = JSON.parse(base64UrlDecode(encodedPayload));
  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error("Token expired");
  }

  return payload;
}

function extractBearerToken(req) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length);
}

export function requireAuth(allowedRoles = []) {
  return (req, res, next) => {
    try {
      const token = extractBearerToken(req);
      const user = verifyAppToken(token);

      if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        return res.status(403).json({ error: "Forbidden" });
      }

      req.user = user;
      next();
    } catch (error) {
      res.status(401).json({ error: error.message || "Unauthorized" });
    }
  };
}

export function getAuthConfig() {
  return {
    googleClientId: getAllowedClientIds()[0] || "",
    allowedDomain: (process.env.GOOGLE_ALLOWED_DOMAIN || "").trim(),
  };
}
