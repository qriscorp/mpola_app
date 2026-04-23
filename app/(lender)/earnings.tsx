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
import { Colors, Typography, Spacing, BorderRadius } from "../../src/theme";
import { Card, StatCard } from "../../src/components";
import { useEarningsViewModel } from "../../src/viewmodels";

export default function EarningsScreen() {
  const router = useRouter();
  const { stats, breakdown, monthly, isLoading } = useEarningsViewModel();

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
        {/* Summary Stats */}
        <View style={styles.statsRow}>
          <StatCard
            label="Total Earned"
            value={`UGX ${((stats?.totalEarned ?? 0) / 1000000).toFixed(1)}M`}
            color={Colors.gold}
          />
          <View style={{ width: Spacing.sm }} />
          <StatCard
            label="This Month"
            value={`UGX ${((stats?.thisMonthEarned ?? 0) / 1000).toFixed(0)}K`}
            color={Colors.teal}
          />
        </View>

        {/* Monthly Chart Placeholder */}
        <Card style={styles.chartCard}>
          <Text style={styles.chartTitle}>Monthly Earnings</Text>
          <View style={styles.chartContainer}>
            {monthly.map((m) => {
              const maxAmount = Math.max(...monthly.map((e) => e.amount));
              const barHeight =
                maxAmount > 0 ? (m.amount / maxAmount) * 120 : 0;
              return (
                <View key={m.month} style={styles.barCol}>
                  <View
                    style={[
                      styles.bar,
                      { height: barHeight, backgroundColor: Colors.gold },
                    ]}
                  />
                  <Text style={styles.barLabel}>{m.month}</Text>
                </View>
              );
            })}
          </View>
        </Card>

        {/* Per-Loan Earnings */}
        <Text style={styles.sectionTitle}>Earnings by Borrower</Text>
        {breakdown.map((item) => (
          <View key={item.borrowerName} style={styles.breakdownRow}>
            <View style={styles.breakdownAvatar}>
              <Text style={styles.breakdownInitial}>
                {item.borrowerName[0]}
              </Text>
            </View>
            <View style={styles.breakdownInfo}>
              <Text style={styles.breakdownName}>{item.borrowerName}</Text>
            </View>
            <Text style={styles.breakdownAmount}>
              UGX {item.totalEarnings.toLocaleString()}
            </Text>
          </View>
        ))}
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
  statsRow: { flexDirection: "row", marginBottom: Spacing.lg },
  chartCard: { backgroundColor: Colors.surface, marginBottom: Spacing.lg },
  chartTitle: {
    ...Typography.h4,
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
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  breakdownRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  breakdownAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gold + "25",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  breakdownInitial: { ...Typography.bodyMedium, color: Colors.gold },
  breakdownInfo: { flex: 1 },
  breakdownName: { ...Typography.bodyMedium, color: Colors.textPrimary },
  breakdownAmount: { ...Typography.bodySemibold, color: Colors.gold },
});
