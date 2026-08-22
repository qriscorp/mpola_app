import React, { useMemo } from "react";
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
import { Colors, Spacing, BorderRadius, useScaledTypography } from "../../src/theme";
import { Button, Input } from "../../src/components";
import { showAlert } from "../../src/services/alerts";
import {
  usePostOfferViewModel,
  LOAN_TYPE_OPTIONS,
  DOCUMENT_OPTIONS,
  DURATION_OPTIONS,
  DAY_PRESET_OPTIONS,
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
  const typography = useScaledTypography();
  const styles = useMemo(() => makeStyles(typography), [typography]);
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
  const typography = useScaledTypography();
  const styles = useMemo(() => makeStyles(typography), [typography]);

  const handleSaveDraft = async () => {
    try {
      await vm.submitCreate(true);
      showAlert("Saved", "Offer saved as draft.");
      router.push("/(lender)/my-offers");
    } catch (e: any) {
      showAlert("Failed to save", e?.message || "Please try again.");
    }
  };

  const handleSubmit = async () => {
    try {
      if (vm.isEditing) {
        await vm.submitUpdate();
        showAlert("Updated", "Offer updated.");
        router.push("/(lender)/my-offers");
      } else {
        const template = await vm.submitCreate(false);
        router.replace({
          pathname: "/(lender)/offer-posted",
          params: {
            templateId: template.id,
            minAmount: String(template.minAmount),
            maxAmount: String(template.maxAmount),
            interestRate: String(template.interestRate),
            ...(template.maxDurationDays != null
              ? { durationDays: String(template.maxDurationDays) }
              : template.maxDuration != null
                ? { duration: String(template.maxDuration) }
                : {}),
          },
        });
      }
    } catch (e: any) {
      showAlert("Failed to save", e?.message || "Please try again.");
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
          error={vm.rateInvalid ? `Must be between 0.1% and ${vm.maxRateAllowed}%` : undefined}
        />

        <Text style={styles.fieldLabel}>Max Duration</Text>
        <View style={styles.unitRow}>
          <TouchableOpacity
            style={[styles.unitChip, vm.durationUnit === "months" && styles.unitChipActive]}
            onPress={() => vm.setDurationUnit("months")}
          >
            <Text
              style={[
                styles.unitChipText,
                vm.durationUnit === "months" && styles.unitChipTextActive,
              ]}
            >
              Months
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.unitChip, vm.durationUnit === "days" && styles.unitChipActive]}
            onPress={() => vm.setDurationUnit("days")}
          >
            <Text
              style={[
                styles.unitChipText,
                vm.durationUnit === "days" && styles.unitChipTextActive,
              ]}
            >
              Days (Emergency)
            </Text>
          </TouchableOpacity>
        </View>
        {vm.durationUnit === "months" ? (
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
        ) : (
          <>
            <View style={styles.chipRow}>
              {DAY_PRESET_OPTIONS.map((d) => (
                <Chip
                  key={d}
                  label={`${d} day${d === 1 ? "" : "s"}`}
                  active={vm.maxDurationDays === d && vm.customDays === ""}
                  onPress={() => vm.selectDayPreset(d)}
                />
              ))}
            </View>
            <Input
              label="Custom (1-29 days)"
              value={vm.customDays}
              onChangeText={vm.setCustomDurationDays}
              placeholder="e.g. 21"
              keyboardType="numeric"
              error={
                vm.customDays !== "" && vm.maxDurationDays == null
                  ? "Enter a whole number between 1 and 29"
                  : undefined
              }
            />
            <Text style={styles.footnote}>
              Matches short-term "emergency" requests (1-29 days, single repayment). These never
              match a month-based offer, and vice versa.
            </Text>
          </>
        )}

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
          {vm.customDocuments.map((d) => (
            <TouchableOpacity
              key={d}
              style={[styles.chip, styles.chipActive]}
              onPress={() => vm.toggleDocument(d)}
            >
              <Text style={styles.chipTextActive}>{d} ×</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.customDocRow}>
          <Input
            value={vm.customDocInput}
            onChangeText={vm.setCustomDocInput}
            placeholder="Other document (e.g. Business License)"
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
        <Text style={styles.footnote}>
          A custom requirement won&apos;t match a fixed upload slot — the borrower will be able to
          satisfy it with either a file or a written explanation.
        </Text>

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
            disabled={vm.editDataLoading || vm.amountRangeInvalid || vm.rateInvalid || vm.durationInvalid}
            style={{ marginTop: Spacing.md }}
          />
        ) : (
          <>
            <Button
              title={vm.submitting ? "Posting…" : "Post Offer"}
              onPress={handleSubmit}
              color={Colors.gold}
              loading={vm.submitting}
              disabled={vm.amountRangeInvalid || vm.rateInvalid || vm.durationInvalid}
              style={{ marginTop: Spacing.md }}
            />
            <TouchableOpacity
              style={styles.draftLink}
              onPress={handleSaveDraft}
              disabled={vm.submitting || vm.amountRangeInvalid || vm.rateInvalid || vm.durationInvalid}
            >
              <Text style={styles.draftText}>Save as Draft</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(typography: ReturnType<typeof useScaledTypography>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
    },
    headerTitle: { ...typography.h3, color: Colors.white },
    scroll: { padding: Spacing.lg, paddingBottom: 136 },
    subtitle: {
      ...typography.body,
      color: Colors.textSecondary,
      marginBottom: Spacing.lg,
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
    unitChipText: { ...typography.smallMedium, color: Colors.textSecondary },
    unitChipTextActive: { color: Colors.gold },
    fieldLabel: {
      ...typography.smallMedium,
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
      ...typography.small,
      color: Colors.textSecondary,
      textTransform: "capitalize",
    },
    chipTextActive: { color: Colors.white },
    customDocRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
    addDocBtn: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    addDocBtnText: { ...typography.smallMedium, color: Colors.textSecondary },
    footnote: {
      ...typography.small,
      color: Colors.textMuted,
      marginTop: Spacing.sm,
    },
    draftLink: { alignItems: "center", marginTop: Spacing.lg },
    draftText: { ...typography.body, color: Colors.textSecondary },
  });
}
