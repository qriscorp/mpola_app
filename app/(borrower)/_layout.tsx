import { Stack } from "expo-router";
import { Colors } from "../../src/theme";

// The borrower area is a native stack so that every non-tab screen (profile,
// settings, payment, offers, ...) is really pushed on top of the tabs —
// router.back() pops the actual previous screen and iOS's edge-swipe works
// inside the app. The four tab roots live in the (tabs) group below.
export default function BorrowerLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animationTypeForReplace: "push",
      }}
    >
      <Stack.Screen name="(tabs)" />
      {/* Pushed over the tabs — reachable via Home's avatar/quick actions,
          Profile rows, notification taps, and flow continuation buttons. */}
      <Stack.Screen name="profile" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="approvals" />
      <Stack.Screen name="offers" />
      <Stack.Screen name="offer-detail" />
      <Stack.Screen name="browse-offers" />
      <Stack.Screen name="browse-offer-detail" />
      <Stack.Screen name="payment" />
      <Stack.Screen name="payment-success" />
      <Stack.Screen name="payment-failed" />
      <Stack.Screen name="receipts" />
      <Stack.Screen name="sign-agreement" />
      <Stack.Screen name="loan-approved" />
      <Stack.Screen name="application-sent" />
      <Stack.Screen name="my-requests" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="referrals" />
      <Stack.Screen name="help" />
      <Stack.Screen name="disputes" />
      <Stack.Screen name="dispute-detail" />
    </Stack>
  );
}
