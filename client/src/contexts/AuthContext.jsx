import { createContext, useContext, useEffect, useState } from "react";
import { api, clearAuthToken, getAuthToken, setAuthToken } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
    hasRole: (roles) => Boolean(user) && roles.includes(user.role),
    loginWithGoogle: async (credential) => {
      const result = await api.googleLogin(credential);
      setAuthToken(result.token);
      setUser(result.user);
      return result.user;
    },
    logout: () => {
      clearAuthToken();
      setUser(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
