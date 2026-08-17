import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Colors, BorderRadius } from "../../src/theme";
import {
  useRealtimeNotifications,
  usePushRegistration,
  fetchMarketplace,
  fetchPortfolio,
} from "../../src/services";

export default function LenderTabLayout() {
  useRealtimeNotifications();
  usePushRegistration();
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
      screenOptions={{
        headerShown: false,
        // Without this, the area behind the tab bar defaults to white —
        // invisible with square corners, but exposed as a white triangle
        // in each corner now that the tab bar itself is rounded there.
        sceneStyle: { backgroundColor: Colors.background },
        tabBarActiveTintColor: Colors.gold,
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
        name="applications"
        options={{
          title: "Applications",
          tabBarBadge: marketplace?.total || undefined,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="file-tray-full-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="portfolio"
        options={{
          title: "Portfolio",
          tabBarBadge: awaitingDisbursement || undefined,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="briefcase-outline" size={size} color={color} />
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
      {/* Hidden screens */}
      {/* Account — reached via the avatar in Home's header, not a bottom
          tab, same pattern as the borrower side. Approvals and Disputes
          are reached via their own buttons on Home's Quick Actions grid.
          Browse is reachable from
          the "Browse Borrowers" action on Home, so it doesn't need its own
          tab either. */}
      <Tabs.Screen name="account" options={{ href: null }} />
      <Tabs.Screen name="approvals" options={{ href: null }} />
      <Tabs.Screen name="browse" options={{ href: null }} />
      <Tabs.Screen name="register" options={{ href: null }} />
      <Tabs.Screen name="borrower-profile" options={{ href: null }} />
      <Tabs.Screen name="make-offer" options={{ href: null }} />
      <Tabs.Screen name="post-offer" options={{ href: null }} />
      <Tabs.Screen name="my-offers" options={{ href: null }} />
      <Tabs.Screen name="offer-sent" options={{ href: null }} />
      <Tabs.Screen name="loan-detail" options={{ href: null }} />
      <Tabs.Screen name="earnings" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="referrals" options={{ href: null }} />
      <Tabs.Screen name="help" options={{ href: null }} />
      <Tabs.Screen name="disputes" options={{ href: null }} />
      <Tabs.Screen name="dispute-detail" options={{ href: null }} />
    </Tabs>
  );
}
