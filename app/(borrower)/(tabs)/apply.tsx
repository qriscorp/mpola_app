import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, BorderRadius, useScaledTypography } from "../../../src/theme";
import { Button, Card, Input, InfoTip, PhoneInput, ConfirmModal } from "../../../src/components";
import { useApplyViewModel } from "../../../src/viewmodels";
import type { LoanType } from "../../../src/models";

const loanTypeLabels: Record<LoanType, string> = {
  personal: "Personal",
  business: "Business",
  education: "Education",
  agricultural: "Agricultural",
  emergency: "Emergency",
};

const EXPIRY_PRESETS: { label: string; days: number | null }[] = [
  { label: "3 days", days: 3 },
  { label: "1 week", days: 7 },
  { label: "2 weeks", days: 14 },
  { label: "1 month", days: 30 },
  { label: "No rush", days: null },
];

function presetToIso(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

export default function ApplyScreen() {
  const router = useRouter();
  const vm = useApplyViewModel();
  const typography = useScaledTypography();
  const styles = useMemo(() => makeStyles(typography), [typography]);

  const [guarantorEmail, setGuarantorEmail] = useState("");
  const [guarantorPhone, setGuarantorPhone] = useState("");
  const [expiryPreset, setExpiryPreset] = useState<string | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const stepLabels = ["Details", "Guarantors", "Review"];

  const handleAddGuarantor = async () => {
    if (!guarantorEmail.trim() || !guarantorPhone.trim()) return;
    const added = await vm.addGuarantorByContact(guarantorEmail.trim(), guarantorPhone.trim());
    if (added) {
      setGuarantorEmail("");
      setGuarantorPhone("");
    }
  };

  const handleSubmit = async () => {
    try {
      const res = await vm.submitApplication();
      router.push({
        pathname: "/(borrower)/application-sent",
        params: { referenceNumber: res.referenceNumber },
      });
    } catch (e) {
      Alert.alert(
        "Submission failed",
        e instanceof Error ? e.message : "Please try again.",
      );
    }
  };

  const handleNext = async () => {
    try {
      await vm.nextStep();
    } catch (e) {
      Alert.alert("Failed to save", e instanceof Error ? e.message : "Please try again.");
    }
  };

  const handleDiscard = async () => {
    try {
      await vm.discardDraft();
      setConfirmDiscard(false);
    } catch (e: any) {
      setConfirmDiscard(false);
      Alert.alert("Failed to discard", e?.message || "Please try again.");
    }
  };

  if (vm.resuming || vm.eligibilityLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Apply for a Loan</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.resumingBox}>
          <ActivityIndicator size="large" color={Colors.teal} />
        </View>
      </SafeAreaView>
    );
  }

  // No unfinished draft to resume, and an existing loan still has a
  // balance — block starting a new request instead of letting them fill
  // out the whole wizard just to get rejected at the end (backend enforces
  // this too, at createApplication — this is purely upfront UX).
  if (!vm.resumedFromDraft && vm.eligibility && !vm.eligibility.canApply && vm.eligibility.blockingLoan) {
    const loan = vm.eligibility.blockingLoan;
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Apply for a Loan</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.blockedBox}>
          <View style={styles.blockedIconCircle}>
            <Ionicons name="warning" size={28} color={Colors.warning} />
          </View>
          <Text style={styles.blockedTitle}>You have an outstanding loan</Text>
          <Text style={styles.blockedText}>
            Settle your current loan before applying for a new one — you still owe{" "}
            <Text style={styles.blockedBold}>UGX {loan.remainingBalance.toLocaleString()}</Text> of
            {" "}UGX {loan.totalRepayable.toLocaleString()}
            {loan.status === "overdue" ? " (overdue)" : ""}
            {loan.status === "defaulted" ? " (defaulted)" : ""}.
          </Text>
          <Button
            title="Go to My Loans"
            onPress={() => router.push("/(borrower)/(tabs)/loans")}
            color={Colors.teal}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => (vm.step === 1 ? router.back() : vm.prevStep())}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Apply for a Loan</Text>
        {vm.applicationId ? (
          <TouchableOpacity onPress={() => setConfirmDiscard(true)} disabled={vm.discardingDraft}>
            <Text style={styles.discardText}>Discard</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>

      {vm.resumedFromDraft && (
        <View style={styles.resumeBanner}>
          <Text style={styles.resumeBannerText}>
            Continuing your unfinished loan request right where you left off.
          </Text>
        </View>
      )}

      {/* Stepper */}
      <View style={styles.stepper}>
        {stepLabels.map((label, i) => {
          const stepNum = i + 1;
          const active = stepNum === vm.step;
          const done = stepNum < vm.step;
          return (
            <View key={i} style={styles.stepItem}>
              <View
                style={[
                  styles.stepCircle,
                  done && styles.stepDone,
                  active && styles.stepActive,
                ]}
              >
                {done ? (
                  <Ionicons name="checkmark" size={12} color={Colors.white} />
                ) : (
                  <Text
                    style={[
                      styles.stepNum,
                      (active || done) && { color: Colors.white },
                    ]}
                  >
                    {stepNum}
                  </Text>
                )}
              </View>
              <Text
                style={[styles.stepLabel, active && styles.stepLabelActive]}
              >
                {label}
              </Text>
            </View>
          );
        })}
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Step 1: Details */}
        {vm.step === 1 && (
          <>
            <View style={styles.infoRow}>
              <Text style={styles.infoRowText}>
                Here's the flow: submit this request, your 2 guarantors approve it, then lenders can
                send offers. Each offer lists what documents that lender needs — you provide those
                when you accept.
              </Text>
              <View style={{ marginTop: 2 }}>
                <InfoTip text="Nothing is funded until you accept an offer. Your request stays hidden from lenders until both guarantors approve, and you can edit or withdraw it any time before that." />
              </View>
            </View>
            <Input
              label="Loan Amount"
              value={vm.amount}
              onChangeText={vm.setAmount}
              placeholder={`e.g. ${vm.minAmount.toLocaleString()} (min) — ${vm.maxAmount.toLocaleString()} (max)`}
              prefix="UGX"
              keyboardType="numeric"
              error={vm.detailsErrors.amount}
            />

            <Text style={styles.sectionLabel}>Loan Type</Text>
            <View style={styles.typeGrid}>
              {vm.loanTypes.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.typeCard,
                    vm.loanType === t && styles.typeCardActive,
                  ]}
                  onPress={() => vm.setLoanType(t)}
                >
                  <Text
                    style={[
                      styles.typeText,
                      vm.loanType === t && styles.typeTextActive,
                    ]}
                  >
                    {loanTypeLabels[t]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {vm.isEmergency && (
              <Text style={styles.emergencyNote}>
                Short-term request — one repayment in full, due when the term ends. Interest is
                prorated from the platform&apos;s monthly rate.
              </Text>
            )}

            <Text style={styles.sectionLabel}>Duration</Text>
            {vm.isEmergency ? (
              <>
                <View style={styles.chips}>
                  {vm.emergencyDayPresets.map((d) => (
                    <TouchableOpacity
                      key={d}
                      style={[styles.chip, vm.durationDays === d && styles.chipActive]}
                      onPress={() => vm.setDurationDays(d)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          vm.durationDays === d && styles.chipTextActive,
                        ]}
                      >
                        {d} day{d === 1 ? "" : "s"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Input
                  label="Custom (1-29 days)"
                  value={
                    vm.durationDays != null && !vm.emergencyDayPresets.includes(vm.durationDays)
                      ? String(vm.durationDays)
                      : ""
                  }
                  onChangeText={(t) => {
                    const n = parseInt(t, 10);
                    vm.setDurationDays(!Number.isNaN(n) && n >= 1 && n <= 29 ? n : null);
                  }}
                  placeholder="e.g. 21"
                  keyboardType="numeric"
                />
              </>
            ) : (
              <View style={styles.chips}>
                {vm.durationOptions.map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.chip, vm.duration === d && styles.chipActive]}
                    onPress={() => vm.setDuration(d)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        vm.duration === d && styles.chipTextActive,
                      ]}
                    >
                      {d} mo
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Input
              label="Purpose (optional)"
              value={vm.purpose}
              onChangeText={vm.setPurpose}
              placeholder="What's the loan for?"
              multiline
            />

            <Input
              label="Max Interest Rate (%/month, optional)"
              value={vm.maxInterestRate}
              onChangeText={vm.setMaxInterestRate}
              placeholder="e.g. 3 — leave blank to accept any rate"
              keyboardType="numeric"
              error={vm.detailsErrors.maxInterestRate}
            />

            <Text style={styles.sectionLabel}>Valid Until (optional)</Text>
            <View style={styles.typeGrid}>
              {EXPIRY_PRESETS.map((preset) => {
                const isActive = expiryPreset === preset.label;
                return (
                  <TouchableOpacity
                    key={preset.label}
                    style={[styles.typeCard, isActive && styles.typeCardActive]}
                    onPress={() => {
                      setExpiryPreset(preset.label);
                      vm.setValidUntil(
                        preset.days === null ? null : presetToIso(preset.days),
                      );
                    }}
                  >
                    <Text
                      style={[styles.typeText, isActive && styles.typeTextActive]}
                    >
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {vm.validUntil && (
              <Text style={styles.expiryHint}>
                Stops showing to lenders on {new Date(vm.validUntil).toLocaleDateString()} if not funded.
              </Text>
            )}

            <Card style={styles.estimateCard}>
              <Text style={styles.estimateLabel}>
                Estimated {vm.isEmergency ? "Repayment" : `Repayment (${vm.interestRate}%/month)`}
              </Text>
              <Text style={styles.estimateAmount}>
                ~UGX {vm.monthlyPayment.toLocaleString()}
                {vm.isEmergency ? "" : "/month"}
              </Text>
              <Text style={styles.estimateTotal}>
                UGX {Math.round(vm.totalRepayable).toLocaleString()} total
              </Text>
              <Text style={styles.estimateNote}>
                {vm.hasRateCap
                  ? "This is only an estimate at your rate cap — nothing here is submitted."
                  : "You left the rate blank — this matches any lender's offer, at whatever rate they set. Nothing here is submitted; the totals are 0 until you enter a cap or an amount."}
              </Text>
            </Card>

            <Button
              title={vm.savingStep1 ? "Saving…" : "Next: Add Guarantors →"}
              onPress={handleNext}
              color={Colors.teal}
              loading={vm.savingStep1}
              disabled={!vm.step1Valid}
            />
          </>
        )}

        {/* Step 2: Guarantors */}
        {vm.step === 2 && (
          <>
            <View style={styles.infoRow}>
              <Text style={styles.infoRowText}>
                Add exactly 2 guarantors — they must already have a Mpola
                account. They'll each get a request to approve or decline
                once you submit, and your application won't be shown to
                lenders until both accept.
              </Text>
              <View style={{ marginTop: 2 }}>
                <InfoTip text="If one declines, you can search for a replacement from My Requests after submitting. You can still edit the amount, duration, or type later — but only until a guarantor actually approves; once someone has committed to these exact terms, editing locks and you'd need to withdraw and resubmit instead." />
              </View>
            </View>

            {vm.guarantors.map((g) => (
              <Card key={g.userId} style={styles.guarantorCard}>
                <View style={styles.guarantorHeader}>
                  <Text style={styles.guarantorName}>{g.fullName ?? g.username}</Text>
                  <TouchableOpacity onPress={() => vm.removeGuarantor(g.userId)}>
                    <Text style={styles.removeText}>Remove</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.guarantorPhone}>@{g.username}</Text>
              </Card>
            ))}

            {vm.guarantors.length < 2 && (
              <Card style={styles.addGuarantorCard}>
                <Input
                  label="Guarantor's Email"
                  value={guarantorEmail}
                  onChangeText={setGuarantorEmail}
                  placeholder="their.email@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <PhoneInput
                  label="Guarantor's Phone"
                  value={guarantorPhone}
                  onChangeText={setGuarantorPhone}
                />
                {vm.guarantorError && (
                  <Text style={styles.guarantorErrorText}>{vm.guarantorError}</Text>
                )}
                <Button
                  title={vm.searchingGuarantor ? "Searching…" : "Add Guarantor"}
                  onPress={handleAddGuarantor}
                  color={Colors.teal}
                  variant="outline"
                  loading={vm.searchingGuarantor}
                />
              </Card>
            )}

            <Button
              title="Next: Review →"
              onPress={handleNext}
              color={Colors.teal}
              disabled={vm.guarantors.length < 2}
            />
          </>
        )}

        {/* Step 3: Review */}
        {vm.step === 3 && (
          <>
            <Card style={{ marginBottom: Spacing.md }}>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Loan Amount</Text>
                <Text style={styles.reviewValue}>
                  UGX {Number(vm.amount).toLocaleString()}
                </Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Type</Text>
                <Text style={styles.reviewValue}>
                  {loanTypeLabels[vm.loanType]}
                </Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Duration</Text>
                <Text style={styles.reviewValue}>
                  {vm.isEmergency ? `${vm.durationDays} day${vm.durationDays === 1 ? "" : "s"}` : `${vm.duration} months`}
                </Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>
                  {vm.hasRateCap ? "Your Rate Cap" : "Rate (uncapped)"}
                </Text>
                <Text style={styles.reviewValue}>{vm.interestRate}%/month</Text>
              </View>
              <View style={[styles.reviewRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.reviewLabel}>Valid Until</Text>
                <Text style={styles.reviewValue}>
                  {vm.validUntil
                    ? new Date(vm.validUntil).toLocaleDateString()
                    : "No deadline"}
                </Text>
              </View>
            </Card>

            <View style={styles.docsHint}>
              <Text style={styles.docsHintText}>
                Once lenders send offers, each one will list the documents it needs — you provide
                those (or reuse ones already on file) when you accept a specific offer.
              </Text>
            </View>

            <Card style={{ marginBottom: Spacing.xxl }}>
              <Text style={styles.reviewSection}>Guarantors</Text>
              {vm.guarantors.length === 0 ? (
                <Text style={styles.reviewDetail}>None added</Text>
              ) : (
                vm.guarantors.map((g) => (
                  <Text key={g.userId} style={styles.reviewDetail}>
                    {g.fullName ?? g.username} — @{g.username}
                  </Text>
                ))
              )}
            </Card>

            <Button
              title="Submit Application 🚀"
              onPress={handleSubmit}
              color={Colors.teal}
              loading={vm.submitting}
              disabled={vm.guarantors.length < 2}
            />
          </>
        )}
      </ScrollView>

      <ConfirmModal
        visible={confirmDiscard}
        icon="trash-outline"
        title="Discard this loan request and start over?"
        message="This can't be undone."
        confirmLabel="Discard"
        destructive
        loading={vm.discardingDraft}
        onCancel={() => setConfirmDiscard(false)}
        onConfirm={handleDiscard}
      />
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
    discardText: { ...typography.smallMedium, color: Colors.danger },
    resumingBox: { flex: 1, alignItems: "center", justifyContent: "center" },
    blockedBox: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: Spacing.xl,
      gap: Spacing.md,
    },
    blockedIconCircle: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: Colors.warning + "20",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: Spacing.xs,
    },
    blockedTitle: { ...typography.h4, color: Colors.textPrimary, textAlign: "center" },
    blockedText: {
      ...typography.body,
      color: Colors.textSecondary,
      textAlign: "center",
      marginBottom: Spacing.md,
    },
    blockedBold: { fontWeight: "700", color: Colors.textPrimary },
    resumeBanner: {
      marginHorizontal: Spacing.lg,
      marginBottom: Spacing.sm,
      backgroundColor: "#1A2A40",
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
    },
    resumeBannerText: { ...typography.small, color: Colors.info },
    stepper: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
    stepItem: { alignItems: "center", flex: 1 },
    stepCircle: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: Colors.surface,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 4,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    stepDone: { backgroundColor: Colors.teal, borderColor: Colors.teal },
    stepActive: { backgroundColor: Colors.teal, borderColor: Colors.teal },
    stepNum: {
      ...typography.caption,
      fontWeight: "700",
      color: Colors.textMuted,
    },
    stepLabel: { ...typography.caption, color: Colors.textMuted },
    stepLabelActive: { color: Colors.teal, fontWeight: "600" },
    body: { flex: 1 },
    bodyContent: { padding: Spacing.lg, paddingBottom: 136 },
    sectionLabel: {
      ...typography.caption,
      color: Colors.textMuted,
      marginBottom: Spacing.md,
      marginTop: Spacing.sm,
      letterSpacing: 0.8,
      textTransform: "uppercase",
    },
    infoRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: Spacing.sm,
      marginBottom: Spacing.lg,
    },
    infoRowText: {
      ...typography.small,
      color: Colors.textMuted,
      flex: 1,
    },
    docsHint: {
      backgroundColor: "#1A2A40",
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      marginBottom: Spacing.md,
    },
    docsHintText: { ...typography.small, color: Colors.info, lineHeight: 20 },
    chips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: Spacing.sm,
      marginBottom: Spacing.lg,
    },
    chip: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    chipActive: { backgroundColor: Colors.teal + "25", borderColor: Colors.teal },
    chipText: { ...typography.bodyMedium, color: Colors.textSecondary },
    chipTextActive: { color: Colors.teal },
    typeGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: Spacing.sm,
      marginBottom: Spacing.lg,
    },
    expiryHint: {
      ...typography.small,
      color: Colors.textMuted,
      marginTop: -Spacing.sm,
      marginBottom: Spacing.lg,
    },
    emergencyNote: {
      ...typography.small,
      color: Colors.textMuted,
      marginTop: -Spacing.sm,
      marginBottom: Spacing.lg,
    },
    typeCard: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    typeCardActive: {
      backgroundColor: Colors.teal + "25",
      borderColor: Colors.teal,
    },
    typeText: { ...typography.bodyMedium, color: Colors.textSecondary },
    typeTextActive: { color: Colors.teal },
    estimateCard: {
      backgroundColor: Colors.surface,
      borderWidth: 1,
      borderColor: Colors.teal + "40",
      marginBottom: Spacing.xxl,
    },
    estimateLabel: {
      ...typography.small,
      color: Colors.teal,
      letterSpacing: 0.8,
      textTransform: "uppercase",
    },
    estimateAmount: { ...typography.h3, color: Colors.teal, marginTop: 4 },
    estimateTotal: {
      ...typography.small,
      color: Colors.textSecondary,
      marginTop: 2,
    },
    estimateNote: {
      ...typography.caption,
      color: Colors.textMuted,
      marginTop: Spacing.sm,
    },
    guarantorCard: { marginBottom: Spacing.md },
    guarantorHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    guarantorName: { ...typography.h4, color: Colors.textPrimary },
    removeText: { ...typography.smallMedium, color: Colors.danger },
    guarantorErrorText: { ...typography.small, color: Colors.danger },
    guarantorPhone: {
      ...typography.body,
      color: Colors.textSecondary,
      marginTop: 4,
    },
    addGuarantorCard: { marginBottom: Spacing.lg, gap: Spacing.sm },
    reviewRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
    reviewLabel: { ...typography.body, color: Colors.textSecondary },
    reviewValue: { ...typography.bodyMedium, color: Colors.textPrimary },
    reviewSection: {
      ...typography.h4,
      color: Colors.textPrimary,
      marginBottom: Spacing.sm,
    },
    reviewDetail: {
      ...typography.body,
      color: Colors.textSecondary,
      marginBottom: 4,
    },
  });
}
