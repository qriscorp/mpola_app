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
import { useMyLoansViewModel } from "../../src/viewmodels";
import { formatDuration } from "../../src/services/duration";
import type { Loan } from "../../src/models";

const TABS = ["All", "Active", "Pending", "Closed"] as const;
type Tab = (typeof TABS)[number];

// "Overdue" isn't its own tab — it's still an unresolved, ongoing loan, so
// it's bucketed under Active rather than Closed. "defaulted" is a real
// backend status (scheduler._flag_defaulted) even though it's missing from
// the app's LoanStatus type, so it's matched here defensively by string.
function matchesTab(status: string, tab: Tab): boolean {
  if (tab === "All") return true;
  if (tab === "Active") return status === "active" || status === "overdue";
  if (tab === "Pending") return status === "pending_disbursement" || status === "pending";
  return status === "completed" || status === "defaulted" || status === "rejected";
}

function LoanCard({ loan }: { loan: Loan }) {
  const router = useRouter();
  // Amount-based, not instalment-count-based — paidInstalments only
  // advances once a full instalment clears (see make_repayment in
  // routers/loans.py), so a partial payment the borrower already made
  // would otherwise show as 0% progress here even though totalPaid
  // reflects it.
  const progress = loan.totalRepayable
    ? Math.min(1, (loan.totalPaid ?? 0) / loan.totalRepayable)
    : 0;

  return (
    <View style={styles.loanCard}>
      <View style={styles.loanCardTop}>
        <View>
          <Text style={styles.loanAmount}>
            UGX {loan.amount.toLocaleString()}
          </Text>
          <Text style={styles.loanSub}>
            {loan.interestRate}%/month · {formatDuration(loan.duration, loan.durationDays)}
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
            UGX {(loan.totalPaid ?? 0).toLocaleString()} / UGX {loan.totalRepayable.toLocaleString()}
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
  );
}

export default function LoansScreen() {
  const router = useRouter();
  const { loans, isLoading } = useMyLoansViewModel();
  const [activeTab, setActiveTab] = useState<Tab>("All");

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

  const filtered = loans.filter((l) => matchesTab(l.status, activeTab));

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

        {loans.length === 0 ? (
          <Text style={styles.noLoanText}>You don't have any loans yet.</Text>
        ) : filtered.length === 0 ? (
          <Text style={styles.noLoanText}>No loans in this category.</Text>
        ) : (
          filtered.map((loan) => <LoanCard key={loan.id} loan={loan} />)
        )}

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
