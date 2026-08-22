import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, BorderRadius, useScaledTypography } from "../../src/theme";
import { ProgressBar, SkeletonCard } from "../../src/components";
import { useRepaymentScheduleViewModel } from "../../src/viewmodels";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-UG", { day: "numeric", month: "short", year: "numeric" });
}

export default function RepaymentScheduleScreen() {
  const router = useRouter();
  const typography = useScaledTypography();
  const styles = useMemo(() => makeStyles(typography), [typography]);
  const { loan, rows, outstanding, progressPct, remaining, isLoading } =
    useRepaymentScheduleViewModel();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Go back" accessibilityRole="button">
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Repayment Schedule</Text>
        <View style={{ width: 24 }} />
      </View>

      {isLoading ? (
        <View style={styles.scroll}>
          <SkeletonCard height={140} style={{ marginBottom: Spacing.lg }} />
          <SkeletonCard height={220} />
        </View>
      ) : !loan ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>You don&apos;t have an active loan yet.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.heroCard}>
            <Text style={styles.heroLabel}>OUTSTANDING BALANCE</Text>
            <Text style={styles.heroAmount}>UGX {outstanding.toLocaleString()}</Text>
            <ProgressBar progress={progressPct / 100} color={Colors.white} height={6} />
            <Text style={styles.heroSub}>
              {progressPct}% repaid · {remaining} payment{remaining === 1 ? "" : "s"} remaining
            </Text>
          </View>

          <View style={styles.tableCard}>
            {rows.length === 0 ? (
              <Text style={styles.emptyText}>No instalments recorded yet.</Text>
            ) : (
              rows.map((row) => (
                <View
                  key={row.key}
                  style={[styles.row, row.status === "due" && styles.rowDue]}
                >
                  <Text style={styles.rowNum}>#{row.num}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowDate}>{formatDate(row.date)}</Text>
                    <Text style={styles.rowAmount}>UGX {row.amount.toLocaleString()}</Text>
                  </View>
                  {row.status === "paid" ? (
                    <View style={styles.paidBadge}>
                      <Text style={styles.paidBadgeText}>Paid</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.payBtn}
                      onPress={() => router.push("/(borrower)/payment")}
                    >
                      <Text style={styles.payBtnText}>Pay Now</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function makeStyles(typography: ReturnType<typeof useScaledTypography>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.lg,
    },
    headerTitle: { ...typography.h3, color: Colors.white },
    scroll: { padding: Spacing.lg, paddingBottom: 136 },
    emptyState: { flex: 1, alignItems: "center", justifyContent: "center", padding: Spacing.xl },
    emptyText: { ...typography.body, color: Colors.textMuted, textAlign: "center" },
    heroCard: {
      backgroundColor: Colors.teal,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.lg,
    },
    heroLabel: { ...typography.caption, color: "rgba(255,255,255,0.75)", marginBottom: 4 },
    heroAmount: { ...typography.h1, color: Colors.white, marginBottom: Spacing.md },
    heroSub: { ...typography.small, color: "rgba(255,255,255,0.8)", marginTop: Spacing.sm },
    tableCard: {
      backgroundColor: Colors.surface,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
    rowDue: { backgroundColor: Colors.warningBg, borderRadius: BorderRadius.md },
    rowNum: { ...typography.smallMedium, color: Colors.textMuted, width: 28 },
    rowDate: { ...typography.small, color: Colors.textSecondary },
    rowAmount: { ...typography.bodyMedium, color: Colors.textPrimary, marginTop: 2 },
    paidBadge: {
      backgroundColor: Colors.tealLight,
      borderRadius: BorderRadius.full,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 4,
    },
    paidBadgeText: { ...typography.caption, color: Colors.teal, fontWeight: "600" },
    payBtn: {
      backgroundColor: Colors.teal,
      borderRadius: BorderRadius.md,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
    },
    payBtnText: { ...typography.smallMedium, color: Colors.white, fontWeight: "700" },
  });
}
