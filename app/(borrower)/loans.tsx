import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, Typography, Spacing } from "../../src/theme";
import { Card, ProgressBar } from "../../src/components";
import { activeLoan } from "../../src/services";

export default function LoansScreen() {
  const loan = activeLoan;
  const progress = loan.paidInstalments / loan.totalInstalments;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>My Loans</Text>

      <Card style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Active Loan</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{loan.status}</Text>
          </View>
        </View>
        <Text style={styles.amount}>UGX {loan.amount.toLocaleString()}</Text>
        <Text style={styles.sub}>
          {loan.interestRate}%/mo · {loan.duration} months
        </Text>

        <View style={{ marginTop: Spacing.lg }}>
          <View style={styles.row}>
            <Text style={styles.label}>Payment Progress</Text>
            <Text style={styles.label}>
              {loan.paidInstalments}/{loan.totalInstalments}
            </Text>
          </View>
          <ProgressBar progress={progress} color={Colors.teal} />
        </View>

        <View style={[styles.row, { marginTop: Spacing.lg }]}>
          <Text style={styles.label}>Monthly Payment</Text>
          <Text style={styles.value}>
            UGX {loan.monthlyPayment.toLocaleString()}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Next Payment</Text>
          <Text style={styles.value}>May 1, 2025</Text>
        </View>
      </Card>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.lg,
  },
  title: {
    ...Typography.h2,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  card: { marginBottom: Spacing.lg },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  label: { ...Typography.small, color: Colors.textSecondary },
  amount: { ...Typography.h1, color: Colors.textPrimary, marginBottom: 4 },
  sub: { ...Typography.body, color: Colors.textSecondary },
  badge: {
    backgroundColor: Colors.tealLight,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    ...Typography.caption,
    color: Colors.tealDark,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  value: { ...Typography.bodyMedium, color: Colors.textPrimary },
});
