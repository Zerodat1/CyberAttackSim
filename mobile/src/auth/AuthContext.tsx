import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { secureStorage } from "@/api/storage";
import { apiClient, onSessionExpired, ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from "@/api/client";
import { AuthUser } from "@/api/types";
import { registerForPushNotificationsAsync, unregisterPushNotificationsAsync } from "@/utils/pushNotifications";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (payload: {
    email: string;
    password: string;
    fullName: string;
    username: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function storeSession(accessToken: string, refreshToken: string) {
  await secureStorage.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
  await secureStorage.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshUser() {
    const token = await secureStorage.getItemAsync(ACCESS_TOKEN_KEY);
    if (!token) {
      setUser(null);
      return;
    }
    try {
      const { data } = await apiClient.get<AuthUser>("/users/me");
      setUser(data);
    } catch {
      setUser(null);
    }
  }

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, []);

  useEffect(() => onSessionExpired(() => setUser(null)), []);

  useEffect(() => {
    if (user) {
      registerForPushNotificationsAsync().catch(() => {});
    }
  }, [user?.id]);

  async function login(identifier: string, password: string) {
    const { data } = await apiClient.post("/auth/login", { identifier, password });
    await storeSession(data.accessToken, data.refreshToken);
    setUser(data.user);
  }

  async function register(payload: {
    email: string;
    password: string;
    fullName: string;
    username: string;
  }) {
    const { data } = await apiClient.post("/auth/register", payload);
    await storeSession(data.accessToken, data.refreshToken);
    setUser(data.user);
  }

  async function logout() {
    try {
      await unregisterPushNotificationsAsync();
      await apiClient.post("/auth/logout");
    } finally {
      await secureStorage.deleteItemAsync(ACCESS_TOKEN_KEY);
      await secureStorage.deleteItemAsync(REFRESH_TOKEN_KEY);
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
