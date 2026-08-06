/**
 * Expo push notification registration. Expo's push service means Mpola
 * never needs its own Firebase/APNs credentials for this to work in
 * development — production standalone builds still need EAS push
 * credentials configured on the Expo side, but this code path is correct
 * either way.
 */
import { useEffect } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { apiAuthPut } from "./auth";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) return null; // push tokens aren't available on simulators

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") return null;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: "#2BB5A0",
    });
  }

  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync();
    return token;
  } catch {
    return null;
  }
}

export async function syncPushToken(): Promise<void> {
  const token = await registerForPushNotifications();
  if (!token) return;
  try {
    await apiAuthPut("/users/me/push-token", { push_token: token });
  } catch {
    // best-effort — a failed push-token sync shouldn't disrupt the app
  }
}

export async function clearPushToken(): Promise<void> {
  try {
    await apiAuthPut("/users/me/push-token", { push_token: null });
  } catch {
    // best-effort
  }
}

/** Registers this device's push token once, on mount. */
export function usePushRegistration() {
  useEffect(() => {
    syncPushToken();
  }, []);
}
