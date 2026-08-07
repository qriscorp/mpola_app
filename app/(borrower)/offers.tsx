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
import { Colors, Typography, Spacing, BorderRadius } from "../../src/theme";
import { useOffersViewModel } from "../../src/viewmodels";
import { SkeletonList } from "../../src/components";
import type { LoanOffer } from "../../src/models";

// Matches mpola_api's REQUIRED_ACCEPTED_GUARANTORS (routers/loans.py).
const REQUIRED_ACCEPTED_GUARANTORS = 2;

export default function OffersScreen() {
  const router = useRouter();
  const { applicationId } = useLocalSearchParams<{ applicationId?: string }>();
  const { application, offers, isLoading, respondToOffer, responding } =
    useOffersViewModel(applicationId);

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
    Alert.alert(
      "Accept this offer?",
      `${offer.lenderName ?? "This lender"} will disburse UGX ${offer.amount.toLocaleString()} to your Mpola wallet. You'll need a wallet set up to receive it.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Accept",
          onPress: async () => {
            try {
              await respondToOffer(offer.id, "accepted");
              router.push({
                pathname: "/(borrower)/loan-approved",
                params: {
                  lenderName: offer.lenderName ?? "Lender",
                  amount: String(offer.amount),
                  interestRate: String(offer.interestRate),
                  totalRepayable: String(offer.totalRepayable ?? 0),
                },
              });
            } catch (e) {
              Alert.alert(
                "Failed to accept offer",
                e instanceof Error ? e.message : "Please try again.",
              );
            }
          },
        },
      ],
    );
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
        <View style={styles.logoBox}>
          <Text style={styles.logoLetter}>M</Text>
        </View>
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
            You don&apos;t have a pending loan request yet.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.appSummary}>
            UGX {application.amount.toLocaleString()} · {application.loanType} ·{" "}
            {application.duration} months
          </Text>

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
                      <Text style={styles.offerName}>
                        {offer.lenderName ?? "Lender"}
                      </Text>
                      <Text style={styles.offerSub}>
                        {offer.duration} months · UGX{" "}
                        {(offer.monthlyPayment ?? 0).toLocaleString()}/mo
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
                        <Text style={styles.applyBtnText}>Accept Offer</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  logoBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: Colors.teal,
    alignItems: "center",
    justifyContent: "center",
  },
  logoLetter: { fontSize: 16, fontWeight: "700", color: Colors.white },
  headerTitle: { ...Typography.h3, color: Colors.white, flex: 1 },
  liveCount: { ...Typography.bodyMedium, color: Colors.teal },
  appSummary: {
    ...Typography.small,
    color: Colors.textMuted,
    marginBottom: Spacing.lg,
  },
  guarantorWarning: {
    backgroundColor: Colors.warningBg,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  guarantorWarningText: { ...Typography.small, color: Colors.warning },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", padding: Spacing.xl },
  emptyText: { ...Typography.body, color: Colors.textMuted, textAlign: "center" },
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
    ...Typography.caption,
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
  offerAvatarText: { ...Typography.h4, color: Colors.white },
  offerInfo: { flex: 1 },
  offerName: { ...Typography.bodyMedium, color: Colors.textPrimary },
  offerSub: { ...Typography.small, color: Colors.textMuted },
  offerRate: { fontSize: 18, fontWeight: "700", color: Colors.textSecondary },
  offerDetails: {
    ...Typography.small,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
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
  applyBtnText: { ...Typography.buttonSmall, color: Colors.white },
  declineBtnText: { ...Typography.buttonSmall, color: Colors.textSecondary },
  statusText: { ...Typography.smallMedium, color: Colors.textMuted, textTransform: "capitalize" },
});
