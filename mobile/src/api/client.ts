import axios from "axios";
import { secureStorage } from "./storage";

export const ACCESS_TOKEN_KEY = "code_access_token";
export const REFRESH_TOKEN_KEY = "code_refresh_token";

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

export const apiClient = axios.create({ baseURL: API_BASE_URL });

apiClient.interceptors.request.use(async (config) => {
  const token = await secureStorage.getItemAsync(ACCESS_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await secureStorage.getItemAsync(REFRESH_TOKEN_KEY);
  if (!refreshToken) return null;

  try {
    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
    await secureStorage.setItemAsync(ACCESS_TOKEN_KEY, response.data.accessToken);
    await secureStorage.setItemAsync(REFRESH_TOKEN_KEY, response.data.refreshToken);
    return response.data.accessToken;
  } catch {
    await secureStorage.deleteItemAsync(ACCESS_TOKEN_KEY);
    await secureStorage.deleteItemAsync(REFRESH_TOKEN_KEY);
    return null;
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      refreshing = refreshing ?? refreshAccessToken();
      const newToken = await refreshing;
      refreshing = null;
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(original);
      }
    }
    return Promise.reject(error);
  },
);
