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
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, useScaledTypography } from "../../src/theme";
import { Card, StatCard, SkeletonStatRow, SkeletonCard } from "../../src/components";
import { useEarningsViewModel } from "../../src/viewmodels";
import { formatCompactUGX } from "../../src/services/currency";

export default function EarningsScreen() {
  const router = useRouter();
  const { earnings, monthly, isLoading } = useEarningsViewModel();
  const typography = useScaledTypography();
  const styles = useMemo(() => makeStyles(typography), [typography]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.xl }}>
          <SkeletonStatRow count={4} />
          <SkeletonCard height={220} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Earnings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {earnings?.concentrationWarning && (
          <View style={styles.warningBanner}>
            <Ionicons name="warning-outline" size={18} color={Colors.warning} />
            <Text style={styles.warningText}>
              <Text style={{ fontWeight: "700" }}>{earnings.concentrationWarning.pct}%</Text> of
              your active lending is concentrated in{" "}
              {earnings.concentrationWarning.type === "borrower"
                ? `one borrower (${earnings.concentrationWarning.label})`
                : `one loan type (${earnings.concentrationWarning.label})`}
              {" "}— consider diversifying.
            </Text>
          </View>
        )}

        {/* Summary Stats */}
        <View style={styles.statsRow}>
          <StatCard
            label="Total Earned"
            value={`UGX ${formatCompactUGX(earnings?.totalEarned)}`}
            color={Colors.gold}
          />
          <View style={{ width: Spacing.sm }} />
          <StatCard
            label="This Month"
            value={`UGX ${formatCompactUGX(earnings?.thisMonthEarned)}`}
            color={Colors.teal}
          />
        </View>
        <View style={styles.statsRow}>
          <StatCard
            label="Avg Yield"
            value={`${(earnings?.avgYield ?? 0).toFixed(1)}%`}
            color={Colors.teal}
          />
          <View style={{ width: Spacing.sm }} />
          <StatCard
            label="Active Loans"
            value={String(earnings?.activeLoans ?? 0)}
            color={Colors.gold}
          />
        </View>

        {/* Monthly Chart */}
        <Card style={styles.chartCard}>
          <Text style={styles.chartTitle}>Monthly Earnings</Text>
          {monthly.length === 0 ? (
            <Text style={styles.emptyText}>No earnings recorded yet.</Text>
          ) : (
            <View style={styles.chartContainer}>
              {monthly.map((m) => {
                const maxAmount = Math.max(...monthly.map((e) => e.amount), 1);
                const barHeight = (m.amount / maxAmount) * 120;
                return (
                  <View key={m.month} style={styles.barCol}>
                    <View
                      style={[
                        styles.bar,
                        { height: Math.max(4, barHeight), backgroundColor: Colors.gold },
                      ]}
                    />
                    <Text style={styles.barLabel}>
                      {new Date(`${m.month}-01`).toLocaleString("en-US", {
                        month: "short",
                      })}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </Card>
      </ScrollView>
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
      paddingVertical: Spacing.md,
    },
    headerTitle: { ...typography.h3, color: Colors.white },
    scroll: { padding: Spacing.lg, paddingBottom: 40 },
    statsRow: { flexDirection: "row", marginBottom: Spacing.lg },
    warningBanner: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: Spacing.sm,
      backgroundColor: Colors.warningBg,
      borderRadius: 12,
      padding: Spacing.md,
      marginBottom: Spacing.lg,
    },
    warningText: { ...typography.small, color: Colors.warningLight, flex: 1 },
    chartCard: { backgroundColor: Colors.surface, marginBottom: Spacing.lg },
    chartTitle: {
      ...typography.h4,
      color: Colors.white,
      marginBottom: Spacing.lg,
    },
    chartContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
      height: 150,
      paddingTop: Spacing.lg,
    },
    barCol: { alignItems: "center", flex: 1 },
    bar: { width: 24, borderRadius: 4, minHeight: 4 },
    barLabel: {
      ...typography.caption,
      color: Colors.textMuted,
      marginTop: Spacing.xs,
    },
    emptyText: {
      ...typography.body,
      color: Colors.textMuted,
      textAlign: "center",
      paddingVertical: Spacing.xl,
    },
  });
}
