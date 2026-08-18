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
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FontScaleProvider, Colors } from "../src/theme";
import {
  authenticatedHomeFor,
  getStoredUser,
  subscribeToAuthState,
  type AuthUser,
} from "../src/services/auth";

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
    getStoredUser().then((stored) => {
      if (active) {
        setUser(stored);
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
}: {
  user: AuthUser | null;
  isLoading: boolean;
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
    }
  }, [user, isLoading, navigationReady, segments, router]);

  return null;
}

export default function RootLayout() {
  const { user, isLoading } = useAuthState();

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        SystemUI.setBackgroundColorAsync(Colors.background);
      }
    });
    return () => subscription.remove();
  }, []);

  return (
    <FontScaleProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" />
        {isLoading ? (
          // Keep the screen covered with the app background until we know
          // whether there's a saved session — otherwise a returning user would
          // briefly see the welcome screen before the AuthGate redirects them.
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
                sitting underneath it in the root stack. Because every screen
                inside (borrower)/(lender) lives under this one stack screen,
                the back gesture is disabled for the whole group while the
                app's own (button-driven) navigation is untouched. */}
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
        <AuthGate user={user} isLoading={isLoading} />
      </QueryClientProvider>
    </FontScaleProvider>
  );
}