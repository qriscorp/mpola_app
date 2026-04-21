import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Colors, Typography, Spacing, BorderRadius } from "../../src/theme";
import { Button, Card } from "../../src/components";

export default function PaymentSuccessScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.checkCircle}>
          <Text style={styles.check}>✓</Text>
        </View>
        <Text style={styles.title}>Payment Successful!</Text>
        <Text style={styles.txId}>Transaction ID: TXN-20250418-7821</Text>

        <Card style={styles.receipt}>
          <View style={styles.row}>
            <Text style={styles.label}>Amount Paid</Text>
            <Text style={styles.value}>UGX 354,000</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Payment Method</Text>
            <Text style={styles.value}>Welend Wallet</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Instalment</Text>
            <Text style={styles.value}>7 of 12</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date</Text>
            <Text style={styles.value}>Apr 18, 9:41 AM</Text>
          </View>
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <Text style={styles.label}>Remaining</Text>
            <Text style={styles.value}>5 payments</Text>
          </View>
        </Card>

        <Button
          title="⬇ Download Receipt"
          onPress={() => {}}
          variant="outline"
          color={Colors.teal}
        />
        <View style={{ height: Spacing.md }} />
        <Button
          title="Dashboard"
          onPress={() => router.replace("/(borrower)/home")}
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
  checkCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.success,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: Spacing.lg,
  },
  check: { fontSize: 36, color: Colors.white },
  title: {
    ...Typography.h2,
    color: Colors.textPrimary,
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  txId: {
    ...Typography.small,
    color: Colors.textMuted,
    textAlign: "center",
    marginBottom: Spacing.xxl,
  },
  receipt: { marginBottom: Spacing.xxl },
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
