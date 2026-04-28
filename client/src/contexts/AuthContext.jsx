/**
 * React authentication context for storing POS user session state.
 */
import { createContext, useContext, useEffect, useState } from "react";
import { api, clearAuthToken, getAuthToken, setAuthToken } from "../api";

const AuthContext = createContext(null);

/**
 * Provides the current authentication state and actions to the React app.
 * @param {{children: import("react").ReactNode}} props - Provider props.
 * @returns {import("react").ReactElement} The authentication context provider.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * Restores an existing token-backed session when the app first loads.
   * @returns {void}
   */
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setLoading(false);
      return;
    }

    api.getCurrentUser()
      .then(({ user: currentUser }) => setUser(currentUser))
      .catch(() => {
        clearAuthToken();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    /**
     * Checks whether the signed-in user has one of the requested roles.
     * @param {string[]} roles - Roles accepted by the caller.
     * @returns {boolean} True when the user is signed in with an allowed role.
     */
    hasRole: (roles) => Boolean(user) && roles.includes(user.role),
    /**
     * Signs in with a Google credential and stores the returned app token.
     * @param {string} credential - The Google Identity Services credential.
     * @returns {Promise<object>} The authenticated user record.
     */
    loginWithGoogle: async (credential) => {
      const result = await api.googleLogin(credential);
      setAuthToken(result.token);
      setUser(result.user);
      return result.user;
    },
    /**
     * Clears the stored token and removes the active user from context.
     * @returns {void}
     */
    logout: () => {
      clearAuthToken();
      setUser(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Reads the authentication context for the current component.
 * @returns {{user: object|null, loading: boolean, isAuthenticated: boolean, hasRole: Function, loginWithGoogle: Function, logout: Function}} Authentication state and actions.
 * @throws {Error} When used outside AuthProvider.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
