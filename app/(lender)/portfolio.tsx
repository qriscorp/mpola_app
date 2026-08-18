import React, { useMemo, useState } from "react";
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
import { Colors, Spacing, BorderRadius, useScaledTypography } from "../../src/theme";
import {
  Badge,
  ProgressBar,
  StatCard,
  SkeletonStatRow,
  SkeletonList,
  RequiredDocumentsChecklist,
  ConfirmModal,
  ConfirmDetailRow,
} from "../../src/components";
import { usePortfolioViewModel } from "../../src/viewmodels";
import { calcPlatformFee } from "../../src/services/fees";
import { formatDuration } from "../../src/services/duration";
import { formatCompactUGX } from "../../src/services/currency";

export default function PortfolioScreen() {
  const router = useRouter();
  const typography = useScaledTypography();
  const styles = useMemo(() => makeStyles(typography), [typography]);
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

  const [pendingApproval, setPendingApproval] = useState<{
    loanId: string;
    borrowerName: string;
    amount: number;
    interestRate: number;
    duration: number | null;
    durationDays: number | null;
    totalRepayable: number;
  } | null>(null);

  const handleApprove = async () => {
    if (!pendingApproval) return;
    try {
      await approveDisbursement(pendingApproval.loanId);
      setPendingApproval(null);
      Alert.alert("Disbursed", "Funds have been sent to the borrower's wallet.");
    } catch (e: any) {
      setPendingApproval(null);
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
    setPendingApproval({ loanId, borrowerName, amount, interestRate, duration, durationDays, totalRepayable });
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

      <ConfirmModal
        visible={!!pendingApproval}
        icon="cash-outline"
        title="Approve disbursement?"
        message={
          pendingApproval
            ? `This sends UGX ${pendingApproval.amount.toLocaleString()} from your wallet to ${pendingApproval.borrowerName} right now. This can't be undone.`
            : ""
        }
        confirmLabel="Yes, Disburse"
        accentColor={Colors.gold}
        loading={approvingDisbursement}
        onCancel={() => setPendingApproval(null)}
        onConfirm={handleApprove}
      >
        {pendingApproval && (() => {
          const platformFee = calcPlatformFee(pendingApproval.amount);
          const totalDebit = pendingApproval.amount + platformFee;
          const totalInterest = pendingApproval.totalRepayable - pendingApproval.amount;
          return (
            <>
              <ConfirmDetailRow label="Loan amount" value={`UGX ${pendingApproval.amount.toLocaleString()}`} />
              <ConfirmDetailRow label="Platform fee (0.5%)" value={`UGX ${platformFee.toLocaleString()}`} />
              <ConfirmDetailRow
                label="Total debited from your wallet"
                value={`UGX ${totalDebit.toLocaleString()}`}
                emphasis
              />
              <View style={{ height: Spacing.sm }} />
              <ConfirmDetailRow label="Interest rate" value={`${pendingApproval.interestRate}%/month`} />
              <ConfirmDetailRow label="Term" value={formatDuration(pendingApproval.duration, pendingApproval.durationDays)} />
              <ConfirmDetailRow label="Total interest" value={`UGX ${totalInterest.toLocaleString()}`} />
              <ConfirmDetailRow
                label="Total repayable to you"
                value={`UGX ${pendingApproval.totalRepayable.toLocaleString()}`}
                valueColor={Colors.gold}
                emphasis
              />
            </>
          );
        })()}
      </ConfirmModal>
    </SafeAreaView>
  );
}

function makeStyles(typography: ReturnType<typeof useScaledTypography>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    scroll: { padding: Spacing.lg, paddingBottom: 136 },
    title: { ...typography.h2, color: Colors.white, marginBottom: Spacing.lg },
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
    filterText: { ...typography.smallMedium, color: Colors.textSecondary },
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
    loanName: { ...typography.h4, color: Colors.textPrimary },
    loanMeta: { ...typography.small, color: Colors.textSecondary, marginTop: 2 },
    pendingNote: {
      ...typography.small,
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
    docsToggleText: { ...typography.smallMedium, color: Colors.teal },
    docsChecklist: { marginTop: Spacing.sm },
    approveBtn: {
      backgroundColor: Colors.success,
      borderRadius: BorderRadius.md,
      paddingVertical: Spacing.sm,
      alignItems: "center",
    },
    approveBtnText: { ...typography.smallMedium, color: Colors.white },
    progressSection: { marginBottom: Spacing.md },
    progressLabelRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: Spacing.xs,
    },
    progressLabel: { ...typography.small, color: Colors.textSecondary },
    progressPercent: { ...typography.smallMedium, color: Colors.textPrimary },
    loanFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    footerLabel: { ...typography.small, color: Colors.textMuted },
  });
}
