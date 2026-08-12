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
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, BorderRadius } from "../../src/theme";
import { Badge, SkeletonList } from "../../src/components";
import {
  useMyOfferTemplatesViewModel,
  useOfferTemplateMatchesViewModel,
} from "../../src/viewmodels";
import type { OfferTemplate, LoanOffer } from "../../src/models";
import { formatDuration } from "../../src/services/duration";

const statusVariant: Record<OfferTemplate["status"], "warning" | "default" | "success" | "danger"> = {
  pending_review: "warning",
  draft: "default",
  approved: "success",
  rejected: "danger",
};

const statusLabel: Record<OfferTemplate["status"], string> = {
  pending_review: "Pending Review",
  draft: "Draft",
  approved: "Approved",
  rejected: "Rejected",
};

const offerStatusVariant: Record<LoanOffer["status"], "warning" | "default" | "success"> = {
  pending: "warning",
  accepted: "success",
  declined: "default",
  expired: "default",
};

const offerStatusLabel: Record<LoanOffer["status"], string> = {
  pending: "Pending",
  accepted: "Accepted",
  declined: "Declined",
  expired: "Expired",
};

function MatchedRequestsSection({ template }: { template: OfferTemplate }) {
  const router = useRouter();
  const [expanded, setExpanded] = React.useState(false);
  const { matches, isLoading } = useOfferTemplateMatchesViewModel(template.id, expanded);

  return (
    <View style={styles.matchedBlock}>
      <TouchableOpacity
        style={styles.matchedHeader}
        onPress={() => setExpanded((e) => !e)}
      >
        <Text style={styles.matchedHeaderText}>
          Matched Requests ({template.matchedCount})
          {template.pendingCount > 0 && (
            <Text style={styles.matchedPendingText}> · {template.pendingCount} awaiting borrower</Text>
          )}
          {template.acceptedCount > 0 && (
            <Text style={styles.matchedAcceptedText}> · {template.acceptedCount} accepted</Text>
          )}
        </Text>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={16}
          color={Colors.textMuted}
        />
      </TouchableOpacity>

      {expanded && (
        <View style={{ gap: Spacing.xs }}>
          {isLoading ? (
            <Text style={styles.matchedEmpty}>Loading…</Text>
          ) : matches.length === 0 ? (
            <Text style={styles.matchedEmpty}>No matches yet.</Text>
          ) : (
            matches.map((o) => (
              <TouchableOpacity
                key={o.id}
                style={styles.matchedRow}
                onPress={() =>
                  router.push({
                    pathname: "/(lender)/borrower-profile",
                    params: { applicationId: o.applicationId },
                  })
                }
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.matchedRowTitle}>
                    {o.borrowerName ?? "Unknown borrower"} · UGX {o.amount.toLocaleString()}
                  </Text>
                  <Text style={styles.matchedRowSubtitle}>
                    {o.loanType ?? "loan"}
                    {o.applicationReference ? ` · #${o.applicationReference}` : ""}
                  </Text>
                </View>
                <Badge label={offerStatusLabel[o.status]} variant={offerStatusVariant[o.status]} />
              </TouchableOpacity>
            ))
          )}
        </View>
      )}
    </View>
  );
}

export default function MyOffersScreen() {
  const router = useRouter();
  const {
    templates,
    isLoading,
    deleteTemplate,
    freezeTemplate,
    unfreezeTemplate,
    extendExpiry,
    isMutating,
    isExtendingExpiry,
  } = useMyOfferTemplatesViewModel();

  const handleDelete = (t: OfferTemplate) => {
    Alert.alert(
      "Delete this offer?",
      "This can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteTemplate(t.id);
            } catch (e: any) {
              Alert.alert("Failed to delete", e?.message || "Please try again.");
            }
          },
        },
      ],
    );
  };

  const handleFreeze = async (t: OfferTemplate) => {
    try {
      await freezeTemplate(t.id);
    } catch (e: any) {
      Alert.alert("Failed to freeze", e?.message || "Please try again.");
    }
  };

  const handleUnfreeze = async (t: OfferTemplate) => {
    try {
      await unfreezeTemplate(t.id);
    } catch (e: any) {
      Alert.alert("Failed to unfreeze", e?.message || "Please try again.");
    }
  };

  const handleExtendExpiry = (t: OfferTemplate, days: number | null) => {
    const validUntil =
      days === null
        ? null
        : new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    Alert.alert(
      days === null ? "Clear expiry?" : `Extend expiry by ${days} days?`,
      days === null
        ? "This offer will no longer have an expiry date."
        : `This offer will now expire on ${new Date(validUntil!).toLocaleDateString()}.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            try {
              await extendExpiry({ id: t.id, validUntil });
            } catch (e: any) {
              Alert.alert("Failed to update expiry", e?.message || "Please try again.");
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Standing Offers</Text>
        <TouchableOpacity onPress={() => router.push("/(lender)/post-offer")}>
          <Ionicons name="add" size={26} color={Colors.gold} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {isLoading ? (
          <SkeletonList count={3} cardHeight={130} />
        ) : templates.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              You haven't posted any standing offers yet.
            </Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => router.push("/(lender)/post-offer")}
            >
              <Text style={styles.emptyBtnText}>Post an Offer</Text>
            </TouchableOpacity>
          </View>
        ) : (
          templates.map((t) => (
            <View key={t.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.amount}>
                    UGX {t.minAmount.toLocaleString()} – {t.maxAmount.toLocaleString()}
                  </Text>
                  <Text style={styles.rate}>
                    {t.interestRate}%/month · Max {formatDuration(t.maxDuration, t.maxDurationDays)}
                  </Text>
                  <Text style={styles.types}>
                    {t.acceptedLoanTypes.join(", ") || "Any loan type"}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end", gap: Spacing.xs }}>
                  <Badge label={statusLabel[t.status]} variant={statusVariant[t.status]} />
                  {t.isFrozen && (
                    <Badge
                      label={`Frozen (${t.frozenBy === "admin" ? "admin" : "you"})`}
                      variant="info"
                    />
                  )}
                </View>
              </View>

              {t.matchedCount > 0 && <MatchedRequestsSection template={t} />}

              {t.status === "pending_review" && (
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.outlineBtn}
                    onPress={() =>
                      router.push({
                        pathname: "/(lender)/post-offer",
                        params: { editId: t.id },
                      })
                    }
                  >
                    <Text style={styles.outlineBtnText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.outlineBtn}
                    disabled={isMutating}
                    onPress={() => handleDelete(t)}
                  >
                    <Text style={[styles.outlineBtnText, { color: Colors.danger }]}>
                      Delete
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {t.status === "approved" && (
                <View style={styles.actionRow}>
                  {t.isFrozen ? (
                    <TouchableOpacity
                      style={[styles.outlineBtn, styles.goldBtn]}
                      disabled={isMutating || t.frozenBy === "admin"}
                      onPress={() => handleUnfreeze(t)}
                    >
                      <Text style={styles.goldBtnText}>
                        {t.frozenBy === "admin" ? "Frozen by admin" : "Unfreeze"}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.outlineBtn}
                      disabled={isMutating}
                      onPress={() => handleFreeze(t)}
                    >
                      <Text style={styles.outlineBtnText}>Freeze</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {t.status === "approved" && (
                <View style={styles.expiryBlock}>
                  <Text style={styles.expiryLabel}>
                    {t.validUntil
                      ? `Valid until ${new Date(t.validUntil).toLocaleDateString()}`
                      : "No expiry set"}
                    {t.validUntil && new Date(t.validUntil) < new Date() && (
                      <Text style={{ color: Colors.danger, fontWeight: "600" }}>  ·  Expired</Text>
                    )}
                  </Text>
                  <View style={styles.expiryRow}>
                    <TouchableOpacity
                      style={styles.pillBtn}
                      disabled={isExtendingExpiry}
                      onPress={() => handleExtendExpiry(t, 30)}
                    >
                      <Text style={styles.pillBtnText}>+30d</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.pillBtn}
                      disabled={isExtendingExpiry}
                      onPress={() => handleExtendExpiry(t, 90)}
                    >
                      <Text style={styles.pillBtnText}>+90d</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.pillBtn}
                      disabled={isExtendingExpiry}
                      onPress={() => handleExtendExpiry(t, 365)}
                    >
                      <Text style={styles.pillBtnText}>+1yr</Text>
                    </TouchableOpacity>
                    {t.validUntil && (
                      <TouchableOpacity
                        style={styles.pillBtn}
                        disabled={isExtendingExpiry}
                        onPress={() => handleExtendExpiry(t, null)}
                      >
                        <Text style={[styles.pillBtnText, { color: Colors.danger }]}>Clear</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}
            </View>
          ))
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
  empty: { alignItems: "center", paddingVertical: Spacing.xxl, gap: Spacing.md },
  emptyText: { ...Typography.body, color: Colors.textMuted, textAlign: "center" },
  emptyBtn: {
    backgroundColor: Colors.gold,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  emptyBtnText: { ...Typography.smallMedium, color: Colors.white },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.gold,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between" },
  amount: { ...Typography.h4, color: Colors.textPrimary },
  rate: { ...Typography.small, color: Colors.gold, marginTop: 2 },
  types: {
    ...Typography.small,
    color: Colors.textMuted,
    marginTop: 4,
    textTransform: "capitalize",
  },
  actionRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  matchedBlock: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.sm,
  },
  matchedHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  matchedHeaderText: { ...Typography.smallMedium, color: Colors.textPrimary, flex: 1 },
  matchedPendingText: { color: Colors.warning },
  matchedAcceptedText: { color: Colors.success },
  matchedEmpty: { ...Typography.small, color: Colors.textMuted },
  matchedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceLift,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
  },
  matchedRowTitle: { ...Typography.smallMedium, color: Colors.textPrimary },
  matchedRowSubtitle: { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },
  outlineBtn: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  outlineBtnText: { ...Typography.smallMedium, color: Colors.textSecondary },
  goldBtn: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  goldBtnText: { ...Typography.smallMedium, color: Colors.white },
  expiryBlock: { marginTop: Spacing.sm, gap: Spacing.xs },
  expiryLabel: { ...Typography.small, color: Colors.textMuted },
  expiryRow: { flexDirection: "row", gap: Spacing.xs },
  pillBtn: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  pillBtnText: { ...Typography.small, color: Colors.textSecondary },
});
