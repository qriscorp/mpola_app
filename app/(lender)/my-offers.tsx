import React, { useMemo, useState } from "react";
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
import { useQuery } from "@tanstack/react-query";
import { Colors, Spacing, BorderRadius, useScaledTypography } from "../../src/theme";
import { Badge, SkeletonList, ConfirmModal } from "../../src/components";
import {
  useMyOfferTemplatesViewModel,
  useOfferTemplateMatchesViewModel,
} from "../../src/viewmodels";
import { fetchMyOffers } from "../../src/services";
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

const AUTO_MATCH_TABS: Array<"All" | LoanOffer["status"]> = ["All", "pending", "accepted", "declined", "expired"];

/** Combined view of every offer auto-generated across ALL of this lender's
 * standing offers, sortable by status — so a lender with several templates
 * doesn't have to dig into each one's card individually to see what's come
 * in overall. Mirrors mpola_website's Auto-Matched Only filter on the same
 * page. Reuses the flat GET /loans/offers/mine list already fetched
 * elsewhere in the app (react-query dedups the identical query key), just
 * filtered to template-originated rows client-side. */
function AutoMatchedOverview() {
  const router = useRouter();
  const typography = useScaledTypography();
  const styles = useMemo(() => makeStyles(typography), [typography]);
  const [tab, setTab] = React.useState<"All" | LoanOffer["status"]>("All");
  const { data: offers, isLoading } = useQuery({
    queryKey: ["lender", "offers"],
    queryFn: fetchMyOffers,
  });

  const autoMatched = (offers ?? []).filter((o) => o.templateId);
  if (!isLoading && autoMatched.length === 0) return null;

  const filtered = tab === "All" ? autoMatched : autoMatched.filter((o) => o.status === tab);

  return (
    <View style={styles.overviewBlock}>
      <Text style={styles.overviewTitle}>Auto-Matched Requests</Text>
      <Text style={styles.overviewSubtitle}>
        Every request matched across all your standing offers, in one place.
      </Text>

      {isLoading ? (
        <SkeletonList count={2} cardHeight={70} />
      ) : (
        <>
          <View style={styles.overviewTabsRow}>
            {AUTO_MATCH_TABS.map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.overviewTab, tab === t && styles.overviewTabActive]}
                onPress={() => setTab(t)}
              >
                <Text style={[styles.overviewTabText, tab === t && styles.overviewTabTextActive]}>
                  {t === "All" ? "All" : offerStatusLabel[t]} (
                  {t === "All" ? autoMatched.length : autoMatched.filter((o) => o.status === t).length})
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {filtered.length === 0 ? (
            <Text style={styles.matchedEmpty}>Nothing in this category.</Text>
          ) : (
            <View style={{ gap: Spacing.xs }}>
              {filtered.map((o) => (
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
              ))}
            </View>
          )}
        </>
      )}
    </View>
  );
}

function MatchedRequestsSection({ template }: { template: OfferTemplate }) {
  const router = useRouter();
  const typography = useScaledTypography();
  const styles = useMemo(() => makeStyles(typography), [typography]);
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
  const typography = useScaledTypography();
  const styles = useMemo(() => makeStyles(typography), [typography]);
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

  const [deleteTarget, setDeleteTarget] = useState<OfferTemplate | null>(null);
  const [freezeTarget, setFreezeTarget] = useState<OfferTemplate | null>(null);
  const [expiryTarget, setExpiryTarget] = useState<{ template: OfferTemplate; days: number | null } | null>(null);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteTemplate(deleteTarget.id);
      setDeleteTarget(null);
    } catch (e: any) {
      setDeleteTarget(null);
      Alert.alert("Failed to delete", e?.message || "Please try again.");
    }
  };

  const handleFreeze = async () => {
    if (!freezeTarget) return;
    try {
      await freezeTemplate(freezeTarget.id);
      setFreezeTarget(null);
    } catch (e: any) {
      setFreezeTarget(null);
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

  const handleExtendExpiry = async () => {
    if (!expiryTarget) return;
    const { template, days } = expiryTarget;
    const validUntil =
      days === null ? null : new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    try {
      await extendExpiry({ id: template.id, validUntil });
      setExpiryTarget(null);
    } catch (e: any) {
      setExpiryTarget(null);
      Alert.alert("Failed to update expiry", e?.message || "Please try again.");
    }
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
        <AutoMatchedOverview />

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
                    onPress={() => setDeleteTarget(t)}
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
                      onPress={() => setFreezeTarget(t)}
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
                      onPress={() => setExpiryTarget({ template: t, days: 30 })}
                    >
                      <Text style={styles.pillBtnText}>+30d</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.pillBtn}
                      disabled={isExtendingExpiry}
                      onPress={() => setExpiryTarget({ template: t, days: 90 })}
                    >
                      <Text style={styles.pillBtnText}>+90d</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.pillBtn}
                      disabled={isExtendingExpiry}
                      onPress={() => setExpiryTarget({ template: t, days: 365 })}
                    >
                      <Text style={styles.pillBtnText}>+1yr</Text>
                    </TouchableOpacity>
                    {t.validUntil && (
                      <TouchableOpacity
                        style={styles.pillBtn}
                        disabled={isExtendingExpiry}
                        onPress={() => setExpiryTarget({ template: t, days: null })}
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

      <ConfirmModal
        visible={!!deleteTarget}
        icon="trash-outline"
        title="Delete this offer?"
        message="This can't be undone."
        confirmLabel="Delete"
        destructive
        loading={isMutating}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />

      <ConfirmModal
        visible={!!freezeTarget}
        icon="snow-outline"
        title="Freeze this standing offer?"
        message="It stops auto-matching new borrower requests until you unfreeze it. You can unfreeze any time."
        confirmLabel="Freeze"
        accentColor={Colors.gold}
        loading={isMutating}
        onCancel={() => setFreezeTarget(null)}
        onConfirm={handleFreeze}
      />

      <ConfirmModal
        visible={!!expiryTarget}
        icon="calendar-outline"
        title={expiryTarget?.days === null ? "Clear expiry?" : `Extend expiry by ${expiryTarget?.days} days?`}
        message={
          expiryTarget?.days === null
            ? "This offer will no longer have an expiry date."
            : expiryTarget
              ? `This offer will now expire on ${new Date(Date.now() + expiryTarget.days! * 24 * 60 * 60 * 1000).toLocaleDateString()}.`
              : ""
        }
        confirmLabel="Confirm"
        accentColor={Colors.gold}
        loading={isExtendingExpiry}
        onCancel={() => setExpiryTarget(null)}
        onConfirm={handleExtendExpiry}
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
    scroll: { padding: Spacing.lg, paddingBottom: 40 },
    empty: { alignItems: "center", paddingVertical: Spacing.xxl, gap: Spacing.md },
    emptyText: { ...typography.body, color: Colors.textMuted, textAlign: "center" },
    emptyBtn: {
      backgroundColor: Colors.gold,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.full,
    },
    emptyBtnText: { ...typography.smallMedium, color: Colors.white },
    card: {
      backgroundColor: Colors.surface,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.md,
      borderLeftWidth: 3,
      borderLeftColor: Colors.gold,
    },
    cardHeader: { flexDirection: "row", justifyContent: "space-between" },
    amount: { ...typography.h4, color: Colors.textPrimary },
    rate: { ...typography.small, color: Colors.gold, marginTop: 2 },
    types: {
      ...typography.small,
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
    matchedHeaderText: { ...typography.smallMedium, color: Colors.textPrimary, flex: 1 },
    matchedPendingText: { color: Colors.warning },
    matchedAcceptedText: { color: Colors.success },
    matchedEmpty: { ...typography.small, color: Colors.textMuted },
    matchedRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: Spacing.sm,
      backgroundColor: Colors.surfaceLift,
      borderRadius: BorderRadius.md,
      padding: Spacing.sm,
    },
    matchedRowTitle: { ...typography.smallMedium, color: Colors.textPrimary },
    matchedRowSubtitle: { ...typography.caption, color: Colors.textMuted, marginTop: 2 },
    overviewBlock: {
      backgroundColor: Colors.surface,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.lg,
      borderLeftWidth: 3,
      borderLeftColor: Colors.teal,
    },
    overviewTitle: { ...typography.h4, color: Colors.textPrimary },
    overviewSubtitle: { ...typography.small, color: Colors.textMuted, marginTop: 2, marginBottom: Spacing.md },
    overviewTabsRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.xs, marginBottom: Spacing.md },
    overviewTab: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: 5,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    overviewTabActive: { backgroundColor: Colors.teal, borderColor: Colors.teal },
    overviewTabText: { ...typography.caption, color: Colors.textSecondary },
    overviewTabTextActive: { color: Colors.white, fontWeight: "600" },
    outlineBtn: {
      borderWidth: 1,
      borderColor: Colors.border,
      borderRadius: BorderRadius.md,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
    },
    outlineBtnText: { ...typography.smallMedium, color: Colors.textSecondary },
    goldBtn: { backgroundColor: Colors.gold, borderColor: Colors.gold },
    goldBtnText: { ...typography.smallMedium, color: Colors.white },
    expiryBlock: { marginTop: Spacing.sm, gap: Spacing.xs },
    expiryLabel: { ...typography.small, color: Colors.textMuted },
    expiryRow: { flexDirection: "row", gap: Spacing.xs },
    pillBtn: {
      borderWidth: 1,
      borderColor: Colors.border,
      borderRadius: BorderRadius.full,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 4,
    },
    pillBtnText: { ...typography.small, color: Colors.textSecondary },
  });
}
