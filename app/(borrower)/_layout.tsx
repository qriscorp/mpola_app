import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, BorderRadius } from "../../src/theme";
import { useRealtimeNotifications, usePushRegistration } from "../../src/services";

export default function BorrowerTabLayout() {
  useRealtimeNotifications();
  usePushRegistration();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // Without this, the area behind the tab bar defaults to white —
        // invisible with square corners, but exposed as a white triangle
        // in each corner now that the tab bar itself is rounded there.
        sceneStyle: { backgroundColor: Colors.background },
        tabBarActiveTintColor: Colors.teal,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          borderTopLeftRadius: BorderRadius.xl,
          borderTopRightRadius: BorderRadius.xl,
          height: 64,
          paddingBottom: 10,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="apply"
        options={{
          title: "Apply",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="loans"
        options={{
          title: "My Loans",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: "Wallet",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="card-outline" size={size} color={color} />
          ),
        }}
      />
      {/* Hidden screens accessible via navigation */}
      {/* Profile — reached via the avatar in Home's header, not a bottom
          tab. Approvals and Disputes are reached via their own buttons on
          Home's Quick Actions grid. Settings was merged into Profile (see
          app/(borrower)/profile.tsx), so there's no separate settings
          route anymore. */}
      <Tabs.Screen name="profile" options={{ href: null }} />
      <Tabs.Screen name="approvals" options={{ href: null }} />
      <Tabs.Screen name="register" options={{ href: null }} />
      <Tabs.Screen name="offers" options={{ href: null }} />
      <Tabs.Screen name="payment" options={{ href: null }} />
      <Tabs.Screen name="payment-success" options={{ href: null }} />
      <Tabs.Screen name="payment-failed" options={{ href: null }} />
      <Tabs.Screen name="receipts" options={{ href: null }} />
      <Tabs.Screen name="sign-agreement" options={{ href: null }} />
      <Tabs.Screen name="loan-approved" options={{ href: null }} />
      <Tabs.Screen name="application-sent" options={{ href: null }} />
      <Tabs.Screen name="my-requests" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="referrals" options={{ href: null }} />
      <Tabs.Screen name="help" options={{ href: null }} />
      <Tabs.Screen name="disputes" options={{ href: null }} />
      <Tabs.Screen name="dispute-detail" options={{ href: null }} />
    </Tabs>
  );
}
