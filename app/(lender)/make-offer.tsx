import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, BorderRadius } from "../../src/theme";
import { Button, Input, Card } from "../../src/components";
import { useMakeOfferViewModel } from "../../src/viewmodels";

export default function MakeOfferScreen() {
  const router = useRouter();
  const { borrowerName } = useLocalSearchParams<{ borrowerName: string }>();
  const vm = useMakeOfferViewModel();

  const handleSend = async () => {
    const success = await vm.sendOffer();
    if (success) router.push("/(lender)/offer-sent");
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Make an Offer</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {borrowerName && (
          <Text style={styles.subtitle}>Offering to {borrowerName}</Text>
        )}

        <Input
          label="Loan Amount (UGX)"
          value={vm.amount}
          onChangeText={vm.setAmount}
          placeholder="e.g. 8000000"
          keyboardType="numeric"
        />
        {vm.offerErrors.amount && (
          <Text style={styles.error}>{vm.offerErrors.amount}</Text>
        )}

        <Input
          label="Interest Rate (%/month)"
          value={vm.rate}
          onChangeText={vm.setRate}
          placeholder="e.g. 3.5"
          keyboardType="numeric"
        />
        {vm.offerErrors.interestRate && (
          <Text style={styles.error}>{vm.offerErrors.interestRate}</Text>
        )}

        <Input
          label="Duration (months)"
          value={vm.duration}
          onChangeText={vm.setDuration}
          placeholder="e.g. 18"
          keyboardType="numeric"
        />
        {vm.offerErrors.duration && (
          <Text style={styles.error}>{vm.offerErrors.duration}</Text>
        )}

        {/* Calculation Preview */}
        <Card style={styles.previewCard}>
          <Text style={styles.previewTitle}>Offer Summary</Text>
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>Monthly Payment</Text>
            <Text style={styles.previewValue}>
              UGX {vm.monthlyPayment.toLocaleString()}
            </Text>
          </View>
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>Total Earnings</Text>
            <Text style={[styles.previewValue, { color: Colors.gold }]}>
              UGX {vm.totalEarnings.toLocaleString()}
            </Text>
          </View>
          <View style={[styles.previewRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.previewLabel}>Total Repayable</Text>
            <Text style={styles.previewValue}>
              UGX {vm.totalRepayable.toLocaleString()}
            </Text>
          </View>
        </Card>

        <Button
          title="Send Offer →"
          onPress={handleSend}
          color={Colors.gold}
          loading={vm.loading}
          style={{ marginTop: Spacing.sm }}
        />
        <TouchableOpacity
          style={styles.cancelLink}
          onPress={() => router.back()}
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
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  error: {
    ...Typography.small,
    color: Colors.danger,
    marginTop: -Spacing.sm,
    marginBottom: Spacing.md,
  },
  previewCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.gold + "40",
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  previewTitle: {
    ...Typography.h4,
    color: Colors.white,
    marginBottom: Spacing.md,
  },
  previewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  previewLabel: { ...Typography.body, color: Colors.textMuted },
  previewValue: { ...Typography.bodyMedium, color: Colors.white },
  cancelLink: { alignItems: "center", marginTop: Spacing.xl },
  cancelText: { ...Typography.body, color: Colors.textSecondary },
});
