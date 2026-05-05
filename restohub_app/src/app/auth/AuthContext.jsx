import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { client } from "../apollo/client";
import { QUERY_ME } from "../../features/auth/queries";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = localStorage.getItem("rh_token");
    const u = localStorage.getItem("rh_user");
    if (t && u) {
      try {
        setToken(t);
        setUser(JSON.parse(u));
      } catch {
        localStorage.clear();
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback((accessToken, refreshToken, userData) => {
    setToken(accessToken);
    setUser(userData);
    localStorage.setItem("rh_token", accessToken);
    localStorage.setItem("rh_refresh", refreshToken || "");
    localStorage.setItem("rh_user", JSON.stringify(userData));
    client.resetStore().catch(() => {});
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("rh_token");
    localStorage.removeItem("rh_refresh");
    localStorage.removeItem("rh_user");
    // Limpiar la ubicación guardada → el picker aparecerá de nuevo
    sessionStorage.removeItem("rh_location");
    client.clearStore().catch(() => {});
    // Recargar para reiniciar LocationProvider y mostrar picker
    window.location.href = "/";
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await client.query({
        query: QUERY_ME,
        fetchPolicy: "network-only",
      });
      if (data?.me) {
        setUser(data.me);
        localStorage.setItem("rh_user", JSON.stringify(data.me));
      }
    } catch {}
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
