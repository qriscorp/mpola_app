import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, BorderRadius } from "../../src/theme";
import { Button, Input } from "../../src/components";
import {
  usePostOfferViewModel,
  LOAN_TYPE_OPTIONS,
  DOCUMENT_OPTIONS,
  DURATION_OPTIONS,
} from "../../src/viewmodels";

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function PostOfferScreen() {
  const router = useRouter();
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const vm = usePostOfferViewModel(editId);

  const handleSaveDraft = async () => {
    try {
      await vm.submitCreate(true);
      Alert.alert("Saved", "Offer saved as draft.");
      router.push("/(lender)/my-offers");
    } catch (e: any) {
      Alert.alert("Failed to save", e?.message || "Please try again.");
    }
  };

  const handleSubmit = async () => {
    try {
      if (vm.isEditing) {
        await vm.submitUpdate();
        Alert.alert("Updated", "Offer updated.");
      } else {
        await vm.submitCreate(false);
        Alert.alert(
          "Submitted",
          "Offer submitted for review. It'll go live once approved.",
        );
      }
      router.push("/(lender)/my-offers");
    } catch (e: any) {
      Alert.alert("Failed to save", e?.message || "Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {vm.isEditing ? "Edit Offer" : "Post an Offer"}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <Text style={styles.subtitle}>
          {vm.isEditing
            ? "Update your terms — changes apply once you save."
            : "Set your terms once. Borrowers apply to you — you review and approve who gets funded."}
        </Text>

        <Input
          label="Max Loan Amount (UGX)"
          value={vm.maxAmount}
          onChangeText={vm.setMaxAmount}
          placeholder="50000000"
          keyboardType="numeric"
        />
        <Input
          label="Min Loan Amount (UGX)"
          value={vm.minAmount}
          onChangeText={vm.setMinAmount}
          placeholder="1000"
          keyboardType="numeric"
          error={vm.amountRangeInvalid ? "Must be less than max loan amount" : undefined}
        />
        <Input
          label="Interest Rate (%/month)"
          value={vm.interestRate}
          onChangeText={vm.setInterestRate}
          placeholder="2"
          keyboardType="numeric"
          error={vm.rateInvalid ? "Must be between 0.1% and 25%" : undefined}
        />

        <Text style={styles.fieldLabel}>Max Duration</Text>
        <View style={styles.chipRow}>
          {DURATION_OPTIONS.map((d) => (
            <Chip
              key={d}
              label={`${d} mo`}
              active={vm.maxDuration === d}
              onPress={() => vm.setMaxDuration(d)}
            />
          ))}
        </View>

        <Text style={styles.fieldLabel}>Accepted Loan Types</Text>
        <View style={styles.chipRow}>
          {LOAN_TYPE_OPTIONS.map((t) => (
            <Chip
              key={t}
              label={t}
              active={vm.acceptedLoanTypes.includes(t)}
              onPress={() => vm.toggleLoanType(t)}
            />
          ))}
        </View>

        <Text style={styles.fieldLabel}>Required Documents</Text>
        <View style={styles.chipRow}>
          {DOCUMENT_OPTIONS.map((d) => (
            <Chip
              key={d}
              label={d}
              active={vm.requiredDocuments.includes(d)}
              onPress={() => vm.toggleDocument(d)}
            />
          ))}
        </View>

        <Input
          label="Description (optional)"
          value={vm.description}
          onChangeText={vm.setDescription}
          placeholder="Describe your preferences, sectors, or special conditions..."
          multiline
        />

        <Input
          label="Max Concurrent Loans (optional)"
          value={vm.maxConcurrentLoans}
          onChangeText={vm.setMaxConcurrentLoans}
          placeholder="10"
          keyboardType="numeric"
        />

        {!vm.isEditing && (
          <Text style={styles.footnote}>
            Submitted offers are reviewed before going live on the
            marketplace.
          </Text>
        )}

        {vm.isEditing ? (
          <Button
            title={vm.editDataLoading ? "Loading…" : vm.submitting ? "Saving…" : "Save Changes"}
            onPress={handleSubmit}
            color={Colors.gold}
            loading={vm.submitting}
            disabled={vm.editDataLoading || vm.amountRangeInvalid || vm.rateInvalid}
            style={{ marginTop: Spacing.md }}
          />
        ) : (
          <>
            <Button
              title={vm.submitting ? "Posting…" : "Post Offer"}
              onPress={handleSubmit}
              color={Colors.gold}
              loading={vm.submitting}
              disabled={vm.amountRangeInvalid || vm.rateInvalid}
              style={{ marginTop: Spacing.md }}
            />
            <TouchableOpacity
              style={styles.draftLink}
              onPress={handleSaveDraft}
              disabled={vm.submitting || vm.amountRangeInvalid || vm.rateInvalid}
            >
              <Text style={styles.draftText}>Save as Draft</Text>
            </TouchableOpacity>
          </>
        )}
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
  fieldLabel: {
    ...Typography.smallMedium,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  chipActive: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  chipText: {
    ...Typography.small,
    color: Colors.textSecondary,
    textTransform: "capitalize",
  },
  chipTextActive: { color: Colors.white },
  footnote: {
    ...Typography.small,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
  },
  draftLink: { alignItems: "center", marginTop: Spacing.lg },
  draftText: { ...Typography.body, color: Colors.textSecondary },
});
