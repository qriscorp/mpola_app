import * as SecureStore from "expo-secure-store";

const ONBOARDING_SEEN_KEY = "lf_onboarding_seen";

type OnboardingListener = (seen: boolean) => void;
const listeners = new Set<OnboardingListener>();

/** Mirrors auth.ts's subscribeToAuthState/notifyAuthState pattern — without
 * this, a component that read "seen" once at launch (see _layout.tsx's
 * useOnboardingState) never learns that markOnboardingSeen() below just
 * flipped it, and immediately redirects back to /onboarding the moment
 * navigation lands on "/". */
export function subscribeToOnboardingState(listener: OnboardingListener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function hasSeenOnboarding(): Promise<boolean> {
  const value = await SecureStore.getItemAsync(ONBOARDING_SEEN_KEY);
  return value === "true";
}

export async function markOnboardingSeen(): Promise<void> {
  await SecureStore.setItemAsync(ONBOARDING_SEEN_KEY, "true");
  listeners.forEach((listener) => listener(true));
}
