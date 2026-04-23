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
import { Button, Card, Input } from "../../src/components";
import { useApplyViewModel } from "../../src/viewmodels";
import type { LoanType } from "../../src/models";

const loanTypeLabels: Record<LoanType, string> = {
  personal: "Personal",
  business: "Business",
  real_estate: "Real Estate",
  education: "Education",
};

export default function ApplyScreen() {
  const router = useRouter();
  const vm = useApplyViewModel();

  const stepLabels = ["Details", "Docs", "Guarantors", "Lenders", "Review"];

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
        <View style={{ width: 24 }} />
      </View>

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
            <Input
              label="Loan Amount"
              value={vm.amount}
              onChangeText={vm.setAmount}
              prefix="UGX"
              keyboardType="numeric"
            />

            <Text style={styles.sectionLabel}>Duration</Text>
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

            <Card style={styles.estimateCard}>
              <Text style={styles.estimateLabel}>Estimated Repayment</Text>
              <Text style={styles.estimateAmount}>
                ~UGX {vm.monthlyPayment.toLocaleString()}/month
              </Text>
              <Text style={styles.estimateTotal}>
                UGX {vm.totalRepayable.toLocaleString()} total
              </Text>
            </Card>

            <Button
              title="Next: Upload Documents →"
              onPress={vm.nextStep}
              color={Colors.teal}
            />
          </>
        )}

        {/* Step 2: Documents */}
        {vm.step === 2 && (
          <>
            <Text style={styles.sectionLabel}>Required Documents</Text>
            {vm.documents
              .filter((d) => d.required)
              .map((doc) => (
                <View key={doc.id} style={styles.docRow}>
                  <View style={styles.docInfo}>
                    <Text style={styles.docName}>{doc.name}</Text>
                    <Text
                      style={[
                        styles.docStatus,
                        {
                          color:
                            doc.status === "uploaded"
                              ? Colors.success
                              : Colors.warning,
                        },
                      ]}
                    >
                      {doc.status === "uploaded" ? "✓ Done" : "Upload"}
                    </Text>
                  </View>
                  {doc.status === "pending" && (
                    <TouchableOpacity
                      style={styles.uploadBtn}
                      onPress={() => vm.uploadDocument(doc.id)}
                    >
                      <Text style={styles.uploadBtnText}>Upload</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}

            <Text style={[styles.sectionLabel, { marginTop: Spacing.xxl }]}>
              Optional
            </Text>
            {vm.documents
              .filter((d) => !d.required)
              .map((doc) => (
                <View key={doc.id} style={styles.docRow}>
                  <View style={styles.docInfo}>
                    <Text style={styles.docName}>{doc.name}</Text>
                    <Text
                      style={[styles.docStatus, { color: Colors.textMuted }]}
                    >
                      Optional
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.uploadBtn}
                    onPress={() => vm.uploadDocument(doc.id)}
                  >
                    <Text style={styles.uploadBtnText}>Upload</Text>
                  </TouchableOpacity>
                </View>
              ))}

            <View style={{ height: Spacing.xxl }} />
            <Button
              title="Next: Add Guarantors →"
              onPress={vm.nextStep}
              color={Colors.teal}
            />
          </>
        )}

        {/* Step 3: Guarantors */}
        {vm.step === 3 && (
          <>
            {vm.guarantors.map((g) => (
              <Card key={g.id} style={styles.guarantorCard}>
                <View style={styles.guarantorHeader}>
                  <Text style={styles.guarantorName}>{g.name}</Text>
                  <View
                    style={[
                      styles.guarantorBadge,
                      {
                        backgroundColor:
                          g.status === "accepted"
                            ? Colors.successBg
                            : Colors.warningBg,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        ...Typography.caption,
                        fontWeight: "600",
                        color:
                          g.status === "accepted"
                            ? Colors.success
                            : Colors.warning,
                      }}
                    >
                      {g.status === "accepted" ? "Accepted ✓" : "Pending"}
                    </Text>
                  </View>
                </View>
                <Text style={styles.guarantorPhone}>{g.phone}</Text>
                <Text style={styles.guarantorLabel}>
                  Guarantor {g.order} of 2
                </Text>
                {g.status === "pending" && (
                  <Text style={styles.smsNote}>SMS invite sent</Text>
                )}
              </Card>
            ))}

            <TouchableOpacity style={styles.addGuarantor}>
              <Ionicons name="add" size={20} color={Colors.teal} />
              <Text style={styles.addGuarantorText}>Add Another Guarantor</Text>
            </TouchableOpacity>

            <Card style={styles.infoBox}>
              <Ionicons
                name="information-circle-outline"
                size={18}
                color={Colors.info}
              />
              <Text style={styles.infoText}>
                Both guarantors must accept before you can proceed
              </Text>
            </Card>

            <Button
              title="Continue →"
              onPress={vm.nextStep}
              color={Colors.teal}
            />
          </>
        )}

        {/* Step 4: Choose Lenders */}
        {vm.step === 4 && (
          <>
            {vm.lenders.map((lender) => {
              const selected = vm.selectedLenders.includes(lender.id);
              return (
                <TouchableOpacity
                  key={lender.id}
                  onPress={() => vm.toggleLender(lender.id)}
                  style={[
                    styles.lenderCard,
                    selected && styles.lenderCardSelected,
                  ]}
                >
                  <View style={styles.lenderHeader}>
                    <Text style={styles.lenderName}>{lender.name}</Text>
                    {lender.recommended && (
                      <View style={styles.recommendedBadge}>
                        <Text style={styles.recommendedText}>
                          ★ Recommended
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.lenderRate}>
                    {lender.repaymentRate}% repayment rate
                  </Text>
                  <View style={styles.lenderDetails}>
                    <Text style={styles.lenderDetail}>
                      {lender.interestRate}%/mo
                    </Text>
                    <Text style={styles.lenderDetail}>
                      UGX {(lender.maxAmount / 1000000).toFixed(0)}M max
                    </Text>
                  </View>
                  {selected && (
                    <View style={styles.selectedCheck}>
                      <Ionicons
                        name="checkmark-circle"
                        size={22}
                        color={Colors.teal}
                      />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
            <View style={{ height: Spacing.lg }} />
            <Button
              title="Next: Review & Submit →"
              onPress={vm.nextStep}
              color={Colors.teal}
            />
          </>
        )}

        {/* Step 5: Review */}
        {vm.step === 5 && (
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
                <Text style={styles.reviewValue}>{vm.duration} months</Text>
              </View>
            </Card>

            <Card style={{ marginBottom: Spacing.md }}>
              <Text style={styles.reviewSection}>Documents</Text>
              <Text style={styles.reviewDetail}>
                {vm.documents.filter((d) => d.status === "uploaded").length}{" "}
                uploaded
              </Text>
            </Card>

            <Card style={{ marginBottom: Spacing.md }}>
              <Text style={styles.reviewSection}>Guarantors</Text>
              {vm.guarantors.map((g) => (
                <Text key={g.id} style={styles.reviewDetail}>
                  {g.name} —{" "}
                  {g.status === "accepted" ? "✓ Confirmed" : "Pending"}
                </Text>
              ))}
            </Card>

            <Card style={{ marginBottom: Spacing.xxl }}>
              <Text style={styles.reviewSection}>Selected Lender</Text>
              {vm.lenders
                .filter((l) => vm.selectedLenders.includes(l.id))
                .map((l) => (
                  <Text key={l.id} style={styles.reviewDetail}>
                    {l.name} — {l.interestRate}%/mo
                  </Text>
                ))}
            </Card>

            <Button
              title="Submit Application 🚀"
              onPress={async () => {
                await vm.submitApplication();
                router.push("/(borrower)/application-sent");
              }}
              color={Colors.teal}
            />
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
    ...Typography.caption,
    fontWeight: "700",
    color: Colors.textMuted,
  },
  stepLabel: { ...Typography.caption, color: Colors.textMuted },
  stepLabelActive: { color: Colors.teal, fontWeight: "600" },
  body: { flex: 1 },
  bodyContent: { padding: Spacing.lg, paddingBottom: 40 },
  sectionLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
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
  chipText: { ...Typography.bodyMedium, color: Colors.textSecondary },
  chipTextActive: { color: Colors.teal },
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
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
  typeText: { ...Typography.bodyMedium, color: Colors.textSecondary },
  typeTextActive: { color: Colors.teal },
  estimateCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.teal + "40",
    marginBottom: Spacing.xxl,
  },
  estimateLabel: {
    ...Typography.small,
    color: Colors.teal,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  estimateAmount: { ...Typography.h3, color: Colors.teal, marginTop: 4 },
  estimateTotal: {
    ...Typography.small,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  docRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  docInfo: { flex: 1 },
  docName: { ...Typography.bodyMedium, color: Colors.textPrimary },
  docStatus: { ...Typography.small, marginTop: 2 },
  uploadBtn: {
    backgroundColor: Colors.teal + "25",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  uploadBtnText: { ...Typography.smallMedium, color: Colors.teal },
  guarantorCard: { marginBottom: Spacing.md },
  guarantorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  guarantorName: { ...Typography.h4, color: Colors.textPrimary },
  guarantorBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  guarantorPhone: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  guarantorLabel: {
    ...Typography.small,
    color: Colors.textMuted,
    marginTop: 2,
  },
  smsNote: {
    ...Typography.small,
    color: Colors.warning,
    fontStyle: "italic",
    marginTop: 4,
  },
  addGuarantor: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: Colors.teal,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  addGuarantorText: { ...Typography.bodyMedium, color: Colors.teal },
  infoBox: {
    flexDirection: "row",
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    marginBottom: Spacing.xxl,
    alignItems: "center",
  },
  infoText: { ...Typography.small, color: Colors.textSecondary, flex: 1 },
  lenderCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  lenderCardSelected: {
    borderColor: Colors.teal,
    backgroundColor: Colors.teal + "15",
  },
  lenderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lenderName: { ...Typography.h4, color: Colors.textPrimary },
  recommendedBadge: {
    backgroundColor: Colors.gold + "25",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  recommendedText: {
    ...Typography.caption,
    color: Colors.gold,
    fontWeight: "600",
  },
  lenderRate: {
    ...Typography.small,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  lenderDetails: {
    flexDirection: "row",
    gap: Spacing.lg,
    marginTop: Spacing.sm,
  },
  lenderDetail: { ...Typography.bodyMedium, color: Colors.textPrimary },
  selectedCheck: { position: "absolute", top: Spacing.lg, right: Spacing.lg },
  reviewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  reviewLabel: { ...Typography.body, color: Colors.textSecondary },
  reviewValue: { ...Typography.bodyMedium, color: Colors.textPrimary },
  reviewSection: {
    ...Typography.h4,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  reviewDetail: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
});
