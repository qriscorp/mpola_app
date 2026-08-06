import React from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Colors, Typography, Spacing, BorderRadius } from "../../src/theme";
import { Button, Card } from "../../src/components";

const METHOD_LABEL: Record<string, string> = {
  wallet: "Mpola Wallet",
  mobile_money: "Mobile Money",
};

function formatDateTime(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-UG", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PaymentSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    transactionId?: string;
    amount?: string;
    paymentMethod?: string;
    instalmentNumber?: string;
    totalInstalments?: string;
    date?: string;
  }>();

  const amount = Number(params.amount ?? 0);
  const instalmentNumber = Number(params.instalmentNumber ?? 0);
  const totalInstalments = Number(params.totalInstalments ?? 0);
  const remaining = Math.max(totalInstalments - instalmentNumber, 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.checkCircle}>
          <Text style={styles.check}>✓</Text>
        </View>
        <Text style={styles.title}>Payment Successful!</Text>
        <Text style={styles.txId}>
          Transaction ID: {params.transactionId ?? "—"}
        </Text>

        <Card style={styles.receipt}>
          <View style={styles.row}>
            <Text style={styles.label}>Amount Paid</Text>
            <Text style={styles.value}>UGX {amount.toLocaleString()}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Payment Method</Text>
            <Text style={styles.value}>
              {METHOD_LABEL[params.paymentMethod ?? ""] ??
                params.paymentMethod ??
                "—"}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Instalment</Text>
            <Text style={styles.value}>
              {instalmentNumber} of {totalInstalments}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date</Text>
            <Text style={styles.value}>{formatDateTime(params.date)}</Text>
          </View>
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <Text style={styles.label}>Remaining</Text>
            <Text style={styles.value}>{remaining} payments</Text>
          </View>
        </Card>

        <Button
          title="⬇ Download Receipt"
          onPress={() =>
            Alert.alert(
              "Coming soon",
              "Receipt downloads aren't available yet.",
            )
          }
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
    backgroundColor: Colors.teal + "25",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: Spacing.lg,
  },
  check: { fontSize: 36, color: Colors.teal },
  title: {
    ...Typography.h2,
    color: Colors.white,
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
    borderBottomColor: Colors.border,
  },
  label: { ...Typography.body, color: Colors.textSecondary },
  value: { ...Typography.bodyMedium, color: Colors.textPrimary },
});
