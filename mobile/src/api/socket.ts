import { io, Socket } from "socket.io-client";
import * as SecureStore from "expo-secure-store";
import { API_BASE_URL, ACCESS_TOKEN_KEY } from "./client";

const SOCKET_BASE_URL = API_BASE_URL.replace(/\/api\/v1\/?$/, "");

export async function createSocket(namespace: "rooms" | "messaging"): Promise<Socket> {
  const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  return io(`${SOCKET_BASE_URL}/${namespace}`, { auth: { token } });
}
