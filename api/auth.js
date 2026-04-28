/**
 * Authentication helpers for Google OAuth verification, app token signing, and route authorization.
 */
import crypto from "crypto";

/**
 * Encodes a string as base64url text for JWT segments.
 * @param {string} value - The plain text value to encode.
 * @returns {string} The base64url-encoded value.
 */
function base64UrlEncode(value) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

/**
 * Decodes a base64url string back into UTF-8 text.
 * @param {string} value - The base64url value to decode.
 * @returns {string} The decoded UTF-8 text.
 */
function base64UrlDecode(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = (4 - (normalized.length % 4)) % 4;
  return Buffer.from(`${normalized}${"=".repeat(padding)}`, "base64").toString("utf8");
}

/**
 * Resolves the shared server secret used to sign app JWTs.
 * @returns {string} The configured app secret or local development fallback.
 */
function getAppSecret() {
  return process.env.APP_AUTH_SECRET || process.env.GOOGLE_CLIENT_IDS || "dev-auth-secret";
}

/**
 * Reads the list of accepted Google OAuth client IDs from the environment.
 * @returns {string[]} The configured Google client IDs.
 */
function getAllowedClientIds() {
  return (process.env.GOOGLE_CLIENT_IDS || process.env.GOOGLE_CLIENT_ID || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

/**
 * Reads a comma-separated environment variable into a normalized email set.
 * @param {string} varName - The environment variable name to read.
 * @returns {Set<string>} Lowercase email addresses allowed by that variable.
 */
function getAllowedEmails(varName) {
  return new Set(
    (process.env[varName] || "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean)
  );
}

/**
 * Determines which POS role a verified Google email should receive.
 * @param {string} email - The user's verified Google email address.
 * @returns {"manager"|"cashier"|null} The resolved role, or null when unauthorized.
 */
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

/**
 * Verifies a Google ID token against Google's tokeninfo endpoint.
 * @param {string} idToken - The credential returned by Google Identity Services.
 * @returns {Promise<{googleId: string, email: string, name: string, picture: string}>} The verified Google user profile.
 * @throws {Error} When OAuth is not configured or the token is invalid.
 */
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

/**
 * Creates a signed short-lived application token for an authenticated POS user.
 * @param {{googleId: string, email: string, name: string, picture: string, role: string}} user - The authenticated user payload.
 * @returns {string} A signed JWT-like application token.
 */
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

/**
 * Validates an application token and returns its decoded payload.
 * @param {string} token - The signed application token to validate.
 * @returns {object} The decoded token payload.
 * @throws {Error} When the token is missing, malformed, expired, or has a bad signature.
 */
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

/**
 * Pulls a bearer token from an Express request's Authorization header.
 * @param {import("express").Request} req - The incoming Express request.
 * @returns {string|null} The token without the Bearer prefix, or null when missing.
 */
function extractBearerToken(req) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length);
}

/**
 * Builds Express middleware that requires a valid app token and optional role match.
 * @param {string[]} [allowedRoles=[]] - Role names allowed to access the route.
 * @returns {import("express").RequestHandler} Middleware that attaches the decoded user to the request.
 */
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

/**
 * Returns public authentication settings needed by the client.
 * @returns {{googleClientId: string, allowedDomain: string}} Client-safe Google OAuth configuration.
 */
export function getAuthConfig() {
  return {
    googleClientId: getAllowedClientIds()[0] || "",
    allowedDomain: (process.env.GOOGLE_ALLOWED_DOMAIN || "").trim(),
  };
}
