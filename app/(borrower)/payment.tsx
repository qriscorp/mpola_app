import React from "react";
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
import { Colors, Typography, Spacing, BorderRadius } from "../../src/theme";
import { Button, Card } from "../../src/components";
import { usePaymentViewModel } from "../../src/viewmodels";
import type { PaymentMethod } from "../../src/models";

const methods: { key: PaymentMethod; label: string }[] = [
  { key: "wallet", label: "Wallet" },
  { key: "momo", label: "MoMo" },
  { key: "airtel", label: "Airtel" },
];

export default function PaymentScreen() {
  const router = useRouter();
  const vm = usePaymentViewModel();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Make a Payment</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Amount Due Card */}
        <Card style={styles.amountCard}>
          <Text style={styles.amountLabel}>Amount Due</Text>
          <Text style={styles.amountValue}>
            UGX {vm.amount.toLocaleString()}
          </Text>
          <Text style={styles.amountSub}>
            Instalment {vm.instalmentNumber} of {vm.totalInstalments} · Due{" "}
            {vm.dueDate}
          </Text>
        </Card>

        {/* Payment Method */}
        <Text style={styles.sectionLabel}>Payment Method</Text>
        <View style={styles.methodRow}>
          {methods.map((m) => (
            <TouchableOpacity
              key={m.key}
              style={[
                styles.methodTab,
                vm.method === m.key && styles.methodTabActive,
              ]}
              onPress={() => vm.setMethod(m.key)}
            >
              <Text
                style={[
                  styles.methodText,
                  vm.method === m.key && styles.methodTextActive,
                ]}
              >
                {m.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Wallet Balance */}
        {vm.method === "wallet" && (
          <Card style={styles.balanceCard}>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceLabel}>Wallet Balance</Text>
              <Text style={styles.balanceValue}>
                UGX {vm.walletBalance.toLocaleString()}
              </Text>
            </View>
            <Text
              style={[
                styles.sufficientText,
                { color: vm.sufficient ? Colors.success : Colors.danger },
              ]}
            >
              {vm.sufficient ? "Sufficient ✓" : "Insufficient funds"}
            </Text>
          </Card>
        )}

        {/* Breakdown */}
        <Card style={{ marginBottom: Spacing.xxl }}>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Payment Amount</Text>
            <Text style={styles.breakdownValue}>
              UGX {vm.amount.toLocaleString()}
            </Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Processing Fee</Text>
            <Text style={styles.breakdownValue}>{vm.processingFee}</Text>
          </View>
          <View style={[styles.breakdownRow, styles.breakdownTotal]}>
            <Text style={styles.breakdownTotalLabel}>Total Deducted</Text>
            <Text style={styles.breakdownTotalValue}>
              UGX {vm.totalDeducted.toLocaleString()}
            </Text>
          </View>
        </Card>

        <Button
          title="Confirm Payment ✓"
          onPress={async () => {
            await vm.confirmPayment();
            router.push("/(borrower)/payment-success");
          }}
          color={Colors.teal}
          loading={vm.loading}
        />

        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.cancelBtn}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
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
  amountCard: {
    backgroundColor: Colors.teal,
    alignItems: "center",
    marginBottom: Spacing.xxl,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
  },
  amountLabel: {
    ...Typography.caption,
    color: Colors.white,
    opacity: 0.8,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  amountValue: {
    fontSize: 32,
    fontWeight: "800",
    color: Colors.white,
    marginTop: 4,
  },
  amountSub: {
    ...Typography.small,
    color: Colors.white,
    opacity: 0.7,
    marginTop: 4,
  },
  sectionLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: Spacing.md,
  },
  methodRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  methodTab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    backgroundColor: Colors.surface,
  },
  methodTabActive: {
    backgroundColor: Colors.teal + "25",
    borderColor: Colors.teal,
  },
  methodText: { ...Typography.bodyMedium, color: Colors.textSecondary },
  methodTextActive: { color: Colors.teal },
  balanceCard: { marginBottom: Spacing.lg },
  balanceRow: { flexDirection: "row", justifyContent: "space-between" },
  balanceLabel: { ...Typography.body, color: Colors.textSecondary },
  balanceValue: { ...Typography.bodyMedium, color: Colors.textPrimary },
  sufficientText: { ...Typography.smallMedium, marginTop: 4 },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  breakdownLabel: { ...Typography.body, color: Colors.textSecondary },
  breakdownValue: { ...Typography.body, color: Colors.textPrimary },
  breakdownTotal: { borderBottomWidth: 0, paddingTop: Spacing.md },
  breakdownTotalLabel: { ...Typography.bodyMedium, color: Colors.textPrimary },
  breakdownTotalValue: { ...Typography.h4, color: Colors.textPrimary },
  cancelBtn: { alignItems: "center", marginTop: Spacing.lg },
  cancelText: { ...Typography.body, color: Colors.textSecondary },
});
