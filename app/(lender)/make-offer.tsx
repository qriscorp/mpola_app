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
import { useMakeOfferViewModel, DOCUMENT_OPTIONS } from "../../src/viewmodels";

export default function MakeOfferScreen() {
  const router = useRouter();
  const { applicationId, borrowerName } = useLocalSearchParams<{
    applicationId: string;
    borrowerName: string;
  }>();
  const vm = useMakeOfferViewModel(applicationId ?? "");

  const handleSend = async () => {
    const offer = await vm.sendOffer();
    if (offer) {
      router.push({
        pathname: "/(lender)/offer-sent",
        params: { offerId: offer.id },
      });
    }
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

        {vm.cooldownHoursLeft != null && (
          <View style={styles.cooldownBanner}>
            <Text style={styles.cooldownBannerText}>
              Your standing offer already matched this request and is awaiting the
              borrower's response. You can send a manual offer in{" "}
              {vm.cooldownHoursLeft}h if they haven't responded by then.
            </Text>
          </View>
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
          placeholder="e.g. 15"
          keyboardType="numeric"
        />
        {vm.offerErrors.rate && (
          <Text style={styles.error}>{vm.offerErrors.rate}</Text>
        )}

        <View style={styles.unitRow}>
          <TouchableOpacity
            style={[styles.unitChip, !vm.isEmergency && styles.unitChipActive]}
            onPress={() => vm.setIsEmergency(false)}
          >
            <Text style={[styles.unitChipText, !vm.isEmergency && styles.unitChipTextActive]}>
              Months
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.unitChip, vm.isEmergency && styles.unitChipActive]}
            onPress={() => vm.setIsEmergency(true)}
          >
            <Text style={[styles.unitChipText, vm.isEmergency && styles.unitChipTextActive]}>
              Days (emergency)
            </Text>
          </TouchableOpacity>
        </View>
        <Input
          label={vm.isEmergency ? "Duration (days)" : "Duration (months)"}
          value={vm.duration}
          onChangeText={vm.setDuration}
          placeholder={vm.isEmergency ? "e.g. 7" : "e.g. 18"}
          keyboardType="numeric"
        />
        {vm.offerErrors.duration && (
          <Text style={styles.error}>{vm.offerErrors.duration}</Text>
        )}

        <Text style={styles.sectionLabel}>Documents required to accept (optional)</Text>
        <View style={styles.docChipRow}>
          {DOCUMENT_OPTIONS.map((label) => {
            const selected = vm.requiredDocuments.includes(label);
            return (
              <TouchableOpacity
                key={label}
                style={[styles.docChip, selected && styles.docChipSelected]}
                onPress={() => vm.toggleRequiredDocument(label)}
              >
                <Text style={[styles.docChipText, selected && styles.docChipTextSelected]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
          {vm.requiredDocuments
            .filter((d) => !DOCUMENT_OPTIONS.includes(d))
            .map((label) => (
              <TouchableOpacity
                key={label}
                style={[styles.docChip, styles.docChipSelected]}
                onPress={() => vm.toggleRequiredDocument(label)}
              >
                <Text style={styles.docChipTextSelected}>{label} ×</Text>
              </TouchableOpacity>
            ))}
        </View>
        <View style={styles.customDocRow}>
          <Input
            value={vm.customDocInput}
            onChangeText={vm.setCustomDocInput}
            placeholder="Other document..."
            maxLength={255}
            style={{ flex: 1 }}
          />
          <TouchableOpacity
            style={styles.addDocBtn}
            disabled={!vm.customDocInput.trim()}
            onPress={vm.addCustomDocument}
          >
            <Text style={styles.addDocBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {/* Calculation Preview */}
        <Card style={styles.previewCard}>
          <Text style={styles.previewTitle}>Offer Summary</Text>
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>
              {vm.isEmergency ? "Repayment Due" : "Monthly Payment"}
            </Text>
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
          disabled={vm.cooldownHoursLeft != null}
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
  cooldownBanner: {
    backgroundColor: Colors.warningBg,
    borderWidth: 1,
    borderColor: Colors.warning,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  cooldownBannerText: { ...Typography.small, color: Colors.warning },
  error: {
    ...Typography.small,
    color: Colors.danger,
    marginTop: -Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionLabel: {
    ...Typography.smallMedium,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  unitRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  unitChip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  unitChipActive: { backgroundColor: Colors.gold + "25", borderColor: Colors.gold },
  unitChipText: { ...Typography.smallMedium, color: Colors.textSecondary },
  unitChipTextActive: { color: Colors.gold },
  docChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  docChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  docChipSelected: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  docChipText: { ...Typography.caption, color: Colors.textSecondary },
  docChipTextSelected: { color: Colors.white, fontWeight: "600" },
  customDocRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, marginBottom: Spacing.md },
  addDocBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addDocBtnText: { ...Typography.smallMedium, color: Colors.textSecondary },
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
