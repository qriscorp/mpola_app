import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../../src/theme";
import { useRealtimeNotifications, usePushRegistration } from "../../../src/services";
import { NativeGlassTabBar } from "../../../src/components";

export default function BorrowerTabLayout() {
  useRealtimeNotifications("borrower");
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
    </Tabs>
  );
}
