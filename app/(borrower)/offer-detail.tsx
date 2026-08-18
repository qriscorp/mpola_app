import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, BorderRadius, useScaledTypography } from "../../src/theme";
import { useOffersViewModel } from "../../src/viewmodels";
import { SkeletonCard, InfoTip, RequiredDocumentsChecklist } from "../../src/components";
import { formatDuration } from "../../src/services/duration";

// Matches mpola_api's REQUIRED_ACCEPTED_GUARANTORS (routers/loans.py).
const REQUIRED_ACCEPTED_GUARANTORS = 2;

function formatDate(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-UG", { day: "numeric", month: "long", year: "numeric" });
}

function DetailRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  const typography = useScaledTypography();
  const styles = useMemo(() => makeStyles(typography), [typography]);
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, valueColor ? { color: valueColor } : null]}>{value}</Text>
    </View>
  );
}

/** The full picture behind one specific offer — who made it, every term,
 * and what's still needed before it can be accepted. Reached by tapping
 * any offer card, whether from Browse Offers (all offers ever received) or
 * a single request's offer list — accept/decline both live here now,
 * instead of being buried inline on a compact list card. */
export default function OfferDetailScreen() {
  const router = useRouter();
  const { applicationId, offerId } = useLocalSearchParams<{
    applicationId: string;
    offerId: string;
  }>();
  const typography = useScaledTypography();
  const styles = useMemo(() => makeStyles(typography), [typography]);
  const {
    application,
    offers,
    isLoading,
    respondToOffer,
    responding,
    uploadRequiredDocument,
    uploadingDocumentType,
    uploadCustomDocument,
    saveCustomDocumentText,
    uploadingCustomLabel,
  } = useOffersViewModel(applicationId);

  const offer = offers.find((o) => o.id === offerId);

  const acceptedGuarantors = (application?.guarantors ?? []).filter(
    (g) => g.status === "accepted",
  ).length;
  const guarantorsReady = acceptedGuarantors >= REQUIRED_ACCEPTED_GUARANTORS;

  const handleAccept = () => {
    if (!offer) return;
    if (!guarantorsReady) {
      Alert.alert(
        "Guarantors needed",
        `You need ${REQUIRED_ACCEPTED_GUARANTORS} guarantors to confirm before this loan can be disbursed — ${acceptedGuarantors} of ${application?.guarantors?.length ?? 0} confirmed so far.`,
      );
      return;
    }
    const missingDocs = offer.requiredDocumentsStatus.filter((d) => !d.satisfied);
    if (missingDocs.length > 0) {
      Alert.alert(
        "Documents needed",
        `This lender requires: ${missingDocs.map((d) => d.label).join(", ")}. Upload or provide them below before accepting.`,
      );
      return;
    }
    router.push({
      pathname: "/(borrower)/sign-agreement",
      params: { offerId: offer.id, applicationId },
    });
  };

  const handleDecline = () => {
    if (!offer) return;
    Alert.alert("Decline this offer?", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Decline",
        style: "destructive",
        onPress: () => {
          respondToOffer(offer.id, "declined")
            .then(() => router.back())
            .catch((e) =>
              Alert.alert(
                "Failed to decline offer",
                e instanceof Error ? e.message : "Please try again.",
              ),
            );
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Offer Details</Text>
        <View style={{ width: 24 }} />
      </View>

      {isLoading ? (
        <View style={styles.scroll}>
          <SkeletonCard height={120} />
          <View style={{ height: Spacing.md }} />
          <SkeletonCard height={200} />
        </View>
      ) : !offer ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Offer not found.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Lender — the creator of this offer */}
          <View style={styles.lenderCard}>
            <View style={styles.lenderAvatar}>
              <Text style={styles.lenderAvatarText}>
                {(offer.lenderName ?? "?")[0].toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.lenderNameRow}>
                <Text style={styles.lenderName}>{offer.lenderName ?? "Lender"}</Text>
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
              {offer.templateId && (
                <View style={styles.autoMatchedBadge}>
                  <Text style={styles.autoMatchedText}>Auto-matched from a standing offer</Text>
                </View>
              )}
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>{offer.status}</Text>
            </View>
          </View>

          {/* Terms */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Offer Terms</Text>
            <View style={styles.termsGrid}>
              <View style={styles.termCell}>
                <Text style={styles.termLabel}>Amount</Text>
                <Text style={styles.termValue}>UGX {offer.amount.toLocaleString()}</Text>
              </View>
              <View style={styles.termCell}>
                <Text style={styles.termLabel}>Rate</Text>
                <Text style={[styles.termValue, { color: Colors.teal }]}>
                  {offer.interestRate}%/month
                </Text>
              </View>
              <View style={styles.termCell}>
                <Text style={styles.termLabel}>Duration</Text>
                <Text style={styles.termValue}>
                  {formatDuration(offer.duration, offer.durationDays)}
                </Text>
              </View>
              <View style={styles.termCell}>
                <Text style={styles.termLabel}>
                  {offer.durationDays != null ? "Repayment Due" : "Monthly Payment"}
                </Text>
                <Text style={styles.termValue}>
                  UGX {(offer.monthlyPayment ?? 0).toLocaleString()}
                </Text>
              </View>
            </View>
            <DetailRow
              label="Total Repayable"
              value={`UGX ${(offer.totalRepayable ?? 0).toLocaleString()}`}
              valueColor={Colors.teal}
            />
            {offer.applicationReference && (
              <DetailRow label="Request Reference" value={`#${offer.applicationReference}`} />
            )}
            {offer.loanType && (
              <DetailRow
                label="Loan Type"
                value={offer.loanType.charAt(0).toUpperCase() + offer.loanType.slice(1)}
              />
            )}
            <DetailRow label="Offer Made" value={formatDate(offer.createdAt)} />
          </View>

          {!guarantorsReady && offer.status === "pending" && (
            <View style={styles.guarantorWarning}>
              <Text style={styles.guarantorWarningText}>
                Needs {REQUIRED_ACCEPTED_GUARANTORS} confirmed guarantors before you can
                accept — {acceptedGuarantors} of {application?.guarantors?.length ?? 0}{" "}
                confirmed so far.
              </Text>
            </View>
          )}

          {offer.requiredDocumentsStatus.length > 0 && (
            <View style={styles.card}>
              <View style={styles.docsHeadingRow}>
                <Text style={styles.cardTitle}>Documents This Lender Requires</Text>
                <InfoTip text="Already-uploaded documents (KYC or from a past offer) count automatically." />
              </View>
              <RequiredDocumentsChecklist
                items={offer.requiredDocumentsStatus}
                onUpload={uploadRequiredDocument}
                uploadingType={uploadingDocumentType}
                onUploadCustom={uploadCustomDocument}
                onSaveCustomText={saveCustomDocumentText}
                uploadingCustomLabel={uploadingCustomLabel}
                readOnly={offer.status !== "pending"}
                onGoToProfile={() => router.push("/(borrower)/profile")}
              />
            </View>
          )}

          {offer.status === "pending" && (
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.declineBtn}
                onPress={handleDecline}
                disabled={responding}
              >
                <Text style={styles.declineBtnText}>Decline</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.acceptBtn}
                onPress={handleAccept}
                disabled={responding}
              >
                <Text style={styles.acceptBtnText}>Review & Accept</Text>
              </TouchableOpacity>
            </View>
          )}
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
    scroll: { paddingHorizontal: Spacing.lg, paddingBottom: 40 },
    emptyState: { flex: 1, alignItems: "center", justifyContent: "center", padding: Spacing.xl },
    emptyText: { ...typography.body, color: Colors.textMuted, textAlign: "center" },
    lenderCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: Colors.surface,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.md,
      gap: Spacing.sm,
    },
    lenderAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: Colors.navy,
      alignItems: "center",
      justifyContent: "center",
    },
    lenderAvatarText: { ...typography.h3, color: Colors.white },
    lenderNameRow: { flexDirection: "row", alignItems: "center", gap: Spacing.xs },
    lenderName: { ...typography.bodyMedium, color: Colors.textPrimary },
    verifiedBadge: {
      backgroundColor: Colors.teal + "25",
      paddingHorizontal: Spacing.xs,
      paddingVertical: 2,
      borderRadius: BorderRadius.full,
    },
    verifiedBadgeMuted: { backgroundColor: Colors.border },
    verifiedText: { ...typography.caption, color: Colors.teal, fontWeight: "600" },
    verifiedTextMuted: { color: Colors.textMuted },
    autoMatchedBadge: {
      alignSelf: "flex-start",
      backgroundColor: Colors.teal + "25",
      paddingHorizontal: Spacing.xs,
      paddingVertical: 2,
      borderRadius: BorderRadius.full,
      marginTop: Spacing.xs,
    },
    autoMatchedText: { ...typography.caption, color: Colors.teal, fontWeight: "600" },
    statusBadge: {
      backgroundColor: Colors.surfaceLift,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 3,
      borderRadius: BorderRadius.full,
    },
    statusBadgeText: {
      ...typography.caption,
      color: Colors.textSecondary,
      fontWeight: "600",
      textTransform: "capitalize",
    },
    card: {
      backgroundColor: Colors.surface,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.md,
    },
    cardTitle: { ...typography.smallMedium, color: Colors.textSecondary, marginBottom: Spacing.md },
    docsHeadingRow: { flexDirection: "row", alignItems: "center", gap: Spacing.xs, marginBottom: -Spacing.sm },
    termsGrid: { flexDirection: "row", flexWrap: "wrap", marginBottom: Spacing.sm },
    termCell: { width: "50%", marginBottom: Spacing.md },
    termLabel: { ...typography.caption, color: Colors.textMuted },
    termValue: { ...typography.h4, color: Colors.textPrimary, marginTop: 2 },
    detailRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: Spacing.xs,
      borderTopWidth: 1,
      borderTopColor: Colors.border,
    },
    detailLabel: { ...typography.small, color: Colors.textMuted },
    detailValue: { ...typography.smallMedium, color: Colors.textPrimary },
    guarantorWarning: {
      backgroundColor: Colors.warningBg,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      marginBottom: Spacing.md,
    },
    guarantorWarningText: { ...typography.small, color: Colors.warning },
    actionsRow: { flexDirection: "row", gap: Spacing.sm, marginTop: Spacing.sm },
    acceptBtn: {
      flex: 1,
      borderRadius: BorderRadius.full,
      paddingVertical: Spacing.sm,
      alignItems: "center",
      backgroundColor: Colors.teal,
    },
    declineBtn: {
      flex: 1,
      borderRadius: BorderRadius.full,
      paddingVertical: Spacing.sm,
      alignItems: "center",
      borderWidth: 1,
      borderColor: Colors.border,
    },
    acceptBtnText: { ...typography.buttonSmall, color: Colors.white },
    declineBtnText: { ...typography.buttonSmall, color: Colors.textSecondary },
  });
}
