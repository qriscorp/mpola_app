import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FontScaleProvider, Colors } from "../src/theme";

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
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background } }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="sign-in" />
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
