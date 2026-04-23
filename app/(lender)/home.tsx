import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, BorderRadius } from "../../src/theme";
import { Badge } from "../../src/components";
import { useLenderDashboardViewModel } from "../../src/viewmodels";

export default function LenderHomeScreen() {
  const router = useRouter();
  const { user, stats, recentActivity, newMatches, isLoading } =
    useLenderDashboardViewModel();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator
          size="large"
          color={Colors.gold}
          style={{ flex: 1 }}
        />
      </SafeAreaView>
    );
  }

  const initials =
    `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Top Nav */}
        <View style={styles.topNav}>
          <View style={styles.logoBox}>
            <Text style={styles.logoLetter}>L</Text>
          </View>
          <Text style={styles.logoText}>WeLend</Text>
          <View style={{ flex: 1 }} />
          <TouchableOpacity
            style={styles.bellBtn}
            onPress={() => router.push("/(lender)/notifications")}
          >
            <Ionicons
              name="notifications-outline"
              size={20}
              color={Colors.textPrimary}
            />
            <View style={styles.bellDot} />
          </TouchableOpacity>
          <View style={styles.avatarBtn}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        </View>

        {/* Greeting */}
        <Text style={styles.greeting}>Good morning,</Text>
        <Text style={styles.name}>
          {user.firstName} {user.lastName}
        </Text>

        {/* Deployed Capital Card */}
        <View style={styles.capitalCard}>
          <Text style={styles.capitalLabel}>TOTAL DEPLOYED CAPITAL</Text>
          <Text style={styles.capitalAmount}>
            UGX {stats.totalDeployed.toLocaleString()}
          </Text>
          <Text style={styles.capitalGrowth}>+12% this month</Text>
          <View style={styles.capitalStats}>
            <View style={styles.capitalStat}>
              <Text style={styles.capitalStatLabel}>Offers</Text>
              <Text style={styles.capitalStatValue}>{stats.activeLoans}</Text>
            </View>
            <View style={styles.capitalStat}>
              <Text style={styles.capitalStatLabel}>Applications</Text>
              <Text style={styles.capitalStatValue}>{newMatches}</Text>
            </View>
            <View style={styles.capitalStat}>
              <Text style={styles.capitalStatLabel}>Earned</Text>
              <Text style={[styles.capitalStatValue, { color: Colors.teal }]}>
                {(stats.totalEarned / 1000000).toFixed(1)}M
              </Text>
            </View>
          </View>
        </View>

        {/* My Active Offers */}
        <Text style={styles.sectionTitle}>My Active Offers</Text>

        {recentActivity.map((item: any) => (
          <TouchableOpacity
            key={item.id}
            style={styles.offerCard}
            onPress={() =>
              router.push({
                pathname: "/(lender)/loan-detail",
                params: { loanId: item.id },
              })
            }
          >
            <View style={styles.offerCardTop}>
              <Text style={styles.offerAmount}>
                UGX {item.amount.toLocaleString()}
              </Text>
              <Badge
                label={item.status}
                variant={
                  item.status === "active"
                    ? "success"
                    : item.status === "overdue"
                      ? "danger"
                      : "default"
                }
              />
            </View>
            <Text style={styles.offerSub}>
              {item.interestRate}%/mo · Max {item.duration ?? "—"} months
            </Text>
            <Text style={styles.offerMeta}>
              {item.applicants ?? 0} applicants · {item.approved ?? 0} approved
            </Text>
          </TouchableOpacity>
        ))}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionBtnGold}
            onPress={() => router.push("/(lender)/browse")}
          >
            <Ionicons name="search-outline" size={18} color={Colors.white} />
            <Text style={styles.actionText}>Browse Borrowers</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtnOutline}
            onPress={() => router.push("/(lender)/wallet")}
          >
            <Ionicons
              name="wallet-outline"
              size={18}
              color={Colors.textSecondary}
            />
            <Text style={[styles.actionText, { color: Colors.textSecondary }]}>
              My Wallet
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, paddingBottom: 40 },
  topNav: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  logoBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: Colors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  logoLetter: { fontSize: 16, fontWeight: "700", color: Colors.white },
  logoText: { ...Typography.h3, color: Colors.white },
  bellBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  bellDot: {
    position: "absolute",
    top: 7,
    right: 7,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.danger,
  },
  avatarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { ...Typography.caption, color: Colors.white, fontWeight: "700" },
  greeting: { ...Typography.body, color: Colors.textSecondary },
  name: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.gold,
    marginBottom: Spacing.xl,
  },
  capitalCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  capitalLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: Spacing.xs,
  },
  capitalAmount: {
    fontSize: 32,
    fontWeight: "800",
    color: Colors.white,
    lineHeight: 40,
  },
  capitalGrowth: {
    ...Typography.small,
    color: Colors.gold,
    marginTop: 4,
    marginBottom: Spacing.lg,
  },
  capitalStats: { flexDirection: "row", gap: Spacing.md },
  capitalStat: {
    flex: 1,
    backgroundColor: Colors.surfaceLift,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    alignItems: "center",
  },
  capitalStatLabel: { ...Typography.caption, color: Colors.textMuted },
  capitalStatValue: { ...Typography.h3, color: Colors.gold, marginTop: 2 },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.white,
    marginBottom: Spacing.md,
  },
  offerCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.gold,
  },
  offerCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  offerAmount: { ...Typography.h3, color: Colors.white },
  offerSub: { ...Typography.small, color: Colors.textMuted },
  offerMeta: { ...Typography.small, color: Colors.textMuted, marginTop: 2 },
  actions: { flexDirection: "row", gap: Spacing.sm, marginTop: Spacing.lg },
  actionBtnGold: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gold,
  },
  actionBtnOutline: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionText: { ...Typography.buttonSmall, color: Colors.white },
});
