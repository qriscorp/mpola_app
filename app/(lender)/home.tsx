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
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadow,
} from "../../src/theme";
import { Card, StatCard, Badge } from "../../src/components";
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Greeting */}
        <View style={styles.greetingRow}>
          <View>
            <Text style={styles.greeting}>Welcome back</Text>
            <Text style={styles.name}>
              {user.firstName} {user.lastName}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.bellBtn}
            onPress={() => router.push("/(lender)/notifications")}
          >
            <Ionicons
              name="notifications-outline"
              size={22}
              color={Colors.textPrimary}
            />
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsRow}>
          <StatCard
            label="Total Deployed"
            value={`${(stats.totalDeployed / 1000000).toFixed(1)}M`}
            color={Colors.gold}
          />
          <View style={{ width: Spacing.sm }} />
          <StatCard
            label="Active Loans"
            value={String(stats.activeLoans)}
            color={Colors.teal}
          />
        </View>
        <View style={styles.statsRow}>
          <StatCard
            label="Monthly Return"
            value={`UGX ${stats.monthlyReturn.toLocaleString()}`}
            color={Colors.gold}
          />
          <View style={{ width: Spacing.sm }} />
          <StatCard
            label="Repayment Rate"
            value={`${stats.repaymentRate}%`}
            color={Colors.teal}
          />
        </View>

        {/* Total Earnings Card */}
        <Card style={styles.earningsCard}>
          <View style={styles.earningsHeader}>
            <Text style={styles.earningsLabel}>TOTAL EARNINGS</Text>
            <TouchableOpacity onPress={() => router.push("/(lender)/earnings")}>
              <Text style={styles.seeAll}>Details →</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.earningsAmount}>
            UGX {stats.totalEarned.toLocaleString()}
          </Text>
          <View style={styles.earningsSubRow}>
            <Text style={styles.earningsSub}>
              This month: UGX {stats.thisMonthEarned.toLocaleString()}
            </Text>
          </View>
        </Card>

        {/* New Matches CTA */}
        {newMatches > 0 && (
          <TouchableOpacity
            style={styles.matchCta}
            onPress={() => router.push("/(lender)/browse")}
          >
            <View style={styles.matchCtaLeft}>
              <Ionicons name="people" size={20} color={Colors.gold} />
              <Text style={styles.matchCtaText}>
                {newMatches} new borrower matches
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>
        )}

        {/* Recent Activity */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity onPress={() => router.push("/(lender)/portfolio")}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        {recentActivity.map((item: any) => (
          <TouchableOpacity
            key={item.id}
            style={styles.activityCard}
            onPress={() =>
              router.push({
                pathname: "/(lender)/loan-detail",
                params: { loanId: item.id },
              })
            }
          >
            <View style={styles.activityAvatar}>
              <Text style={styles.activityInitial}>
                {item.borrowerName?.[0] ?? "?"}
              </Text>
            </View>
            <View style={styles.activityInfo}>
              <Text style={styles.activityName}>{item.borrowerName}</Text>
              <Text style={styles.activityDetail}>
                UGX {item.amount.toLocaleString()} • {item.interestRate}%/mo
              </Text>
            </View>
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
          </TouchableOpacity>
        ))}

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: Colors.gold }]}
            onPress={() => router.push("/(lender)/browse")}
          >
            <Ionicons name="search-outline" size={20} color={Colors.white} />
            <Text style={styles.actionText}>Browse Borrowers</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionBtn,
              {
                backgroundColor: Colors.white,
                borderWidth: 1,
                borderColor: Colors.border,
              },
            ]}
            onPress={() => router.push("/(lender)/wallet")}
          >
            <Ionicons
              name="wallet-outline"
              size={20}
              color={Colors.textPrimary}
            />
            <Text style={[styles.actionText, { color: Colors.textPrimary }]}>
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
  greetingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  greeting: { ...Typography.body, color: Colors.textSecondary },
  name: { ...Typography.h2, color: Colors.textPrimary },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
    ...Shadow.sm,
  },
  statsRow: { flexDirection: "row", marginBottom: Spacing.sm },
  earningsCard: {
    backgroundColor: Colors.navy,
    marginBottom: Spacing.lg,
    marginTop: Spacing.sm,
  },
  earningsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  earningsLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  earningsAmount: {
    ...Typography.h1,
    color: Colors.white,
    marginBottom: Spacing.xs,
  },
  earningsSubRow: { flexDirection: "row" },
  earningsSub: { ...Typography.small, color: Colors.textMuted },
  matchCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.goldLight,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  matchCtaLeft: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  matchCtaText: { ...Typography.bodyMedium, color: Colors.goldDark },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  sectionTitle: { ...Typography.h4, color: Colors.textPrimary },
  seeAll: { ...Typography.smallMedium, color: Colors.gold },
  activityCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  activityAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.goldLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  activityInitial: {
    ...Typography.bodyMedium,
    color: Colors.goldDark,
  },
  activityInfo: { flex: 1 },
  activityName: { ...Typography.bodyMedium, color: Colors.textPrimary },
  activityDetail: {
    ...Typography.small,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    ...Shadow.sm,
  },
  actionText: { ...Typography.buttonSmall, color: Colors.white },
});
