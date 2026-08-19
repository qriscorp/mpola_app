import React, { useMemo } from "react";
import { View, Text, StyleSheet, Alert, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, BorderRadius, useScaledTypography } from "../../src/theme";
import { Button, Card } from "../../src/components";
import { downloadRepaymentReceipt, goToTabRoot } from "../../src/services";

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
  const typography = useScaledTypography();
  const styles = useMemo(() => makeStyles(typography), [typography]);
  const params = useLocalSearchParams<{
    repaymentId?: string;
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
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => goToTabRoot("/(borrower)/(tabs)/home")}
        accessibilityLabel="Go back"
        accessibilityRole="button"
      >
        <Ionicons name="arrow-back" size={24} color={Colors.white} />
      </TouchableOpacity>
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
          onPress={async () => {
            if (!params.repaymentId) {
              Alert.alert("Receipt unavailable", "This payment has no receipt on file.");
              return;
            }
            try {
              await downloadRepaymentReceipt(params.repaymentId);
            } catch {
              Alert.alert("Couldn't download the receipt", "Please try again.");
            }
          }}
          variant="outline"
          color={Colors.teal}
        />
        <View style={{ height: Spacing.md }} />
        <Button
          title="Dashboard"
          onPress={() => goToTabRoot("/(borrower)/(tabs)/home")}
          color={Colors.teal}
        />
      </View>
    </SafeAreaView>
  );
}

function makeStyles(typography: ReturnType<typeof useScaledTypography>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    backBtn: { paddingHorizontal: Spacing.xxl, paddingTop: Spacing.md },
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
      ...typography.h2,
      color: Colors.white,
      textAlign: "center",
      marginBottom: Spacing.xs,
    },
    txId: {
      ...typography.small,
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
    label: { ...typography.body, color: Colors.textSecondary },
    value: { ...typography.bodyMedium, color: Colors.textPrimary },
  });
}
