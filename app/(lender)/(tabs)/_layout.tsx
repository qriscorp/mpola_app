import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Colors } from "../../../src/theme";
import {
  useRealtimeNotifications,
  usePushRegistration,
  fetchMarketplace,
  fetchPortfolio,
} from "../../../src/services";
import { NativeGlassTabBar } from "../../../src/components";

export default function LenderTabLayout() {
  useRealtimeNotifications("lender");
  usePushRegistration("lender");
  const { data: marketplace } = useQuery({
    queryKey: ["lender", "marketplace", "inbox"],
    queryFn: () => fetchMarketplace(1, 50),
  });
  const { data: portfolio = [] } = useQuery({
    queryKey: ["lender", "portfolio"],
    queryFn: fetchPortfolio,
  });
  const awaitingDisbursement = portfolio.filter((l) => l.status === "pending_disbursement").length;

  return (
    <Tabs
      tabBar={(props) => (
        <NativeGlassTabBar
          {...props}
          accentColor="#E2C56F"
          visibleRoutes={["home", "applications", "portfolio", "wallet"]}
        />
      )}
      screenOptions={{
        headerShown: false,
        // Without this, the area behind the tab bar defaults to white —
        // invisible with square corners, but exposed as a white triangle
        // in each corner now that the tab bar itself is rounded there.
        sceneStyle: { backgroundColor: Colors.background },
        tabBarActiveTintColor: Colors.gold,
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
        name="applications"
        options={{
          title: "Applications",
          tabBarBadge: marketplace?.total || undefined,
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? "file-tray-full" : "file-tray-full-outline"} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="portfolio"
        options={{
          title: "Portfolio",
          tabBarBadge: awaitingDisbursement || undefined,
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? "briefcase" : "briefcase-outline"} size={size} color={color} />
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
