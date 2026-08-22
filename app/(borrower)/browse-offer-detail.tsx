import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, BorderRadius, useScaledTypography } from "../../src/theme";
import { useOfferTemplateDetailViewModel } from "../../src/viewmodels";
import { SkeletonCard, RequiredDocumentsChecklist } from "../../src/components";
import { formatDuration } from "../../src/services/duration";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-UG", { month: "long", year: "numeric" });
}

/** Full detail behind one lender's standing offer, reached from
 * browse-offers.tsx. "Apply to This Offer" pushes the Apply tab with this
 * offer's terms pre-filled — it does NOT target this lender specifically,
 * the application still broadcasts to every qualifying lender same as
 * always (see useApplyViewModel's prefill handling). */
export default function BrowseOfferDetailScreen() {
  const router = useRouter();
  const { templateId } = useLocalSearchParams<{ templateId: string }>();
  const typography = useScaledTypography();
  const styles = useMemo(() => makeStyles(typography), [typography]);
  const { offer, isLoading, error, uploadRequiredDocument, uploadingDocumentType } =
    useOfferTemplateDetailViewModel(templateId);

  const handleApply = () => {
    if (!offer) return;
    router.push({
      pathname: "/(borrower)/(tabs)/apply",
      params: {
        loanType: offer.acceptedLoanTypes[0] ?? "",
        maxInterestRate: String(offer.interestRate),
        ...(offer.maxDurationDays != null
          ? { durationDays: String(offer.maxDurationDays) }
          : offer.maxDuration != null
            ? { duration: String(offer.maxDuration) }
            : {}),
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Go back" accessibilityRole="button">
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Offer Detail</Text>
        <View style={{ width: 24 }} />
      </View>

      {isLoading ? (
        <View style={styles.scroll}>
          <SkeletonCard height={280} />
        </View>
      ) : !offer ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            {error instanceof Error && error.message
              ? error.message
              : "This offer is no longer available."}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.lenderRow}>
            <View style={styles.avatarWrap}>
              <Text style={styles.avatarText}>{(offer.lenderName ?? "?").slice(0, 2).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.lenderName}>{offer.lenderName ?? "Lender"}</Text>
              <Text style={styles.lenderMeta}>
                {offer.city ? `${offer.city} · ` : ""}Member since {formatDate(offer.lenderMemberSince)}
              </Text>
              <View
                style={[
                  styles.verifiedBadge,
                  offer.lenderKycStatus !== "verified" && styles.verifiedBadgeMuted,
                ]}
              >
                <Text
                  style={[
                    styles.verifiedText,
                    offer.lenderKycStatus !== "verified" && styles.verifiedTextMuted,
                  ]}
                >
                  {offer.lenderKycStatus === "verified" ? "Verified" : "Not Verified"}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.statGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>INTEREST RATE</Text>
              <Text style={[styles.statValue, { color: Colors.teal }]}>{offer.interestRate}%/mo</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>MAX AMOUNT</Text>
              <Text style={styles.statValue}>UGX {offer.maxAmount.toLocaleString()}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>MIN AMOUNT</Text>
              <Text style={styles.statValue}>UGX {offer.minAmount.toLocaleString()}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>MAX DURATION</Text>
              <Text style={styles.statValue}>{formatDuration(offer.maxDuration, offer.maxDurationDays)}</Text>
            </View>
          </View>

          {offer.description && <Text style={styles.description}>{offer.description}</Text>}

          <Text style={styles.sectionLabel}>Accepted Loan Types</Text>
          <View style={styles.chipsRow}>
            {offer.acceptedLoanTypes.length === 0 ? (
              <Text style={styles.lenderMeta}>All loan types</Text>
            ) : (
              offer.acceptedLoanTypes.map((t) => (
                <View key={t} style={styles.chip}>
                  <Text style={styles.chipText}>{t}</Text>
                </View>
              ))
            )}
          </View>

          {offer.requiredDocumentsStatus.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Required Documents</Text>
              <Text style={styles.docsHint}>
                Get ready before you apply — already-uploaded ones (KYC or a
                past application) count automatically.
              </Text>
              <View style={{ marginBottom: Spacing.lg }}>
                <RequiredDocumentsChecklist
                  items={offer.requiredDocumentsStatus}
                  onUpload={uploadRequiredDocument}
                  uploadingType={uploadingDocumentType}
                  onGoToProfile={() => router.push("/(borrower)/profile")}
                />
              </View>
            </>
          )}

          <Text style={styles.appCount}>{offer.applicationsCount} applications matched so far</Text>

          <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
            <Text style={styles.applyBtnText}>Apply to This Offer</Text>
            <Ionicons name="arrow-forward" size={18} color={Colors.white} />
          </TouchableOpacity>
        </ScrollView>
      )}
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
      paddingVertical: Spacing.lg,
    },
    headerTitle: { ...typography.h3, color: Colors.white },
    scroll: { padding: Spacing.lg, paddingBottom: 136 },
    emptyState: { flex: 1, alignItems: "center", justifyContent: "center", padding: Spacing.xl },
    emptyText: { ...typography.body, color: Colors.textMuted, textAlign: "center" },
    lenderRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: Colors.surface,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.lg,
      gap: Spacing.md,
    },
    avatarWrap: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: Colors.navy,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: { ...typography.h4, color: Colors.white },
    lenderName: { ...typography.h3, color: Colors.textPrimary },
    lenderMeta: { ...typography.small, color: Colors.textMuted, marginTop: 2 },
    verifiedBadge: {
      alignSelf: "flex-start",
      backgroundColor: Colors.tealLight,
      borderRadius: BorderRadius.full,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      marginTop: Spacing.xs,
    },
    verifiedBadgeMuted: { backgroundColor: Colors.surfaceAlt },
    verifiedText: { ...typography.caption, color: Colors.teal, fontWeight: "600" },
    verifiedTextMuted: { color: Colors.textMuted },
    statGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm, marginBottom: Spacing.lg },
    statBox: {
      flexBasis: "47%",
      backgroundColor: Colors.surface,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      alignItems: "center",
    },
    statLabel: { ...typography.caption, color: Colors.textMuted, marginBottom: 4 },
    statValue: { ...typography.h4, color: Colors.textPrimary },
    description: { ...typography.body, color: Colors.textSecondary, marginBottom: Spacing.lg },
    sectionLabel: {
      ...typography.caption,
      color: Colors.textMuted,
      textTransform: "uppercase",
      marginBottom: Spacing.sm,
    },
    docsHint: { ...typography.caption, color: Colors.textMuted, marginBottom: Spacing.sm },
    chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm, marginBottom: Spacing.lg },
    chip: {
      backgroundColor: Colors.surfaceAlt,
      borderRadius: BorderRadius.full,
      paddingHorizontal: Spacing.md,
      paddingVertical: 6,
    },
    chipText: { ...typography.smallMedium, color: Colors.textSecondary, textTransform: "capitalize" },
    appCount: { ...typography.caption, color: Colors.textMuted, marginBottom: Spacing.lg },
    applyBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: Spacing.sm,
      backgroundColor: Colors.teal,
      borderRadius: BorderRadius.md,
      paddingVertical: Spacing.md,
    },
    applyBtnText: { ...typography.bodyMedium, color: Colors.white, fontWeight: "700" },
  });
}
