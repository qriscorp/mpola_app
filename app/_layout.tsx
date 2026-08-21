import { useEffect, useState } from "react";
import { AppState, View } from "react-native";
import {
  Stack,
  useRouter,
  useSegments,
  useRootNavigationState,
} from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import * as SplashScreen from "expo-splash-screen";
import { Ionicons } from "@expo/vector-icons";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FontScaleProvider, Colors } from "../src/theme";
import {
  authenticatedHomeFor,
  getStoredUser,
  subscribeToAuthState,
  type AuthUser,
} from "../src/services/auth";
import { hasSeenOnboarding, subscribeToOnboardingState } from "../src/services/onboarding";

// Hold the native splash until the async cold-start bootstrap below is done.
// Without this the splash auto-hides the moment the root view mounts — long
// before the SecureStore reads (saved font scale + saved session) resolve —
// and every intermediate state (blank → flat background → real screen) would
// flash in sequence on cold start. expo-router's own auto-hide respects this
// call, so only the explicit hideAsync() in RootLayout dismisses it.
SplashScreen.preventAutoHideAsync();

// Pre-load the icon font at module scope so glyphs (fingerprint, eye, tab
// icons, ...) render on the very first frame instead of popping in after the
// text. The splash stays up until it's loaded — see RootLayout below.
Ionicons.loadFont().catch(() => {});

// Fired at module load — as early as this JS bundle can possibly run —
// rather than inside a component effect, to close the gap where Android's
// edge-to-edge system-bar insets haven't settled yet and the root window's
// default white background would otherwise flash/show through in that
// area (see the bottom-nav-bar overlap issue). `android.backgroundColor`
// in app.json covers this permanently once the app is a real native
// build; this covers the same thing while running in Expo Go — but only
// for the cold-start moment, since resuming from the background doesn't
// re-run this module-level code (the JS engine stays alive). The AppState
// listener in RootLayout below re-applies it on every foreground resume
// too, since Android can re-negotiate edge-to-edge insets at that point.
SystemUI.setBackgroundColorAsync(Colors.background);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

/** Tracks the signed-in user for the whole app.
 *
 * On cold start it hydrates from SecureStore (so a returning user is sent
 * straight to their home instead of the welcome screen), then stays in sync
 * with every storeUser/clearAuth call via subscribeToAuthState — which is
 * exactly what lets the AuthGate redirect instantly when a login or sign-out
 * flips the auth state while the user is on the wrong side of the boundary.
 */
function useAuthState() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getStoredUser()
      .then((stored) => {
        if (active) {
          setUser(stored);
        }
      })
      .catch(() => {
        // A failed read is treated like no saved session.
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });
    const unsubscribe = subscribeToAuthState((next) => {
      setUser(next);
      setIsLoading(false);
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return { user, isLoading };
}

/** Whether this device has already dismissed the onboarding slides —
 * mirrors useAuthState above exactly: hydrate once from SecureStore, then
 * stay in sync via subscribeToOnboardingState. Without the subscription
 * half, markOnboardingSeen() flipping the stored value on Skip/Get Started
 * would go unnoticed here — AuthGate would still be holding the stale
 * "not seen" state the instant navigation lands back on "/", and immediately
 * redirect right back to /onboarding. */
function useOnboardingState() {
  const [seen, setSeen] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    hasSeenOnboarding()
      .then((value) => {
        if (active) setSeen(value);
      })
      .catch(() => {
        // A failed read shouldn't block every future launch behind a
        // permanently-stuck onboarding screen — treat it as already seen.
        if (active) setSeen(true);
      });
    const unsubscribe = subscribeToOnboardingState((next) => setSeen(next));
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return { onboardingSeen: seen, isLoading: seen === null };
}

/** Root authentication guard.
 *
 * Redirects any route that doesn't match the current auth state, so:
 *  - an authenticated user can never stay on login/register screens (they're
 *    bounced to their home), and
 *  - a signed-out user can never stay inside the (borrower)/(lender) groups.
 *
 * This is the second line of defense against the "back gesture after login
 * reveals the login screen" bug: even if an auth screen ever lingered in the
 * native history behind the app, the moment it's shown this guard replaces it
 * with the authenticated home. enterAuthenticatedApp() (src/services/auth.ts)
 * does the actual history reset, and gestureEnabled: false on the group
 * screens blocks the native edge-swipe itself.
 */
function AuthGate({
  user,
  isLoading,
  onboardingSeen,
}: {
  user: AuthUser | null;
  isLoading: boolean;
  onboardingSeen: boolean | null;
}) {
  const router = useRouter();
  const segments = useSegments();
  const navigationReady = useRootNavigationState()?.key != null;

  useEffect(() => {
    if (isLoading || !navigationReady) return;

    const inAppArea =
      segments[0] === "(borrower)" || segments[0] === "(lender)";

    if (user) {
      // Authenticated users belong in the app — never on the welcome, sign-in,
      // register, or verification screens.
      if (!inAppArea) {
        router.replace(authenticatedHomeFor(user));
      }
    } else if (inAppArea) {
      // Signed-out users belong on the login screen — never in the app.
      router.replace("/sign-in");
    } else if (onboardingSeen === false && segments[0] !== "onboarding") {
      // First-ever launch on this device — show the explainer slides before
      // anything else, once. Every later launch has onboardingSeen === true
      // (set the moment the slides are skipped/finished) and skips this.
      router.replace("/onboarding");
    }
  }, [user, isLoading, navigationReady, segments, router, onboardingSeen]);

  return null;
}

export default function RootLayout() {
  const { user, isLoading } = useAuthState();
  const { onboardingSeen, isLoading: onboardingLoading } = useOnboardingState();
  const bootLoading = isLoading || onboardingLoading;
  const [fontReady, setFontReady] = useState(false);
  const [iconsReady, setIconsReady] = useState(false);

  const segments = useSegments();
  const navigationReady = useRootNavigationState()?.key != null;

  useEffect(() => {
    let active = true;
    Ionicons.loadFont()
      .catch(() => {})
      .finally(() => {
        if (active) setIconsReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    // Only drop the splash once the screen the user is meant to see has
    // actually rendered. The auth screens and the logged-in app sit on
    // opposite sides of the route tree, so a returning user would otherwise
    // see the welcome screen flash before AuthGate's redirect to their home
    // lands — this waits for that redirect too.
    const booted = fontReady && iconsReady && !bootLoading && navigationReady;
    if (!booted) return;

    const inAppArea =
      segments[0] === "(borrower)" || segments[0] === "(lender)";
    const onOnboarding = segments[0] === "onboarding";
    const routedCorrectly =
      (user && inAppArea) ||
      (!user && !inAppArea && (onboardingSeen || onOnboarding));
    if (routedCorrectly) {
      SplashScreen.hideAsync();
    }
  }, [fontReady, iconsReady, bootLoading, navigationReady, segments, user, onboardingSeen]);

  // Safety net: never leave the splash up forever if something above stalls
  // (e.g. SecureStore hangs) — a brief flash beats a permanently stuck splash.
  useEffect(() => {
    const safety = setTimeout(() => {
      SplashScreen.hideAsync();
    }, 10000);
    return () => clearTimeout(safety);
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        SystemUI.setBackgroundColorAsync(Colors.background);
      }
    });
    return () => subscription.remove();
  }, []);

  return (
    <FontScaleProvider onReady={() => setFontReady(true)}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" />
        {bootLoading ? (
          // Keep the screen covered with the app background until we know
          // whether there's a saved session (and, for a first-ever launch,
          // whether onboarding still needs to show) — otherwise a returning
          // user would briefly see the welcome screen before AuthGate
          // redirects them, or a new user would see it flash before the
          // onboarding-slides redirect lands.
          <View style={{ flex: 1, backgroundColor: Colors.background }} />
        ) : (
          /* Without contentStyle, every screen's default background is
              white — invisible normally, but exposed as an overflow around
              the bottom tab bar's rounded corners (see (borrower)/_layout.tsx
              and (lender)/_layout.tsx), since the tab bar no longer fills
              this container's full rectangular bounds. */
          /* router.replace() is used throughout the auth flow (sign-in →
              home, register → verify-email → verify-phone → home) so the
              back button can't step into an already-completed step — but
              native-stack's default replace animation is "pop" (a backward
              transition), which looks like an instant snap when the flow is
              actually moving forward. "push" makes replace() slide forward
              like a normal transition instead. */
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: Colors.background },
              animationTypeForReplace: "push",
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="sign-in" />
            <Stack.Screen name="register-borrower" />
            <Stack.Screen name="register-lender" />
            <Stack.Screen name="forgot-password" />
            <Stack.Screen name="phone-otp-signin" />
            <Stack.Screen name="verify-email" />
            <Stack.Screen name="verify-phone" />
            {/* gestureEnabled: false at the authenticated group boundary —
                the final native safeguard against the iOS edge-swipe that
                would otherwise pop the app group and reveal a login screen
                sitting underneath it in the root stack. This blocks the swipe
                only between the app and the auth screens: inside
                (borrower)/(lender) each group is its own native stack (see
                those _layout.tsx files), so pushing/popping screens within
                the app — including its edge-swipe back gesture — is
                untouched. */}
            <Stack.Screen
              name="(borrower)"
              options={{ gestureEnabled: false }}
            />
            <Stack.Screen
              name="(lender)"
              options={{ gestureEnabled: false }}
            />
          </Stack>
        )}
        <AuthGate user={user} isLoading={bootLoading} onboardingSeen={onboardingSeen} />
      </QueryClientProvider>
    </FontScaleProvider>
  );
}