import { useEffect, useRef, useState } from "react";
import { api } from "../api";
import { useAuth } from "../contexts/AuthContext";

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

function roleLabel(role) {
  return role === "manager" ? "manager" : "cashier";
}

function LoginCard({ allowedRoles, title }) {
  const { loginWithGoogle } = useAuth();
  const buttonRef = useRef(null);
  const [config, setConfig] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

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