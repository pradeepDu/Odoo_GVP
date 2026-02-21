import { createContext, useCallback, useContext, useMemo, useState, useEffect } from "react";
import { authApi } from "@/lib/api";

type User = { id: number; email: string; name: string | null; role: string };

const AuthContext = createContext<{
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string, role?: string) => Promise<void>;
  logout: () => void;
  setAuth: (user: User, token: string) => void;
} | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem("fleetflow_user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("fleetflow_token"));

  useEffect(() => {
    // Simulate checking authentication status
    const checkAuth = () => {
      try {
        const storedToken = localStorage.getItem("fleetflow_token");
        const storedUser = localStorage.getItem("fleetflow_user");
        
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        localStorage.removeItem("fleetflow_token");
        localStorage.removeItem("fleetflow_user");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const setAuth = useCallback((u: User, t: string) => {
    setUser(u);
    setToken(t);
    localStorage.setItem("fleetflow_token", t);
    localStorage.setItem("fleetflow_user", JSON.stringify(u));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    setAuth(res.user, res.token);
  }, [setAuth]);

  const register = useCallback(async (email: string, password: string, name?: string, role?: string) => {
    const res = await authApi.register(email, password, name, role);
    setAuth(res.user, res.token);
  }, [setAuth]);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("fleetflow_token");
    localStorage.removeItem("fleetflow_user");
  }, []);

  const value = useMemo(
    () => ({ user, token, isLoading, login, register, logout, setAuth }),
    [user, token, isLoading, login, register, logout, setAuth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
