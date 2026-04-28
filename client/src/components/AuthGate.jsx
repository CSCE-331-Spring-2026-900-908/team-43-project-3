/**
 * Authentication gate components for protected cashier and manager routes.
 */
import { useEffect, useRef, useState } from "react";
import { api } from "../api";
import { useAuth } from "../contexts/AuthContext";

/**
 * Loads the Google Identity Services client script once for the login card.
 * @returns {Promise<void>} Resolves when the Google client is ready.
 */
function loadGoogleScript() {
  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-google-identity="true"]');
    if (existing) {
      existing.addEventListener("load", resolve, { once: true });
      existing.addEventListener("error", () => reject(new Error("Failed to load Google Identity Services")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.dataset.googleIdentity = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Identity Services"));
    document.head.appendChild(script);
  });
}

/**
 * Converts an internal role value into display text.
 * @param {string} role - The internal role identifier.
 * @returns {string} A lowercase role label.
 */
function roleLabel(role) {
  return role === "manager" ? "manager" : "cashier";
}

/**
 * Shows the Google sign-in prompt for users who are not authenticated.
 * @param {{allowedRoles: string[], title: string}} props - Login card props.
 * @returns {import("react").ReactElement} The login card UI.
 */
function LoginCard({ allowedRoles, title }) {
  const { loginWithGoogle } = useAuth();
  const buttonRef = useRef(null);
  const [config, setConfig] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  /**
   * Loads public OAuth configuration from the API.
   * @returns {void}
   */
  useEffect(() => {
    let cancelled = false;

    api.getAuthConfig()
      .then((result) => {
        if (!cancelled) setConfig(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Renders Google's hosted login button after configuration is available.
   * @returns {void}
   */
  useEffect(() => {
    if (!config?.googleClientId || !buttonRef.current) return;

    let cancelled = false;

    loadGoogleScript()
      .then(() => {
        if (cancelled || !buttonRef.current) return;

        buttonRef.current.innerHTML = "";
        window.google.accounts.id.initialize({
          client_id: config.googleClientId,
          callback: async (response) => {
            setBusy(true);
            setError("");
            try {
              await loginWithGoogle(response.credential);
            } catch (err) {
              setError(err.message);
            } finally {
              setBusy(false);
            }
          },
        });

        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: "outline",
          size: "large",
          shape: "pill",
          text: "signin_with",
          width: 320,
        });
      })
      .catch((err) => setError(err.message));

    return () => {
      cancelled = true;
    };
  }, [config, loginWithGoogle]);

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <p style={styles.eyebrow}>{title}</p>
        <h1 style={styles.heading}>Sign in with Google</h1>
        <p style={styles.subtext}>
          This area is restricted to {allowedRoles.map(roleLabel).join(" or ")} accounts.
        </p>
        {config?.allowedDomain && (
          <p style={styles.domainHint}>Allowed domain: @{config.allowedDomain}</p>
        )}
        {!config?.googleClientId && !error && (
          <p style={styles.error}>Set `GOOGLE_CLIENT_ID` or `GOOGLE_CLIENT_IDS` on the server before using OAuth.</p>
        )}
        <div ref={buttonRef} style={styles.buttonSlot} />
        {busy && <p style={styles.helper}>Verifying your Google account…</p>}
        {error && <p style={styles.error}>{error}</p>}
      </div>
    </div>
  );
}

/**
 * Explains that the signed-in user lacks one of the required roles.
 * @param {{user: object, allowedRoles: string[], onLogout: Function}} props - Access denied props.
 * @returns {import("react").ReactElement} The access denied UI.
 */
function AccessDenied({ user, allowedRoles, onLogout }) {
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <p style={styles.eyebrow}>Access restricted</p>
        <h1 style={styles.heading}>This account can’t open this page</h1>
        <p style={styles.subtext}>
          Signed in as {user.name || user.email} with {roleLabel(user.role)} access. This page requires {allowedRoles.map(roleLabel).join(" or ")} access.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
          <button className="btn-primary" onClick={onLogout}>Switch account</button>
        </div>
      </div>
    </div>
  );
}

/**
 * Guards a route by requiring authentication and one of the supplied roles.
 * @param {{allowedRoles: string[], title: string, children: import("react").ReactNode}} props - Gate props.
 * @returns {import("react").ReactNode} The guarded content or an auth state screen.
 */
export default function AuthGate({ allowedRoles, title, children }) {
  const { user, loading, isAuthenticated, hasRole, logout } = useAuth();

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.heading}>Checking your access…</h1>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginCard allowedRoles={allowedRoles} title={title} />;
  }

  if (!hasRole(allowedRoles)) {
    return <AccessDenied user={user} allowedRoles={allowedRoles} onLogout={logout} />;
  }

  return children;
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "2rem",
    background: "radial-gradient(circle at top, #f7efe2 0%, #efe5d2 45%, #e4d5bd 100%)",
  },
  card: {
    width: "100%",
    maxWidth: 520,
    background: "rgba(255,255,255,0.92)",
    borderRadius: 28,
    padding: "2.5rem",
    boxShadow: "0 24px 70px rgba(86, 56, 23, 0.18)",
    border: "1px solid rgba(120, 85, 40, 0.12)",
    textAlign: "center",
  },
  eyebrow: {
    margin: 0,
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    fontSize: "0.8rem",
    color: "#9a6a37",
    fontWeight: 700,
  },
  heading: {
    margin: "0.75rem 0 0.5rem",
    fontSize: "2rem",
    color: "#3f2a12",
  },
  subtext: {
    margin: 0,
    color: "#6f5840",
    lineHeight: 1.5,
  },
  domainHint: {
    margin: "0.9rem 0 0",
    color: "#8f6f46",
    fontWeight: 600,
  },
  buttonSlot: {
    minHeight: 48,
    display: "flex",
    justifyContent: "center",
    marginTop: "1.5rem",
  },
  helper: {
    marginTop: "0.8rem",
    color: "#6f5840",
  },
  error: {
    marginTop: "1rem",
    color: "#b42318",
    fontWeight: 600,
  },
};
