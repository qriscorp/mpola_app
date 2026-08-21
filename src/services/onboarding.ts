import * as SecureStore from "expo-secure-store";

const ONBOARDING_SEEN_KEY = "lf_onboarding_seen";

export async function hasSeenOnboarding(): Promise<boolean> {
  const value = await SecureStore.getItemAsync(ONBOARDING_SEEN_KEY);
  return value === "true";
}

export async function markOnboardingSeen(): Promise<void> {
  await SecureStore.setItemAsync(ONBOARDING_SEEN_KEY, "true");
}
