/**
 * Biometric quick-unlock. This is NOT a separate credential — Mpola doesn't
 * store the user's password, so biometrics unlock the *existing* session
 * (refresh token) rather than replacing password login entirely. If the
 * user has signed out (tokens cleared), biometrics has nothing to unlock
 * and the normal password/OTP flow is required.
 */
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import { apiRefreshToken, getStoredUser, type AuthUser } from "./auth";

const BIOMETRIC_ENABLED_KEY = "lf_biometric_enabled";

export async function isBiometricSupported(): Promise<boolean> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  return hasHardware && isEnrolled;
}

export async function isBiometricLoginEnabled(): Promise<boolean> {
  return (await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY)) === "true";
}

export async function setBiometricLoginEnabled(enabled: boolean): Promise<void> {
  if (enabled) {
    await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, "true");
  } else {
    await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
  }
}

/** Prompts Face ID/fingerprint, then refreshes the stored session on success.
 * Returns the signed-in user (for routing) or null if unavailable/cancelled/failed.
 */
export async function tryBiometricSignIn(): Promise<AuthUser | null> {
  const [supported, enabled] = await Promise.all([
    isBiometricSupported(),
    isBiometricLoginEnabled(),
  ]);
  if (!supported || !enabled) return null;

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: "Sign in to Mpola",
    fallbackLabel: "Use password instead",
  });
  if (!result.success) return null;

  const newAccessToken = await apiRefreshToken();
  if (!newAccessToken) return null;

  return getStoredUser();
}
