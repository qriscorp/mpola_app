import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, Typography, Spacing, BorderRadius } from "../../src/theme";
import { Button, Card } from "../../src/components";
import { Ionicons } from "@expo/vector-icons";

export default function GuarantorRequestScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <Text style={styles.emoji}>🤝</Text>
          <Text style={styles.title}>Guarantor Request</Text>
          <Text style={styles.sub}>You've been asked to guarantee a loan</Text>
        </View>

        <Card style={styles.loanCard}>
          <View style={styles.row}>
            <Text style={styles.label}>Borrower</Text>
            <Text style={styles.value}>Sarah Nakato</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Amount</Text>
            <Text style={styles.value}>UGX 2,000,000</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Duration</Text>
            <Text style={styles.value}>6 months</Text>
          </View>
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <Text style={styles.label}>Monthly Payment</Text>
            <Text style={styles.value}>~UGX 354,000</Text>
          </View>
        </Card>

        <Card style={styles.warningBox}>
          <Ionicons name="warning-outline" size={18} color={Colors.warning} />
          <Text style={styles.warningText}>
            By accepting, you agree to be responsible for repayment if the
            borrower defaults.
          </Text>
        </Card>

        <Button
          title="✓ Accept as Guarantor"
          onPress={() => {}}
          color={Colors.teal}
        />
        <View style={{ height: Spacing.md }} />
        <Button
          title="Decline"
          onPress={() => {}}
          variant="outline"
          color={Colors.danger}
        />

        <Text style={styles.support}>Questions? Contact Support</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.xxl, paddingBottom: 40 },
  hero: { alignItems: "center", marginBottom: Spacing.xxl },
  emoji: { fontSize: 48, marginBottom: Spacing.md },
  title: { ...Typography.h2, color: Colors.textPrimary },
  sub: { ...Typography.body, color: Colors.textSecondary, marginTop: 4 },
  loanCard: { marginBottom: Spacing.lg },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  label: { ...Typography.body, color: Colors.textSecondary },
  value: { ...Typography.bodyMedium, color: Colors.textPrimary },
  warningBox: {
    flexDirection: "row",
    gap: Spacing.sm,
    alignItems: "flex-start",
    backgroundColor: Colors.warningLight,
    marginBottom: Spacing.xxl,
  },
  warningText: { ...Typography.small, color: Colors.textPrimary, flex: 1 },
  support: {
    ...Typography.body,
    color: Colors.teal,
    textAlign: "center",
    marginTop: Spacing.xxl,
  },
});
