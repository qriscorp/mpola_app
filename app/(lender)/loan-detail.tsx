import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, BorderRadius } from "../../src/theme";
import {
  Badge,
  ProgressBar,
  SkeletonCard,
  SkeletonList,
  RequiredDocumentsChecklist,
} from "../../src/components";
import { fetchLoanDetail } from "../../src/services";
import { formatDuration } from "../../src/services/duration";

export default function LoanDetailScreen() {
  const router = useRouter();
  const { loanId } = useLocalSearchParams<{ loanId: string }>();

  const { data: loan, isLoading, error } = useQuery({
    queryKey: ["lender", "loan-detail", loanId],
    queryFn: () => fetchLoanDetail(loanId!),
    enabled: !!loanId,
  });

  if (!loanId || error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: Spacing.lg }}>
          <Text style={{ color: Colors.textMuted }}>
            {error ? "This loan couldn't be found." : "No loan selected."}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading || !loan) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.lg }}>
          <SkeletonCard height={160} />
          <SkeletonList count={3} cardHeight={64} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const borrowerName = loan.borrowerName ?? "Unknown";
  const progress = loan.totalInstalments
    ? loan.paidInstalments / loan.totalInstalments
    : 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Loan Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Borrower Info */}
        <View style={styles.borrowerSection}>
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarText}>{borrowerName[0]}</Text>
          </View>
          <View>
            <Text style={styles.borrowerName}>{borrowerName}</Text>
            <Text style={styles.borrowerMeta}>#{loan.id.slice(0, 8)}</Text>
          </View>
          <View style={{ flex: 1 }} />
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

        {/* Loan Summary */}
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Loan Amount</Text>
            <Text style={styles.cardValue}>
              UGX {loan.amount.toLocaleString()}
            </Text>
          </View>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Interest Rate</Text>
            <Text style={styles.cardValue}>{loan.interestRate}%/month</Text>
          </View>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Duration</Text>
            <Text style={styles.cardValue}>{formatDuration(loan.duration, loan.durationDays)}</Text>
          </View>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>
              {loan.durationDays != null ? "Repayment Due" : "Monthly Payment"}
            </Text>
            <Text style={styles.cardValue}>
              UGX {loan.monthlyPayment.toLocaleString()}
            </Text>
          </View>
          <View style={[styles.cardRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.cardLabel}>Total Repayable</Text>
            <Text style={[styles.cardValue, { color: Colors.gold }]}>
              UGX {loan.totalRepayable.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Borrower Contact */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Borrower &amp; Terms</Text>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Phone</Text>
            <Text style={styles.cardValue}>{loan.borrowerPhone ?? "—"}</Text>
          </View>
          <View style={[styles.cardRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.cardLabel}>Email</Text>
            <Text style={styles.cardValue}>{loan.borrowerEmail ?? "—"}</Text>
          </View>
          {loan.borrowerNote && (
            <View style={styles.noteBox}>
              <Text style={styles.noteLabel}>Note from borrower</Text>
              <Text style={styles.noteText}>&ldquo;{loan.borrowerNote}&rdquo;</Text>
            </View>
          )}
        </View>

        {/* Guarantors */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Guarantors ({loan.guarantors.length})</Text>
          {loan.guarantors.length === 0 ? (
            <Text style={styles.emptyText}>No guarantors on this loan.</Text>
          ) : (
            loan.guarantors.map((g, i) => (
              <View
                key={g.id}
                style={[
                  styles.cardRow,
                  i === loan.guarantors.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <View>
                  <Text style={styles.cardValue}>{g.fullName ?? g.username}</Text>
                  <Text style={styles.borrowerMeta}>
                    {g.relationshipType ?? "—"} · @{g.username}
                  </Text>
                </View>
                <Badge
                  label={g.status}
                  variant={
                    g.status === "accepted"
                      ? "success"
                      : g.status === "declined"
                        ? "danger"
                        : "warning"
                  }
                />
              </View>
            ))
          )}
        </View>

        {/* Documents */}
        {loan.requiredDocumentsStatus.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Documents Provided</Text>
            <RequiredDocumentsChecklist items={loan.requiredDocumentsStatus} readOnly />
          </View>
        )}

        {/* Repayment Progress */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Repayment Progress</Text>
          <View style={styles.progressLabelRow}>
            <Text style={styles.progressLabel}>
              {loan.paidInstalments} of {loan.totalInstalments} payments
            </Text>
            <Text style={styles.progressPercent}>
              {Math.round(progress * 100)}%
            </Text>
          </View>
          <ProgressBar
            progress={progress}
            color={loan.status === "overdue" ? Colors.danger : Colors.gold}
          />
        </View>

        {/* Repayment History */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Repayment History</Text>
          {loan.repayments.length === 0 ? (
            <Text style={styles.emptyText}>
              No repayments have been made on this loan yet.
            </Text>
          ) : (
            loan.repayments.map((r, i) => (
              <View
                key={r.id}
                style={[
                  styles.scheduleRow,
                  i === loan.repayments.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <Text style={styles.scheduleNum}>#{r.instalmentNumber}</Text>
                <Text style={styles.scheduleAmount}>
                  UGX {r.amount.toLocaleString()}
                </Text>
                {r.status === "completed" ? (
                  <View style={styles.paidBadge}>
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color={Colors.success}
                    />
                    <Text style={styles.paidText}>Paid</Text>
                  </View>
                ) : r.status === "failed" ? (
                  <View style={styles.paidBadge}>
                    <Ionicons
                      name="alert-circle"
                      size={16}
                      color={Colors.danger}
                    />
                    <Text style={[styles.paidText, { color: Colors.danger }]}>
                      Failed
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.pendingText}>Pending</Text>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>
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
  scroll: { padding: Spacing.lg, paddingBottom: 40 },
  borrowerSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  avatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.gold + "25",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  avatarText: { ...Typography.h4, color: Colors.gold },
  borrowerName: { ...Typography.h4, color: Colors.textPrimary },
  borrowerMeta: {
    ...Typography.small,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cardLabel: { ...Typography.body, color: Colors.textSecondary },
  cardValue: { ...Typography.bodyMedium, color: Colors.textPrimary },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  progressLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
  },
  progressLabel: { ...Typography.small, color: Colors.textSecondary },
  progressPercent: { ...Typography.smallMedium, color: Colors.textPrimary },
  scheduleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  scheduleNum: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    width: 30,
  },
  scheduleAmount: { ...Typography.body, color: Colors.textPrimary, flex: 1 },
  paidBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  paidText: { ...Typography.smallMedium, color: Colors.success },
  pendingText: { ...Typography.smallMedium, color: Colors.textMuted },
  emptyText: { ...Typography.body, color: Colors.textMuted },
  noteBox: {
    backgroundColor: Colors.surfaceLift,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  noteLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  noteText: { ...Typography.small, color: Colors.textPrimary, fontStyle: "italic" },
});
