import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, BorderRadius } from "../../src/theme";
import {
  Badge,
  ProgressBar,
  StatCard,
  SkeletonStatRow,
  SkeletonList,
  RequiredDocumentsChecklist,
} from "../../src/components";
import { usePortfolioViewModel } from "../../src/viewmodels";
import { calcPlatformFee } from "../../src/services/fees";
import { formatDuration } from "../../src/services/duration";
import { formatCompactUGX } from "../../src/services/currency";

export default function PortfolioScreen() {
  const router = useRouter();
  const [expandedLoanId, setExpandedLoanId] = useState<string | null>(null);
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
    approveDisbursement,
    approvingDisbursement,
  } = usePortfolioViewModel();

  const handleApprove = async (loanId: string) => {
    try {
      await approveDisbursement(loanId);
      Alert.alert("Disbursed", "Funds have been sent to the borrower's wallet.");
    } catch (e: any) {
      Alert.alert("Couldn't disburse", e?.message || "Please try again.");
    }
  };

  const confirmApprove = (
    loanId: string,
    borrowerName: string,
    amount: number,
    interestRate: number,
    duration: number | null,
    durationDays: number | null,
    totalRepayable: number,
  ) => {
    const platformFee = calcPlatformFee(amount);
    const totalDebit = amount + platformFee;
    const totalInterest = totalRepayable - amount;
    Alert.alert(
      "Approve disbursement?",
      `This sends UGX ${amount.toLocaleString()} from your wallet to ${borrowerName} right now. This can't be undone.\n\n` +
        `Loan amount: UGX ${amount.toLocaleString()}\n` +
        `Platform fee (0.5%): UGX ${platformFee.toLocaleString()}\n` +
        `Total debited from your wallet: UGX ${totalDebit.toLocaleString()}\n\n` +
        `WHAT YOU'LL EARN BACK\n` +
        `Interest rate: ${interestRate}%/month\n` +
        `Term: ${formatDuration(duration, durationDays)}\n` +
        `Total interest: UGX ${totalInterest.toLocaleString()}\n` +
        `Total repayable to you: UGX ${totalRepayable.toLocaleString()}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, disburse",
          style: "destructive",
          onPress: () => handleApprove(loanId),
        },
      ],
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.xl }}>
          <SkeletonStatRow count={4} />
          <SkeletonList count={3} cardHeight={130} />
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
        <Text style={styles.title}>Portfolio</Text>

        {/* Summary Stats */}
        <View style={styles.statsRow}>
          <StatCard
            label="Total Lent"
            value={formatCompactUGX(totalLent)}
            color={Colors.gold}
          />
          <View style={{ width: Spacing.sm }} />
          <StatCard
            label="Total Earned"
            value={formatCompactUGX(totalEarned)}
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
                {f === "all"
                  ? "All"
                  : f === "pending_disbursement"
                    ? "Awaiting Approval"
                    : f.charAt(0).toUpperCase() + f.slice(1)}
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
                  UGX {loan.amount.toLocaleString()} • {loan.interestRate}%/month
                </Text>
              </View>
              <Badge
                label={loan.status === "pending_disbursement" ? "awaiting approval" : loan.status}
                variant={
                  loan.status === "pending_disbursement"
                    ? "warning"
                    : loan.status === "active"
                      ? "success"
                      : loan.status === "overdue"
                        ? "danger"
                        : "default"
                }
              />
            </View>

            {loan.status === "pending_disbursement" ? (
              <>
                <Text style={styles.pendingNote}>
                  Not disbursed yet — approve to release funds to the borrower.
                </Text>
                {loan.requiredDocumentsStatus.length > 0 && (
                  <View style={styles.docsSection}>
                    <TouchableOpacity
                      style={styles.docsToggle}
                      onPress={() =>
                        setExpandedLoanId(
                          expandedLoanId === loan.id ? null : loan.id,
                        )
                      }
                    >
                      <Text style={styles.docsToggleText}>
                        {expandedLoanId === loan.id ? "Hide documents" : "Review documents"}
                      </Text>
                      <Ionicons
                        name={expandedLoanId === loan.id ? "chevron-up" : "chevron-down"}
                        size={14}
                        color={Colors.teal}
                      />
                    </TouchableOpacity>
                    {expandedLoanId === loan.id && (
                      <View style={styles.docsChecklist}>
                        <RequiredDocumentsChecklist
                          items={loan.requiredDocumentsStatus}
                          readOnly
                        />
                      </View>
                    )}
                  </View>
                )}
              </>
            ) : (
              <View style={styles.progressSection}>
                <View style={styles.progressLabelRow}>
                  <Text style={styles.progressLabel}>
                    UGX {(loan.totalPaid ?? 0).toLocaleString()} / UGX {loan.totalRepayable.toLocaleString()}
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
            )}

            {loan.status === "pending_disbursement" ? (
              <TouchableOpacity
                style={styles.approveBtn}
                disabled={approvingDisbursement}
                onPress={() =>
                  confirmApprove(
                    loan.id,
                    loan.borrowerName,
                    loan.amount,
                    loan.interestRate,
                    loan.duration,
                    loan.durationDays,
                    loan.totalRepayable,
                  )
                }
              >
                <Text style={styles.approveBtnText}>
                  {approvingDisbursement ? "Approving…" : "Approve Disbursement"}
                </Text>
              </TouchableOpacity>
            ) : (
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
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, paddingBottom: 40 },
  title: { ...Typography.h2, color: Colors.white, marginBottom: Spacing.lg },
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
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterTabActive: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  filterText: { ...Typography.smallMedium, color: Colors.textSecondary },
  filterTextActive: { color: Colors.white },
  loanCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.gold,
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
  pendingNote: {
    ...Typography.small,
    color: Colors.warning,
    marginBottom: Spacing.md,
  },
  docsSection: { marginBottom: Spacing.md },
  docsToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
  },
  docsToggleText: { ...Typography.smallMedium, color: Colors.teal },
  docsChecklist: { marginTop: Spacing.sm },
  approveBtn: {
    backgroundColor: Colors.success,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    alignItems: "center",
  },
  approveBtnText: { ...Typography.smallMedium, color: Colors.white },
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
