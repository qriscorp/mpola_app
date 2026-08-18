import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../src/theme";
import { useRealtimeNotifications, usePushRegistration } from "../../src/services";
import { NativeGlassTabBar } from "../../src/components";

export default function BorrowerTabLayout() {
  useRealtimeNotifications();
  usePushRegistration();

  return (
    <Tabs
      tabBar={(props) => (
        <NativeGlassTabBar
          {...props}
          accentColor="#38D6BF"
          visibleRoutes={["home", "apply", "loans", "wallet"]}
        />
      )}
      screenOptions={{
        headerShown: false,
        // Without this, the area behind the tab bar defaults to white —
        // invisible with square corners, but exposed as a white triangle
        // in each corner now that the tab bar itself is rounded there.
        sceneStyle: { backgroundColor: Colors.background },
        tabBarActiveTintColor: Colors.teal,
        tabBarInactiveTintColor: Colors.textMuted,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="apply"
        options={{
          title: "Apply",
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? "document-text" : "document-text-outline"} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="loans"
        options={{
          title: "My Loans",
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? "wallet" : "wallet-outline"} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: "Wallet",
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? "card" : "card-outline"} size={size} color={color} />
          ),
        }}
      />
      {/* Hidden screens accessible via navigation */}
      {/* Profile — reached via the avatar in Home's header, not a bottom
          tab. Approvals and Disputes are reached via their own buttons on
          Home's Quick Actions grid. Settings lives on its own screen,
          reached via the "Settings" row on Profile — same split as the
          lender side's account.tsx / settings.tsx. */}
      <Tabs.Screen name="profile" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="approvals" options={{ href: null }} />
      <Tabs.Screen name="offers" options={{ href: null }} />
      <Tabs.Screen name="offer-detail" options={{ href: null }} />
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
