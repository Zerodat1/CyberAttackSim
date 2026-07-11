import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { apiClient } from "@/api/client";
import { secureStorage } from "@/api/storage";

const DEVICE_PUSH_TOKEN_KEY = "code_device_push_token";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function toDevicePlatform(): "ios" | "android" | "web" {
  if (Platform.OS === "ios") return "ios";
  if (Platform.OS === "android") return "android";
  return "web";
}

/**
 * Requests push-notification permission and registers the resulting Expo
 * push token with the backend. No-ops silently on simulators, web, or when
 * permission is denied — push is a progressive enhancement, never required
 * for the app to function.
 */
export async function registerForPushNotificationsAsync(): Promise<void> {
  if (!Device.isDevice) return;

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== "granted") {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }
  if (status !== "granted") return;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const { data: token } = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    await apiClient.post("/notifications/device-token", { token, platform: toDevicePlatform() });
    await secureStorage.setItemAsync(DEVICE_PUSH_TOKEN_KEY, token);
  } catch {
    // No EAS project configured, or the push service is unreachable — skip silently.
  }
}

/** Unregisters this device's push token from the backend, e.g. on logout. */
export async function unregisterPushNotificationsAsync(): Promise<void> {
  const token = await secureStorage.getItemAsync(DEVICE_PUSH_TOKEN_KEY);
  if (!token) return;
  try {
    await apiClient.delete(`/notifications/device-token/${encodeURIComponent(token)}`);
  } catch {
    // Best-effort cleanup only.
  } finally {
    await secureStorage.deleteItemAsync(DEVICE_PUSH_TOKEN_KEY);
  }
}
