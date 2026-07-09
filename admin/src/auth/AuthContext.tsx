import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { apiClient, TOKEN_STORAGE_KEY } from "@/api/client";
import { AuthUser } from "@/api/types";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) {
      setLoading(false);
      return;
    }
    apiClient
      .get<AuthUser>("/users/me")
      .then((res) =>
        setUser({
          id: res.data.id,
          username: res.data.username,
          fullName: res.data.fullName,
          email: res.data.email,
          phone: res.data.phone,
          globalRole: res.data.globalRole,
        }),
      )
      .catch(() => localStorage.removeItem(TOKEN_STORAGE_KEY))
      .finally(() => setLoading(false));
  }, []);

  async function login(identifier: string, password: string) {
    const response = await apiClient.post("/auth/login", { identifier, password });
    localStorage.setItem(TOKEN_STORAGE_KEY, response.data.accessToken);
    setUser(response.data.user);
  }

  function logout() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setUser(null);
    window.location.href = "/login";
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
