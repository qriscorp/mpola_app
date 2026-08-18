import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FontScaleProvider, Colors } from "../src/theme";

// Fired at module load — as early as this JS bundle can possibly run —
// rather than inside a component effect, to close the gap where Android's
// edge-to-edge system-bar insets haven't settled yet and the root window's
// default white background would otherwise flash/show through in that
// area (see the bottom-nav-bar overlap issue). `android.backgroundColor`
// in app.json covers this permanently once the app is a real native
// build; this covers the same thing while running in Expo Go.
SystemUI.setBackgroundColorAsync(Colors.background);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

export default function RootLayout() {
  return (
    <FontScaleProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" />
        {/* Without contentStyle, every screen's default background is
            white — invisible normally, but exposed as an overflow around
            the bottom tab bar's rounded corners (see (borrower)/_layout.tsx
            and (lender)/_layout.tsx), since the tab bar no longer fills
            this container's full rectangular bounds. */}
        {/* router.replace() is used throughout the auth flow (sign-in →
            home, register → verify-email → verify-phone → home) so the
            back button can't step into an already-completed step — but
            native-stack's default replace animation is "pop" (a backward
            transition), which looks like an instant snap when the flow is
            actually moving forward. "push" makes replace() slide forward
            like a normal transition instead. */}
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
          <Stack.Screen name="(borrower)" />
          <Stack.Screen name="(lender)" />
        </Stack>
      </QueryClientProvider>
    </FontScaleProvider>
  );
}
