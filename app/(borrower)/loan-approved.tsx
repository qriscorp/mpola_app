import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, BorderRadius } from "../../src/theme";

export default function LoanApprovedScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    lenderName?: string;
    amount?: string;
    interestRate?: string;
    totalRepayable?: string;
  }>();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Checkmark */}
        <View style={styles.checkCircle}>
          <Ionicons name="checkmark" size={32} color={Colors.teal} />
        </View>

        <Text style={styles.title}>Offer Accepted!</Text>
        <Text style={styles.sub}>
          {params.lenderName ?? "Your lender"} has funded your Mpola wallet.
        </Text>

        {/* Details Card */}
        <View style={styles.card}>
          {[
            {
              label: "Lender",
              value: params.lenderName ?? "—",
              color: Colors.textPrimary,
            },
            {
              label: "Amount",
              value: `UGX ${Number(params.amount ?? 0).toLocaleString()}`,
              color: Colors.textPrimary,
            },
            {
              label: "Rate",
              value: `${params.interestRate ?? "—"}% p.a.`,
              color: Colors.teal,
            },
            {
              label: "Total",
              value: `UGX ${Number(params.totalRepayable ?? 0).toLocaleString()}`,
              color: Colors.teal,
            },
          ].map((row, i, arr) => (
            <View
              key={row.label}
              style={[styles.row, i < arr.length - 1 && styles.rowBorder]}
            >
              <Text style={styles.label}>{row.label}</Text>
              <Text style={[styles.value, { color: row.color }]}>
                {row.value}
              </Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.push("/(borrower)/loans")}
        >
          <Text style={styles.primaryBtnText}>View Repayment Schedule</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.outlineBtn}
          onPress={() => router.replace("/(borrower)/home")}
        >
          <Text style={styles.outlineBtnText}>Back to Dashboard</Text>
        </TouchableOpacity>
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
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.h1,
    color: Colors.white,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  sub: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.xxl,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xxl,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  label: { ...Typography.body, color: Colors.textSecondary },
  value: { ...Typography.bodyMedium },
  primaryBtn: {
    backgroundColor: Colors.teal,
    borderRadius: BorderRadius.full,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  primaryBtnText: { ...Typography.button, color: Colors.white },
  outlineBtn: {
    borderRadius: BorderRadius.full,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  outlineBtnText: { ...Typography.button, color: Colors.textSecondary },
});
