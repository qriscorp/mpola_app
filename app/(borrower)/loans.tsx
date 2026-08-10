import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Colors, Typography, Spacing, BorderRadius } from "../../src/theme";
import { ProgressBar, SkeletonBox, SkeletonCard } from "../../src/components";
import { useActiveLoanViewModel } from "../../src/viewmodels";

const TABS = ["All", "Active", "Pending", "Closed"];

export default function LoansScreen() {
  const router = useRouter();
  const { loan, isLoading } = useActiveLoanViewModel();
  const [activeTab, setActiveTab] = useState("All");

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>My Loans</Text>
          <View style={{ flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.lg }}>
            {[1, 2, 3, 4].map((i) => (
              <SkeletonBox key={i} width={70} height={30} radius={BorderRadius.full} />
            ))}
          </View>
          <SkeletonCard height={220} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!loan) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>My Loans</Text>
          <Text style={styles.noLoanText}>
            You don&apos;t have any loans yet.
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const progress = loan.paidInstalments / loan.totalInstalments;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <Text style={styles.title}>My Loans</Text>

        {/* Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsScroll}
          contentContainerStyle={styles.tabsRow}
        >
          {TABS.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tab, activeTab === t && styles.tabActive]}
              onPress={() => setActiveTab(t)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === t && styles.tabTextActive,
                ]}
              >
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Loan Card */}
        <View style={styles.loanCard}>
          <View style={styles.loanCardTop}>
            <View>
              <Text style={styles.loanAmount}>
                UGX {loan.amount.toLocaleString()}
              </Text>
              <Text style={styles.loanSub}>
                {loan.interestRate}%/month · {loan.duration} months
              </Text>
            </View>
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>{loan.status}</Text>
            </View>
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressLabelRow}>
              <Text style={styles.progressLabel}>Payment Progress</Text>
              <Text style={styles.progressLabel}>
                {loan.paidInstalments}/{loan.totalInstalments}
              </Text>
            </View>
            <ProgressBar progress={progress} color={Colors.teal} height={6} />
          </View>

          <View style={styles.detailRows}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Monthly Payment</Text>
              <Text style={styles.detailValue}>
                UGX {loan.monthlyPayment.toLocaleString()}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Next Payment</Text>
              <Text style={styles.detailValue}>
                {loan.nextPaymentDate
                  ? new Date(loan.nextPaymentDate).toLocaleDateString(
                      "en-UG",
                      { day: "numeric", month: "short", year: "numeric" },
                    )
                  : "—"}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.viewOffersBtn}
            onPress={() => router.push("/(borrower)/offers")}
          >
            <Text style={styles.viewOffersText}>View Offers</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.receiptsLink}
          onPress={() => router.push("/(borrower)/receipts")}
        >
          <Text style={styles.receiptsLinkText}>View Payment Receipts →</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, paddingBottom: 40 },
  title: { ...Typography.h2, color: Colors.white, marginBottom: Spacing.lg },
  noLoanText: { ...Typography.body, color: Colors.textMuted },
  tabsScroll: { marginBottom: Spacing.lg },
  tabsRow: { gap: Spacing.sm },
  tab: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabActive: { backgroundColor: Colors.teal + "25", borderColor: Colors.teal },
  tabText: { ...Typography.bodyMedium, color: Colors.textSecondary },
  tabTextActive: { color: Colors.teal },
  loanCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  loanCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.lg,
  },
  loanAmount: { ...Typography.h2, color: Colors.white },
  loanSub: { ...Typography.small, color: Colors.textMuted, marginTop: 2 },
  activeBadge: {
    backgroundColor: Colors.teal + "25",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  activeBadgeText: {
    ...Typography.caption,
    color: Colors.teal,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  progressSection: { marginBottom: Spacing.lg },
  progressLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
  },
  progressLabel: { ...Typography.small, color: Colors.textMuted },
  detailRows: { marginBottom: Spacing.lg },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  detailLabel: { ...Typography.body, color: Colors.textSecondary },
  detailValue: { ...Typography.bodyMedium, color: Colors.textPrimary },
  viewOffersBtn: {
    borderWidth: 1,
    borderColor: Colors.teal,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.sm,
    alignItems: "center",
  },
  viewOffersText: { ...Typography.buttonSmall, color: Colors.teal },
  receiptsLink: { alignItems: "center", marginTop: Spacing.lg },
  receiptsLinkText: { ...Typography.smallMedium, color: Colors.textSecondary },
});
