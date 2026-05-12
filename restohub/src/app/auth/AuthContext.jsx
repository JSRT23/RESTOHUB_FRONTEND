// src/app/auth/AuthContext.jsx
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";

const AuthContext = createContext(null);

const TOKEN_KEY = "restohub_access_token";
const REFRESH_KEY = "restohub_refresh_token";
const USER_KEY = "restohub_user";

function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY));
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const navigateRef = useRef(null);

  const setNavigate = useCallback((fn) => {
    navigateRef.current = fn;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
    if (navigateRef.current) {
      navigateRef.current("/login");
    } else {
      window.location.href = "/login";
    }
  }, []);

  // Verificar token al montar
  useEffect(() => {
    if (token) {
      const payload = parseJwt(token);
      if (!payload || payload.exp * 1000 < Date.now()) {
        logout();
      }
    }
  }, [logout]); // ← logout agregado a deps

  // Verificar token periódicamente (cada 60s)
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => {
      const payload = parseJwt(token);
      if (!payload || payload.exp * 1000 < Date.now()) {
        logout();
      }
    }, 60_000);
    return () => clearInterval(interval);
  }, [token, logout]);

  const login = useCallback(({ access_token, refresh_token, usuario }) => {
    localStorage.setItem(TOKEN_KEY, access_token);
    localStorage.setItem(REFRESH_KEY, refresh_token);
    localStorage.setItem(USER_KEY, JSON.stringify(usuario));
    setToken(access_token);
    setUser(usuario);
  }, []);

  const isAuthenticated = !!token && !!user;

  const hasRole = useCallback((...roles) => roles.includes(user?.rol), [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated,
        hasRole,
        setNavigate,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
