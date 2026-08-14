import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, BorderRadius } from "../../src/theme";
import { Button, Card, Input, SkeletonCard, WalletDepositModal } from "../../src/components";
import { usePaymentViewModel } from "../../src/viewmodels";
import { formatDuration } from "../../src/services/duration";

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-UG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDueDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-UG", { day: "numeric", month: "short" });
}

export default function PaymentScreen() {
  const router = useRouter();
  const vm = usePaymentViewModel();

  if (vm.loanLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.lg }}>
          <SkeletonCard height={100} />
          <SkeletonCard height={60} />
          <SkeletonCard height={160} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!vm.loan) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Make a Payment</Text>
          <View style={{ width: 24 }} />
        </View>
        <Text style={styles.noLoanText}>You don't have an active loan.</Text>
      </SafeAreaView>
    );
  }

  const isBulletLoan = vm.loan.durationDays != null;
  const progressPct = vm.loan.totalRepayable
    ? Math.min(100, Math.round(((vm.loan.totalPaid ?? 0) / vm.loan.totalRepayable) * 100))
    : 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Make a Payment</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Loan Summary */}
        <Card style={{ marginBottom: Spacing.lg }}>
          <Text style={styles.summaryTitle}>Loan Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Principal</Text>
              <Text style={styles.summaryValue}>
                UGX {vm.loan.amount.toLocaleString()}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Duration</Text>
              <Text style={styles.summaryValue}>
                {formatDuration(vm.loan.duration, vm.loan.durationDays)}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Interest Rate</Text>
              <Text style={styles.summaryValue}>{vm.loan.interestRate}%/month</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Disbursed</Text>
              <Text style={styles.summaryValue}>{formatDate(vm.loan.disbursedAt)}</Text>
            </View>
          </View>

          <View style={styles.progressWrap}>
            <View style={styles.progressLabelRow}>
              <Text style={styles.progressLabel}>
                {isBulletLoan
                  ? "Repaid so far"
                  : `Instalments paid: ${vm.loan.paidInstalments} of ${vm.loan.totalInstalments}`}
              </Text>
              <Text style={styles.progressValue}>
                UGX {(vm.loan.totalPaid ?? 0).toLocaleString()} / UGX{" "}
                {vm.loan.totalRepayable.toLocaleString()}
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
            </View>
          </View>
        </Card>

        {/* Amount Due Card */}
        <Card style={styles.amountCard}>
          <Text style={styles.amountLabel}>
            {isBulletLoan ? "Repayment Due" : "Amount Due"}
          </Text>
          <Text style={styles.amountValue}>
            UGX {vm.dueAmount.toLocaleString()}
          </Text>
          <Text style={styles.amountSub}>
            {isBulletLoan
              ? `Due ${formatDueDate(vm.dueDate)}`
              : `Instalment ${vm.instalmentNumber} of ${vm.totalInstalments} · Due ${formatDueDate(vm.dueDate)}`}
          </Text>
        </Card>

        <Text style={styles.sectionLabel}>How much would you like to pay?</Text>
        <View style={styles.payModeRow}>
          <TouchableOpacity
            style={[
              styles.payModeCard,
              vm.payMode === "instalment" && styles.payModeCardActive,
            ]}
            onPress={() => vm.setAmountInput(String(vm.dueAmount))}
          >
            <Text style={styles.payModeLabel}>Pay this instalment</Text>
            <Text style={styles.payModeValue}>
              UGX {vm.dueAmount.toLocaleString()}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.payModeCard}
            onPress={() => vm.setAmountInput(String(Math.round(vm.dueAmount / 2)))}
          >
            <Text style={styles.payModeLabel}>Pay half now</Text>
            <Text style={styles.payModeValue}>
              UGX {Math.round(vm.dueAmount / 2).toLocaleString()}
            </Text>
          </TouchableOpacity>
          {vm.showPayoffOption && (
            <TouchableOpacity
              style={[
                styles.payModeCard,
                vm.payMode === "full" && styles.payModeCardActive,
              ]}
              onPress={() => vm.setAmountInput(String(vm.remainingBalance))}
            >
              <Text style={styles.payModeLabel}>Pay off full balance</Text>
              <Text style={styles.payModeValue}>
                UGX {vm.remainingBalance.toLocaleString()}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Wallet Balance */}
        <Text style={styles.sectionLabel}>Paying From</Text>
        <Card style={styles.balanceCard}>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Wallet Balance</Text>
            <Text style={styles.balanceValue}>
              UGX {vm.walletBalance.toLocaleString()}
            </Text>
          </View>
          <Text
            style={[
              styles.sufficientText,
              { color: vm.sufficient ? Colors.success : Colors.danger },
            ]}
          >
            {vm.sufficient ? "Sufficient ✓" : "Insufficient funds"}
          </Text>
        </Card>

        {!vm.sufficient && (
          <View style={styles.insufficientBanner}>
            <Text style={styles.insufficientText}>
              Your wallet balance is too low for this payment. Deposit at
              least UGX {vm.shortfall.toLocaleString()} more to continue.
            </Text>
            <TouchableOpacity
              style={styles.depositBtn}
              onPress={() => vm.setDepositModalVisible(true)}
            >
              <Text style={styles.depositBtnText}>Deposit Funds</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Amount */}
        <Input
          label="Amount to Pay"
          value={vm.amountInput}
          onChangeText={vm.setAmountInput}
          placeholder={String(vm.dueAmount)}
          keyboardType="numeric"
        />
        <Text style={styles.amountHint}>
          You can pay this instalment in full, pay part of it now and cover the rest before the
          due date, or pay off your whole remaining balance in one go — whichever suits you.
          Whatever&apos;s left after your payment stays as your next payment amount; if it&apos;s
          still unpaid after the due date, a late fee applies to just that remaining balance, not
          the full instalment. You can&apos;t pay more than what you actually owe on this loan.
        </Text>
        {vm.exceedsBalance && (
          <Text style={styles.amountError}>
            That&apos;s more than your remaining balance of UGX {vm.remainingBalance.toLocaleString()}.
            Lower the amount or use &quot;Pay off full balance&quot; above.
          </Text>
        )}

        {/* Breakdown */}
        <Card style={{ marginBottom: Spacing.xxl, marginTop: Spacing.lg }}>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Payment Amount</Text>
            <Text style={styles.breakdownValue}>
              UGX {vm.amount.toLocaleString()}
            </Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Platform Fee (0.5%)</Text>
            <Text style={styles.breakdownValue}>
              UGX {vm.processingFee.toLocaleString()}
            </Text>
          </View>
          <View style={[styles.breakdownRow, styles.breakdownTotal]}>
            <Text style={styles.breakdownTotalLabel}>Total Deducted</Text>
            <Text style={styles.breakdownTotalValue}>
              UGX {vm.totalDeducted.toLocaleString()}
            </Text>
          </View>
        </Card>

        <Button
          title="Confirm Payment ✓"
          onPress={async () => {
            try {
              const result = await vm.confirmPayment();
              router.push({
                pathname: "/(borrower)/payment-success",
                params: {
                  repaymentId: result.repaymentId,
                  transactionId: result.transactionId,
                  amount: String(result.amount),
                  paymentMethod: result.paymentMethod,
                  instalmentNumber: String(result.instalmentNumber),
                  totalInstalments: String(vm.totalInstalments),
                  date: result.date,
                },
              });
            } catch (e) {
              router.push({
                pathname: "/(borrower)/payment-failed",
                params: {
                  reason: e instanceof Error ? e.message : "Please try again.",
                  amount: String(vm.amount),
                  paymentMethod: "wallet",
                  loanId: vm.loan?.id ?? "",
                },
              });
            }
          }}
          color={Colors.teal}
          loading={vm.loading}
          disabled={!vm.sufficient || vm.exceedsBalance}
        />

        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.cancelBtn}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>

      <WalletDepositModal
        visible={vm.depositModalVisible}
        onClose={() => vm.setDepositModalVisible(false)}
        onDepositMobileMoney={vm.depositMobileMoney}
        onDepositCard={vm.depositWithCard}
        isSubmittingMobileMoney={vm.isDepositingMobileMoney}
        isSubmittingCard={vm.isDepositingWithCard}
        accentColor={Colors.teal}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerTitle: { ...Typography.h3, color: Colors.white },
  noLoanText: {
    ...Typography.body,
    color: Colors.textMuted,
    textAlign: "center",
    marginTop: Spacing.xxl,
  },
  scroll: { padding: Spacing.lg, paddingBottom: 40 },
  summaryTitle: { ...Typography.h4, color: Colors.textPrimary, marginBottom: Spacing.md },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.lg,
  },
  summaryItem: { width: "45%" },
  summaryLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  summaryValue: { ...Typography.bodySemibold, color: Colors.textPrimary, marginTop: 2 },
  progressWrap: { marginTop: Spacing.lg },
  progressLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
  },
  progressLabel: { ...Typography.small, color: Colors.textMuted, flexShrink: 1 },
  progressValue: { ...Typography.smallMedium, color: Colors.textPrimary },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.surfaceLift,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 3, backgroundColor: Colors.teal },
  amountCard: {
    backgroundColor: Colors.teal,
    alignItems: "center",
    marginBottom: Spacing.xxl,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
  },
  payModeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  payModeCard: {
    flexBasis: "45%",
    flexGrow: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surface,
    padding: Spacing.md,
  },
  payModeCardActive: {
    borderColor: Colors.teal,
    backgroundColor: Colors.tealLight,
  },
  payModeLabel: { ...Typography.small, color: Colors.textSecondary },
  payModeValue: { ...Typography.bodySemibold, color: Colors.textPrimary, marginTop: 4 },
  amountLabel: {
    ...Typography.caption,
    color: Colors.white,
    opacity: 0.8,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  amountValue: {
    fontSize: 32,
    fontWeight: "800",
    color: Colors.white,
    marginTop: 4,
  },
  amountSub: {
    ...Typography.small,
    color: Colors.white,
    opacity: 0.7,
    marginTop: 4,
  },
  amountHint: {
    ...Typography.small,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  amountError: {
    ...Typography.small,
    color: Colors.danger,
    fontWeight: "600",
    marginTop: Spacing.xs,
  },
  sectionLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: Spacing.md,
  },
  balanceCard: { marginBottom: Spacing.md },
  balanceRow: { flexDirection: "row", justifyContent: "space-between" },
  balanceLabel: { ...Typography.body, color: Colors.textSecondary },
  balanceValue: { ...Typography.bodyMedium, color: Colors.textPrimary },
  sufficientText: { ...Typography.smallMedium, marginTop: 4 },
  insufficientBanner: {
    backgroundColor: Colors.warningBg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  insufficientText: { ...Typography.small, color: Colors.warning },
  depositBtn: {
    alignSelf: "flex-start",
    backgroundColor: Colors.warning,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  depositBtnText: { ...Typography.buttonSmall, color: Colors.navyDark },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  breakdownLabel: { ...Typography.body, color: Colors.textSecondary },
  breakdownValue: { ...Typography.body, color: Colors.textPrimary },
  breakdownTotal: { borderBottomWidth: 0, paddingTop: Spacing.md },
  breakdownTotalLabel: { ...Typography.bodyMedium, color: Colors.textPrimary },
  breakdownTotalValue: { ...Typography.h4, color: Colors.textPrimary },
  cancelBtn: { alignItems: "center", marginTop: Spacing.lg },
  cancelText: { ...Typography.body, color: Colors.textSecondary },
});
