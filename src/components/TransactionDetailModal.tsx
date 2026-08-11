import React from "react";
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Colors, Typography, Spacing, BorderRadius } from "../theme";
import { fetchTransactionDetail } from "../services";
import { formatDuration } from "../services/duration";
import type { TransactionType } from "../models";

const TYPE_LABEL: Record<TransactionType, string> = {
  deposit: "Deposit",
  withdrawal: "Withdrawal",
  repayment: "Loan Repayment",
  disbursement: "Loan Disbursement",
  top_up: "Top-up",
};

const CREDIT_TYPES = new Set<TransactionType>(["deposit", "disbursement", "top_up"]);

const FEE_CATEGORY_LABEL: Record<string, string> = {
  mobile_money_withdrawal: "Mobile money withdrawal fee",
  bank_withdrawal: "Bank transfer fee",
  loan_disbursement: "Disbursement fee",
  loan_repayment: "Repayment fee",
};

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-UG", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, mono && styles.rowValueMono]} numberOfLines={mono ? 1 : undefined}>
        {value}
      </Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export function TransactionDetailModal({
  transactionId,
  onClose,
}: {
  transactionId: string | null;
  onClose: () => void;
}) {
  const { data: tx, isLoading } = useQuery({
    queryKey: ["transaction-detail", transactionId],
    queryFn: () => fetchTransactionDetail(transactionId as string),
    enabled: !!transactionId,
  });

  return (
    <Modal
      visible={!!transactionId}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Transaction Details</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          {isLoading || !tx ? (
            <View style={styles.loading}>
              <ActivityIndicator color={Colors.teal} />
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
              <View style={styles.hero}>
                <Text
                  style={[
                    styles.heroAmount,
                    { color: CREDIT_TYPES.has(tx.type) ? Colors.success : Colors.warning },
                  ]}
                >
                  {CREDIT_TYPES.has(tx.type) ? "+" : "-"}UGX {tx.amount.toLocaleString()}
                </Text>
                <Text style={styles.heroDesc}>{tx.description || TYPE_LABEL[tx.type]}</Text>
                <View style={styles.badgeRow}>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{TYPE_LABEL[tx.type]}</Text>
                  </View>
                  <View
                    style={[
                      styles.badge,
                      tx.status === "completed"
                        ? { backgroundColor: Colors.successBg }
                        : tx.status === "pending"
                          ? { backgroundColor: Colors.surfaceLift }
                          : { backgroundColor: Colors.dangerBg },
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        {
                          color:
                            tx.status === "completed"
                              ? Colors.success
                              : tx.status === "pending"
                                ? Colors.textMuted
                                : Colors.danger,
                        },
                      ]}
                    >
                      {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                    </Text>
                  </View>
                </View>
              </View>

              <Section title="Transaction Info">
                <Row label="Transaction ID" value={tx.id} mono />
                {tx.reference && <Row label="Reference" value={tx.reference} mono />}
                <Row label="Date & Time" value={formatDateTime(tx.createdAt)} />
                {tx.counterparty && !tx.loan && <Row label="Counterparty" value={tx.counterparty} />}
              </Section>

              <Section title="Charges">
                {tx.totalFee != null ? (
                  <>
                    {tx.feeCategory && (
                      <Row label="Fee type" value={FEE_CATEGORY_LABEL[tx.feeCategory] ?? tx.feeCategory} />
                    )}
                    {tx.platformFee != null && tx.platformFee > 0 && (
                      <Row label="Platform fee" value={`UGX ${tx.platformFee.toLocaleString()}`} />
                    )}
                    {tx.providerFee != null && tx.providerFee > 0 && (
                      <Row label="Provider fee" value={`UGX ${tx.providerFee.toLocaleString()}`} />
                    )}
                    <Row label="Total charged" value={`UGX ${tx.totalFee.toLocaleString()}`} />
                  </>
                ) : (
                  <Row label="Platform fee" value="No fee on this transaction" />
                )}
              </Section>

              {tx.loan && (
                <Section title="Loan Details">
                  <Row label="Loan ID" value={tx.loan.id} mono />
                  <Row label="Principal" value={`UGX ${tx.loan.amount.toLocaleString()}`} />
                  <Row label="Interest Rate" value={`${tx.loan.interestRate}%/month`} />
                  <Row label="Duration" value={formatDuration(tx.loan.duration, tx.loan.durationDays)} />
                  <Row label="Status" value={tx.loan.status.charAt(0).toUpperCase() + tx.loan.status.slice(1)} />
                  {tx.loan.borrowerName && <Row label="Borrower" value={tx.loan.borrowerName} />}
                  {tx.loan.lenderName && <Row label="Lender" value={tx.loan.lenderName} />}
                  {tx.repayment && (
                    <Row
                      label="Instalment"
                      value={`#${tx.repayment.instalmentNumber} of ${tx.loan.totalInstalments}`}
                    />
                  )}
                  <Row
                    label="Repaid so far"
                    value={`UGX ${tx.loan.totalPaid.toLocaleString()} of UGX ${tx.loan.totalRepayable.toLocaleString()}`}
                  />
                </Section>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: "85%",
    paddingTop: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { ...Typography.h4, color: Colors.textPrimary },
  loading: { paddingVertical: Spacing.xxxl, alignItems: "center" },
  body: { padding: Spacing.lg, paddingBottom: 40, gap: Spacing.md },
  hero: { alignItems: "center", paddingVertical: Spacing.md },
  heroAmount: { fontSize: 30, fontWeight: "800" },
  heroDesc: { ...Typography.body, color: Colors.textSecondary, marginTop: 4, textAlign: "center" },
  badgeRow: { flexDirection: "row", gap: Spacing.sm, marginTop: Spacing.sm },
  badge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceLift,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  badgeText: { ...Typography.caption, fontWeight: "600", color: Colors.textSecondary },
  section: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  sectionTitle: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: Spacing.xs,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: Spacing.xs,
    gap: Spacing.md,
  },
  rowLabel: { ...Typography.small, color: Colors.textMuted, flexShrink: 0 },
  rowValue: { ...Typography.smallMedium, color: Colors.textPrimary, flexShrink: 1, textAlign: "right" },
  rowValueMono: { fontFamily: "monospace", fontSize: 11 },
});
