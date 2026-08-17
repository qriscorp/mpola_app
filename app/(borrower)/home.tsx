import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, BorderRadius, useScaledTypography } from "../../src/theme";
import { InfoTip, ProgressBar, SkeletonHero, SkeletonStatRow } from "../../src/components";
import { formatCompactUGX } from "../../src/services/currency";
import {
  useBorrowerDashboardViewModel,
  useNotificationsViewModel,
} from "../../src/viewmodels";
import { fetchGuarantorRequests } from "../../src/services";

export default function BorrowerHomeScreen() {
  const router = useRouter();
  const { user, stats, loan, paymentProgress, walletBalance, isLoading } =
    useBorrowerDashboardViewModel();
  const { unreadCount } = useNotificationsViewModel();
  // Same query the old Approvals tab badge used — now that Approvals lives
  // on Home instead of the tab bar, this preserves that at-a-glance count.
  const { data: pendingApprovals = [] } = useQuery({
    queryKey: ["guarantor-requests", "pending"],
    queryFn: () => fetchGuarantorRequests("pending"),
  });
  const pendingApprovalsCount = pendingApprovals.length;
  const typography = useScaledTypography();
  const styles = useMemo(() => makeStyles(typography), [typography]);

  const initials = [user.firstName?.[0], user.lastName?.[0]]
    .filter(Boolean)
    .join("")
    .toUpperCase();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          <View style={styles.header}>
            <View style={styles.logoBox}>
              <Text style={styles.logoLetter}>M</Text>
            </View>
            <Text style={styles.greeting}>Hi</Text>
          </View>
          <View style={{ marginBottom: Spacing.xl }}>
            <SkeletonHero height={150} />
          </View>
          <View style={{ marginBottom: Spacing.xl }}>
            <SkeletonStatRow count={3} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Top header */}
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Text style={styles.logoLetter}>M</Text>
          </View>
          <Text style={styles.greeting}>
            Hi, <Text style={styles.greetingName}>{user.firstName}</Text>
          </Text>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.bellBtn}
              onPress={() => router.push("/(borrower)/notifications")}
            >
              <Ionicons
                name="notifications-outline"
                size={20}
                color={Colors.textSecondary}
              />
              {unreadCount > 0 && <View style={styles.bellDot} />}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.avatarCircle}
              onPress={() => router.push("/(borrower)/profile")}
              accessibilityLabel="Open your profile"
              accessibilityRole="button"
            >
              <Text style={styles.avatarText}>{initials}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Active Loan Card */}
        <View style={styles.loanCard}>
          <Text style={styles.loanCardLabel}>ACTIVE LOAN</Text>
          <Text style={styles.loanAmount}>
            UGX {(loan?.amount ?? 0).toLocaleString()}
          </Text>
          <Text style={styles.loanNext}>
            Next: UGX {(loan?.nextPaymentAmount ?? 0).toLocaleString()} due{" "}
            {loan?.nextPaymentDate ?? "—"}
          </Text>
          <ProgressBar
            progress={paymentProgress}
            color={Colors.white}
            height={4}
          />
          <View style={{ height: Spacing.lg }} />
          <TouchableOpacity
            style={styles.payNowBtn}
            onPress={() => router.push("/(borrower)/payment")}
          >
            <Text style={styles.payNowText}>Pay Now</Text>
          </TouchableOpacity>
        </View>

        {/* Stats — 2x2 grid, not a 4-across row, so "UGX <amount>" has
            enough room without wrapping or crowding the other values. */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
              UGX {formatCompactUGX(walletBalance)}
            </Text>
            <Text style={styles.statLabel}>Balance</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>
              {stats.paymentsRepaid
                ? `${Math.round((stats.paymentsRepaid / stats.totalPayments) * 100)}%`
                : "0%"}
            </Text>
            <Text style={styles.statLabel}>Repaid</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats.creditScore || "—"}</Text>
            <View style={styles.statLabelRow}>
              <Text style={styles.statLabel}>Credit Score</Text>
              <InfoTip
                title="About your credit score"
                text="Lenders see this score when deciding whether to offer you a loan at all, and some won't lend below a certain score — so it can be the difference between getting an offer or not. It starts at a neutral 50 (no track record yet) and only moves once a loan is fully resolved: repaying in full and on time raises it, defaulting or going overdue lowers it sharply since it's based on so few resolved loans. Recalculated once a day, so it won't move while a loan is still active."
              />
            </View>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats.loansTaken ?? "—"}</Text>
            <Text style={styles.statLabel}>Loans Taken</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionCell}
            onPress={() => router.push("/(borrower)/offers")}
          >
            <Ionicons name="search-outline" size={22} color={Colors.teal} />
            <Text style={styles.actionLabel}>Browse Offers</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCell}
            onPress={() => router.push("/(borrower)/apply")}
          >
            <Ionicons
              name="document-text-outline"
              size={22}
              color={Colors.textSecondary}
            />
            <Text style={styles.actionLabel}>Post Request</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCell}
            onPress={() => router.push("/(borrower)/payment")}
          >
            <Ionicons
              name="card-outline"
              size={22}
              color={Colors.textSecondary}
            />
            <Text style={styles.actionLabel}>Repayment</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCell}
            onPress={() => router.push("/(borrower)/wallet")}
          >
            <Ionicons
              name="wallet-outline"
              size={22}
              color={Colors.textSecondary}
            />
            <Text style={styles.actionLabel}>Wallet</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCell}
            onPress={() => router.push("/(borrower)/my-requests")}
          >
            <Ionicons
              name="list-outline"
              size={22}
              color={Colors.textSecondary}
            />
            <Text style={styles.actionLabel}>My Requests</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCell}
            onPress={() => router.push("/(borrower)/disputes")}
          >
            <Ionicons
              name="alert-circle-outline"
              size={22}
              color={Colors.textSecondary}
            />
            <Text style={styles.actionLabel}>Disputes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCell}
            onPress={() => router.push("/(borrower)/approvals")}
          >
            <View>
              <Ionicons
                name="checkmark-done-outline"
                size={22}
                color={Colors.textSecondary}
              />
              {pendingApprovalsCount > 0 && (
                <View style={styles.actionCellBadge}>
                  <Text style={styles.actionCellBadgeText}>{pendingApprovalsCount}</Text>
                </View>
              )}
            </View>
            <Text style={styles.actionLabel}>Approvals</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(typography: ReturnType<typeof useScaledTypography>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    scroll: { paddingHorizontal: Spacing.lg, paddingBottom: 40 },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: Spacing.lg,
    },
    logoBox: {
      width: 34,
      height: 34,
      borderRadius: 8,
      backgroundColor: Colors.teal,
      alignItems: "center",
      justifyContent: "center",
      marginRight: Spacing.sm,
    },
    logoLetter: { fontSize: 16, fontWeight: "700", color: Colors.white },
    greeting: { ...typography.h4, color: Colors.textSecondary, flex: 1 },
    greetingName: { color: Colors.teal },
    headerRight: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
    bellBtn: { position: "relative" },
    bellDot: {
      position: "absolute",
      top: 0,
      right: 0,
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: Colors.danger,
    },
    avatarCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: Colors.teal,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: { ...typography.smallMedium, color: Colors.white },
    loanCard: {
      backgroundColor: Colors.teal,
      borderRadius: BorderRadius.xl,
      padding: Spacing.xl,
      marginBottom: Spacing.xl,
    },
    loanCardLabel: {
      ...typography.caption,
      color: "rgba(255,255,255,0.7)",
      letterSpacing: 1,
      marginBottom: Spacing.xs,
    },
    loanAmount: {
      fontSize: 28,
      fontWeight: "700",
      color: Colors.white,
      marginBottom: Spacing.xs,
    },
    loanNext: {
      ...typography.small,
      color: "rgba(255,255,255,0.8)",
      marginBottom: Spacing.md,
    },
    payNowBtn: {
      backgroundColor: "rgba(255,255,255,0.2)",
      borderRadius: BorderRadius.full,
      paddingVertical: Spacing.md,
      alignItems: "center",
    },
    payNowText: { ...typography.button, color: Colors.white },
    statsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: Spacing.sm,
      marginBottom: Spacing.xl,
    },
    statBox: {
      width: "47.5%",
      backgroundColor: Colors.surface,
      borderRadius: BorderRadius.lg,
      alignItems: "center",
      paddingVertical: Spacing.lg,
      paddingHorizontal: Spacing.xs,
    },
    statValue: { ...typography.h4, color: Colors.textPrimary },
    statLabel: { ...typography.caption, color: Colors.textMuted, marginTop: 2 },
    statLabelRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      marginTop: 2,
    },
    sectionLabel: {
      ...typography.caption,
      color: Colors.textMuted,
      letterSpacing: 1,
      marginBottom: Spacing.md,
    },
    actionsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: Spacing.sm,
    },
    actionCell: {
      width: "47.5%",
      backgroundColor: Colors.surface,
      borderRadius: BorderRadius.lg,
      paddingVertical: Spacing.xl,
      alignItems: "center",
      gap: Spacing.xs,
    },
    actionLabel: { ...typography.bodyMedium, color: Colors.textSecondary },
    actionCellBadge: {
      position: "absolute",
      top: -6,
      right: -10,
      backgroundColor: Colors.danger,
      borderRadius: BorderRadius.full,
      minWidth: 16,
      height: 16,
      paddingHorizontal: 3,
      alignItems: "center",
      justifyContent: "center",
    },
    actionCellBadgeText: { ...typography.caption, color: Colors.white, fontWeight: "700" },
  });
}
