import React, { useMemo } from "react";
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
import { Colors, Spacing, BorderRadius, useScaledTypography } from "../../src/theme";
import { useOffersViewModel, useAllOffersViewModel } from "../../src/viewmodels";
import { SkeletonList, InfoTip, RequiredDocumentsChecklist } from "../../src/components";
import type { LoanOffer } from "../../src/models";
import { formatDuration } from "../../src/services/duration";

// Matches mpola_api's REQUIRED_ACCEPTED_GUARANTORS (routers/loans.py).
const REQUIRED_ACCEPTED_GUARANTORS = 2;

/** Every offer ever received, across every application — shown when this
 * screen is opened with no specific request selected (e.g. Home's "Browse
 * Offers" quick action). Mirrors mpola_website's /dashboard/offers-received
 * default view. Read-only; "View & Respond" re-opens this same screen
 * scoped to that one request for the real accept/decline/document flow. */
function AllOffersView() {
  const router = useRouter();
  const typography = useScaledTypography();
  const styles = useMemo(() => makeStyles(typography), [typography]);
  const { offers, isLoading, bestOfferId } = useAllOffersViewModel();

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
        <Text style={styles.headerTitle}>Offers Received</Text>
        <Text style={styles.liveCount}>{offers.length} offer{offers.length === 1 ? "" : "s"}</Text>
      </View>

      {isLoading ? (
        <View style={styles.scroll}>
          <SkeletonList count={3} cardHeight={120} />
        </View>
      ) : offers.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            No offers yet — lenders will see your requests once you apply for a loan.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {offers.map((offer) => {
            const isBest = offer.id === bestOfferId;
            return (
              <TouchableOpacity
                key={offer.id}
                style={[styles.offerCard, isBest && styles.offerCardFeatured]}
                onPress={() =>
                  router.push({
                    pathname: "/(borrower)/offers",
                    params: { applicationId: offer.applicationId },
                  })
                }
              >
                {isBest && (
                  <View style={styles.bestRateBadge}>
                    <Text style={styles.bestRateText}>Best Rate</Text>
                  </View>
                )}
                <View style={styles.offerTop}>
                  <View style={styles.offerAvatar}>
                    <Text style={styles.offerAvatarText}>
                      {(offer.lenderName ?? "?")[0].toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.offerInfo}>
                    <View style={styles.offerNameRow}>
                      <Text style={styles.offerName}>{offer.lenderName ?? "Lender"}</Text>
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
                      {offer.templateId && (
                        <View style={styles.autoMatchedBadge}>
                          <Text style={styles.autoMatchedText}>Auto-matched</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.offerSub}>
                      {formatDuration(offer.duration, offer.durationDays)}
                      {offer.loanType ? ` · ${offer.loanType}` : ""}
                      {offer.applicationReference ? ` · #${offer.applicationReference}` : ""}
                    </Text>
                  </View>
                  <Text style={styles.offerRate}>{offer.interestRate}%/month</Text>
                </View>
                <Text style={styles.offerDetails}>
                  UGX {offer.amount.toLocaleString()} · Total repayable UGX{" "}
                  {(offer.totalRepayable ?? 0).toLocaleString()}
                </Text>
                <View style={styles.offerFooterRow}>
                  <Text style={styles.statusText}>Status: {offer.status}</Text>
                  <Text style={styles.tapHint}>
                    {offer.status === "pending" ? "Tap to respond →" : "Tap to view →"}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

/** One application's offers, with the full accept flow — guarantor
 * readiness, required-document upload, and Review & Accept into the
 * Loan Agreement screen. */
function SingleApplicationOffers({ applicationId }: { applicationId: string }) {
  const router = useRouter();
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

  const acceptedGuarantors = (application?.guarantors ?? []).filter(
    (g) => g.status === "accepted",
  ).length;
  const guarantorsReady = acceptedGuarantors >= REQUIRED_ACCEPTED_GUARANTORS;

  const bestOfferId = offers.reduce<string | null>((bestId, o) => {
    if (o.status !== "pending") return bestId;
    if (!bestId) return o.id;
    const best = offers.find((x) => x.id === bestId);
    return best && o.interestRate < best.interestRate ? o.id : bestId;
  }, null);

  const handleAccept = (offer: LoanOffer) => {
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
      params: { offerId: offer.id, applicationId: application?.id ?? "" },
    });
  };

  const handleDecline = (offer: LoanOffer) => {
    respondToOffer(offer.id, "declined").catch((e) =>
      Alert.alert(
        "Failed to decline offer",
        e instanceof Error ? e.message : "Please try again.",
      ),
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Offers Received</Text>
        <Text style={styles.liveCount}>{offers.length} offer{offers.length === 1 ? "" : "s"}</Text>
      </View>

      {isLoading ? (
        <View style={styles.scroll}>
          <SkeletonList count={3} cardHeight={120} />
        </View>
      ) : !application ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            Request not found.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.summaryRow}>
            <Text style={styles.appSummary}>
              UGX {application.amount.toLocaleString()} · {application.loanType} ·{" "}
              {formatDuration(application.duration, application.durationDays)}
            </Text>
            <InfoTip text="Accepting an offer immediately funds this loan and declines every other offer on it automatically — you can only accept one, and it requires both guarantors to have already approved." />
          </View>

          {!guarantorsReady && (
            <View style={styles.guarantorWarning}>
              <Text style={styles.guarantorWarningText}>
                Needs {REQUIRED_ACCEPTED_GUARANTORS} confirmed guarantors
                before you can accept an offer — {acceptedGuarantors} of{" "}
                {application.guarantors?.length ?? 0} confirmed so far.
              </Text>
            </View>
          )}

          {offers.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                No offers yet — lenders are reviewing your request.
              </Text>
            </View>
          ) : (
            offers.map((offer) => {
              const isBest = offer.id === bestOfferId;
              return (
                <View
                  key={offer.id}
                  style={[styles.offerCard, isBest && styles.offerCardFeatured]}
                >
                  {isBest && (
                    <View style={styles.bestRateBadge}>
                      <Text style={styles.bestRateText}>Best Rate</Text>
                    </View>
                  )}
                  <View style={styles.offerTop}>
                    <View style={styles.offerAvatar}>
                      <Text style={styles.offerAvatarText}>
                        {(offer.lenderName ?? "?")[0].toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.offerInfo}>
                      <View style={styles.offerNameRow}>
                        <Text style={styles.offerName}>
                          {offer.lenderName ?? "Lender"}
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
                        {offer.templateId && (
                          <View style={styles.autoMatchedBadge}>
                            <Text style={styles.autoMatchedText}>Auto-matched</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.offerSub}>
                        {formatDuration(offer.duration, offer.durationDays)} · UGX{" "}
                        {(offer.monthlyPayment ?? 0).toLocaleString()}
                        {offer.durationDays != null ? "" : "/mo"}
                      </Text>
                    </View>
                    <Text style={styles.offerRate}>
                      {offer.interestRate}%/month
                    </Text>
                  </View>
                  <Text style={styles.offerDetails}>
                    UGX {offer.amount.toLocaleString()} · Total repayable UGX{" "}
                    {(offer.totalRepayable ?? 0).toLocaleString()}
                  </Text>

                  {offer.status === "pending" && offer.requiredDocumentsStatus.length > 0 && (
                    <View style={styles.docsSection}>
                      <Text style={styles.docsHeading}>Documents this lender requires</Text>
                      <RequiredDocumentsChecklist
                        items={offer.requiredDocumentsStatus}
                        onUpload={uploadRequiredDocument}
                        uploadingType={uploadingDocumentType}
                        onUploadCustom={uploadCustomDocument}
                        onSaveCustomText={saveCustomDocumentText}
                        uploadingCustomLabel={uploadingCustomLabel}
                        onGoToProfile={() => router.push("/(borrower)/profile")}
                      />
                    </View>
                  )}

                  {offer.status === "pending" ? (
                    <View style={styles.actionsRow}>
                      <TouchableOpacity
                        style={styles.declineBtn}
                        onPress={() => handleDecline(offer)}
                        disabled={responding}
                      >
                        <Text style={styles.declineBtnText}>Decline</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.applyBtn}
                        onPress={() => handleAccept(offer)}
                        disabled={responding}
                      >
                        <Text style={styles.applyBtnText}>Review & Accept</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <Text style={styles.statusText}>
                      Status: {offer.status}
                    </Text>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

export default function OffersScreen() {
  const { applicationId } = useLocalSearchParams<{ applicationId?: string }>();
  return applicationId ? (
    <SingleApplicationOffers applicationId={applicationId} />
  ) : (
    <AllOffersView />
  );
}

function makeStyles(typography: ReturnType<typeof useScaledTypography>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.lg,
      gap: Spacing.sm,
    },
    headerTitle: { ...typography.h3, color: Colors.white, flex: 1 },
    liveCount: { ...typography.bodyMedium, color: Colors.teal },
    summaryRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: Spacing.sm,
      marginBottom: Spacing.lg,
    },
    appSummary: {
      ...typography.small,
      color: Colors.textMuted,
      flex: 1,
    },
    guarantorWarning: {
      backgroundColor: Colors.warningBg,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      marginBottom: Spacing.lg,
    },
    guarantorWarningText: { ...typography.small, color: Colors.warning },
    emptyState: { flex: 1, alignItems: "center", justifyContent: "center", padding: Spacing.xl },
    emptyText: { ...typography.body, color: Colors.textMuted, textAlign: "center" },
    scroll: { paddingHorizontal: Spacing.lg, paddingBottom: 40 },
    offerCard: {
      backgroundColor: Colors.surface,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.md,
      borderLeftWidth: 3,
      borderLeftColor: Colors.teal,
    },
    offerCardFeatured: { borderLeftWidth: 0 },
    bestRateBadge: {
      backgroundColor: Colors.teal + "30",
      alignSelf: "flex-start",
      paddingHorizontal: Spacing.md,
      paddingVertical: 3,
      borderRadius: BorderRadius.full,
      marginBottom: Spacing.sm,
    },
    bestRateText: {
      ...typography.caption,
      color: Colors.teal,
      fontWeight: "600",
    },
    offerTop: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: Spacing.sm,
    },
    offerAvatar: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: Colors.navy,
      alignItems: "center",
      justifyContent: "center",
      marginRight: Spacing.sm,
    },
    offerAvatarText: { ...typography.h4, color: Colors.white },
    offerInfo: { flex: 1 },
    offerNameRow: { flexDirection: "row", alignItems: "center", gap: Spacing.xs },
    offerName: { ...typography.bodyMedium, color: Colors.textPrimary },
    autoMatchedBadge: {
      backgroundColor: Colors.teal + "25",
      paddingHorizontal: Spacing.xs,
      paddingVertical: 2,
      borderRadius: BorderRadius.full,
    },
    autoMatchedText: { ...typography.caption, color: Colors.teal, fontWeight: "600" },
    verifiedBadge: {
      backgroundColor: Colors.teal + "25",
      paddingHorizontal: Spacing.xs,
      paddingVertical: 2,
      borderRadius: BorderRadius.full,
    },
    verifiedBadgeMuted: { backgroundColor: Colors.border },
    verifiedText: { ...typography.caption, color: Colors.teal, fontWeight: "600" },
    verifiedTextMuted: { color: Colors.textMuted },
    offerSub: { ...typography.small, color: Colors.textMuted },
    offerRate: { fontSize: 18, fontWeight: "700", color: Colors.textSecondary },
    offerDetails: {
      ...typography.small,
      color: Colors.textMuted,
      marginBottom: Spacing.md,
    },
    docsSection: { marginBottom: Spacing.md },
    docsHeading: {
      ...typography.smallMedium,
      color: Colors.textSecondary,
      marginBottom: Spacing.xs,
    },
    actionsRow: { flexDirection: "row", gap: Spacing.sm },
    applyBtn: {
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
    applyBtnText: { ...typography.buttonSmall, color: Colors.white },
    declineBtnText: { ...typography.buttonSmall, color: Colors.textSecondary },
    statusText: { ...typography.smallMedium, color: Colors.textMuted, textTransform: "capitalize" },
    offerFooterRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    tapHint: { ...typography.caption, color: Colors.teal },
  });
}
