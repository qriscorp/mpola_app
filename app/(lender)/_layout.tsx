import { Stack } from "expo-router";
import { Colors } from "../../src/theme";

// The lender area is a native stack so that every non-tab screen (account,
// settings, approvals, my-offers, loan-detail, ...) is really pushed on top
// of the tabs — router.back() pops the actual previous screen and iOS's
// edge-swipe works inside the app. The four tab roots live in the (tabs)
// group below.
export default function LenderLayout() {
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
          Account rows, notification taps, and flow continuation buttons. */}
      <Stack.Screen name="account" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="approvals" />
      <Stack.Screen name="browse" />
      <Stack.Screen name="borrower-profile" />
      <Stack.Screen name="make-offer" />
      <Stack.Screen name="post-offer" />
      <Stack.Screen name="my-offers" />
      <Stack.Screen name="offer-sent" />
      <Stack.Screen name="offer-posted" />
      <Stack.Screen name="messages" />
      <Stack.Screen name="chat" />
      <Stack.Screen name="loan-detail" />
      <Stack.Screen name="disbursement" />
      <Stack.Screen name="earnings" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="referrals" />
      <Stack.Screen name="help" />
      <Stack.Screen name="disputes" />
      <Stack.Screen name="dispute-detail" />
    </Stack>
  );
}
