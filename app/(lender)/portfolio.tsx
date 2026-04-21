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
import { StatCard, Badge, ProgressBar } from "../../src/components";
import { usePortfolioViewModel } from "../../src/viewmodels";

export default function PortfolioScreen() {
  const router = useRouter();
  const {
    filter,
    setFilter,
    loans,
    totalLent,
    totalEarned,
    repaymentRate,
    totalActive,
    filters,
    isLoading,
  } = usePortfolioViewModel();

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
        <Text style={styles.title}>Portfolio</Text>

        {/* Summary Stats */}
        <View style={styles.statsRow}>
          <StatCard
            label="Total Lent"
            value={`${(totalLent / 1000000).toFixed(1)}M`}
            color={Colors.gold}
          />
          <View style={{ width: Spacing.sm }} />
          <StatCard
            label="Total Earned"
            value={`${(totalEarned / 1000000).toFixed(1)}M`}
            color={Colors.teal}
          />
        </View>
        <View style={styles.statsRow}>
          <StatCard
            label="Repayment Rate"
            value={`${repaymentRate}%`}
            color={Colors.teal}
          />
          <View style={{ width: Spacing.sm }} />
          <StatCard
            label="Active"
            value={String(totalActive)}
            color={Colors.gold}
          />
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterRow}>
          {filters.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterTab, filter === f && styles.filterTabActive]}
              onPress={() => setFilter(f as any)}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === f && styles.filterTextActive,
                ]}
              >
                {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Loan Cards */}
        {loans.map((loan) => (
          <TouchableOpacity
            key={loan.id}
            style={styles.loanCard}
            onPress={() =>
              router.push({
                pathname: "/(lender)/loan-detail",
                params: { loanId: loan.id },
              })
            }
          >
            <View style={styles.loanHeader}>
              <View style={styles.loanInfo}>
                <Text style={styles.loanName}>{loan.borrowerName}</Text>
                <Text style={styles.loanMeta}>
                  UGX {loan.amount.toLocaleString()} • {loan.interestRate}%/mo
                </Text>
              </View>
              <Badge
                label={loan.status}
                variant={
                  loan.status === "active"
                    ? "success"
                    : loan.status === "overdue"
                      ? "danger"
                      : "default"
                }
              />
            </View>

            <View style={styles.progressSection}>
              <View style={styles.progressLabelRow}>
                <Text style={styles.progressLabel}>
                  {loan.paidInstalments} of {loan.totalInstalments} payments
                </Text>
                <Text style={styles.progressPercent}>
                  {Math.round(loan.progress * 100)}%
                </Text>
              </View>
              <ProgressBar
                progress={loan.progress}
                color={loan.status === "overdue" ? Colors.danger : Colors.gold}
              />
            </View>

            <View style={styles.loanFooter}>
              <Text style={styles.footerLabel}>
                Monthly: UGX {loan.monthlyPayment.toLocaleString()}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={Colors.textMuted}
              />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, paddingBottom: 40 },
  title: {
    ...Typography.h2,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  statsRow: { flexDirection: "row", marginBottom: Spacing.sm },
  filterRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  filterTab: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterTabActive: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  filterText: { ...Typography.smallMedium, color: Colors.textSecondary },
  filterTextActive: { color: Colors.white },
  loanCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  loanHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  loanInfo: {},
  loanName: { ...Typography.h4, color: Colors.textPrimary },
  loanMeta: { ...Typography.small, color: Colors.textSecondary, marginTop: 2 },
  progressSection: { marginBottom: Spacing.md },
  progressLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
  },
  progressLabel: { ...Typography.small, color: Colors.textSecondary },
  progressPercent: { ...Typography.smallMedium, color: Colors.textPrimary },
  loanFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerLabel: { ...Typography.small, color: Colors.textMuted },
});
