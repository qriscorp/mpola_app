import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Colors, Typography, Spacing } from "../../src/theme";
import { Button, Card } from "../../src/components";

export default function LoanApprovedScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>🎉</Text>
        <Text style={styles.title}>Loan Approved!</Text>
        <Text style={styles.sub}>Funds will be disbursed within 24 hours</Text>

        <Card style={styles.amountCard}>
          <Text style={styles.youWillReceive}>YOU WILL RECEIVE</Text>
          <Text style={styles.amount}>UGX 2,000,000</Text>
          <Text style={styles.firstPayment}>First payment due May 1, 2025</Text>
        </Card>

        <Card style={styles.summaryCard}>
          <View style={styles.row}>
            <Text style={styles.label}>Lender</Text>
            <Text style={styles.value}>Joseph M.</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Rate</Text>
            <Text style={styles.value}>2.5%/month</Text>
          </View>
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <Text style={styles.label}>Monthly</Text>
            <Text style={styles.value}>UGX 354,000</Text>
          </View>
        </Card>

        <Button
          title="View Repayment Schedule →"
          onPress={() => router.push("/(borrower)/loans")}
          color={Colors.teal}
        />
        <View style={{ height: Spacing.md }} />
        <Button
          title="Dashboard"
          onPress={() => router.replace("/(borrower)/home")}
          variant="outline"
          color={Colors.teal}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing.xxl,
  },
  emoji: { fontSize: 48, textAlign: "center", marginBottom: Spacing.md },
  title: { ...Typography.h1, color: Colors.textPrimary, textAlign: "center" },
  sub: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.xxl,
  },
  amountCard: {
    backgroundColor: Colors.successLight,
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  youWillReceive: {
    ...Typography.caption,
    color: Colors.textSecondary,
    letterSpacing: 1,
  },
  amount: {
    ...Typography.h1,
    color: Colors.success,
    fontSize: 28,
    marginTop: 4,
  },
  firstPayment: {
    ...Typography.small,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  summaryCard: { marginBottom: Spacing.xxl },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  label: { ...Typography.body, color: Colors.textSecondary },
  value: { ...Typography.bodyMedium, color: Colors.textPrimary },
});
