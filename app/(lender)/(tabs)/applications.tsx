import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Colors, Spacing, BorderRadius, useScaledTypography } from "../../../src/theme";
import { Input, Button, InfoTip, SkeletonList, ConfirmModal } from "../../../src/components";
import { DOCUMENT_OPTIONS } from "../../../src/viewmodels";
import {
  fetchMarketplace,
  fetchMyOffers,
  skipApplication,
  makeOffer,
  fetchLendingLimits,
} from "../../../src/services";
import type { MarketplaceApplication, LoanOffer } from "../../../src/models";
import { formatDuration } from "../../../src/services/duration";

type Tab = "All" | "Pending" | "Approved" | "Declined";
const TABS: Tab[] = ["All", "Pending", "Approved", "Declined"];

function timeSince(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diffMs / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

// A lender's own standing offer may have already auto-matched this
// application — while it's still pending and inside the 2-day cooldown
// (see AUTO_MATCH_MANUAL_OFFER_COOLDOWN in routers/loans.py), they can't
// also hand-craft a manual offer here. Purely informational/UX gating —
// the backend is the real enforcement.
function autoMatchCooldown(offer: LoanOffer | undefined): { hoursLeft: number } | null {
  if (!offer || offer.status !== "pending" || !offer.templateId || !offer.autoMatchCooldownEndsAt) {
    return null;
  }
  const msLeft = new Date(offer.autoMatchCooldownEndsAt).getTime() - Date.now();
  if (msLeft <= 0) return null;
  return { hoursLeft: Math.ceil(msLeft / 3_600_000) };
}

function OfferModal({
  app,
  onClose,
}: {
  app: MarketplaceApplication;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const typography = useScaledTypography();
  const styles = useMemo(() => makeStyles(typography), [typography]);
  const [rate, setRate] = useState("15");
  const [requiredDocs, setRequiredDocs] = useState<string[]>([]);
  const [customDocInput, setCustomDocInput] = useState("");

  // Live, admin-configured cap (Settings > Max Interest Rate) — the fallback
  // (25, the model's absolute structural ceiling) only applies for the one
  // frame before this resolves.
  const { data: lendingLimits } = useQuery({
    queryKey: ["lending-limits"],
    queryFn: fetchLendingLimits,
    staleTime: 5 * 60 * 1000,
  });
  const maxRateAllowed = lendingLimits?.maxInterestRate ?? 25;

  const rateInvalid = rate !== "" && (Number(rate) < 0.1 || Number(rate) > maxRateAllowed);
  const isEmergency = app.durationDays != null;
  const numRate = Number(rate) || 0;
  const totalInterest = isEmergency
    ? app.amount * (numRate / 100) * ((app.durationDays ?? 0) / 30)
    : app.amount * (numRate / 100) * (app.duration ?? 0);
  const totalRepayable = app.amount + totalInterest;
  const monthlyPayment = isEmergency
    ? totalRepayable
    : app.duration
      ? totalRepayable / app.duration
      : 0;

  const toggleDoc = (label: string) => {
    setRequiredDocs((prev) =>
      prev.includes(label) ? prev.filter((d) => d !== label) : [...prev, label],
    );
  };

  const addCustomDoc = () => {
    const label = customDocInput.trim();
    if (!label || requiredDocs.includes(label)) return;
    setRequiredDocs((prev) => [...prev, label]);
    setCustomDocInput("");
  };

  const sendOffer = useMutation({
    mutationFn: () =>
      makeOffer({
        applicationId: app.id,
        amount: app.amount,
        interestRate: Number(rate),
        duration: app.durationDays != null ? null : app.duration,
        durationDays: app.durationDays,
        requiredDocuments: requiredDocs,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lender", "marketplace"] });
      queryClient.invalidateQueries({ queryKey: ["lender", "offers"] });
      onClose();
    },
    onError: (e: any) => Alert.alert("Failed to send offer", e?.message || "Please try again."),
  });

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Make an Offer</Text>
          <Text style={styles.sheetSubtitle}>
            For {app.borrower?.fullName ?? "this borrower"}
          </Text>

          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Amount</Text>
              <Text style={styles.summaryValue}>UGX {app.amount.toLocaleString()}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Duration</Text>
              <Text style={styles.summaryValue}>{formatDuration(app.duration, app.durationDays)}</Text>
            </View>
          </View>

          {rate !== "" && !rateInvalid && (
            <View style={styles.summaryBox}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  {isEmergency ? "Repayment due" : "Monthly payment"}
                </Text>
                <Text style={styles.summaryValue}>
                  UGX {Math.round(monthlyPayment).toLocaleString()}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total repayable</Text>
                <Text style={styles.summaryValue}>
                  UGX {Math.round(totalRepayable).toLocaleString()}
                </Text>
              </View>
            </View>
          )}

          <Input
            label="Your Rate (%/month)"
            value={rate}
            onChangeText={setRate}
            keyboardType="numeric"
            error={rateInvalid ? `Must be between 0.1% and ${maxRateAllowed}%` : undefined}
          />

          <Text style={styles.fieldLabel}>Documents required to accept (optional)</Text>
          <View style={styles.chipRow}>
            {DOCUMENT_OPTIONS.map((label) => {
              const selected = requiredDocs.includes(label);
              return (
                <TouchableOpacity
                  key={label}
                  style={[styles.chip, selected && styles.chipSelected]}
                  onPress={() => toggleDoc(label)}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
            {requiredDocs
              .filter((d) => !DOCUMENT_OPTIONS.includes(d))
              .map((label) => (
                <TouchableOpacity
                  key={label}
                  style={[styles.chip, styles.chipSelected]}
                  onPress={() => toggleDoc(label)}
                >
                  <Text style={styles.chipTextSelected}>{label} ×</Text>
                </TouchableOpacity>
              ))}
          </View>
          <View style={styles.customDocRow}>
            <Input
              value={customDocInput}
              onChangeText={setCustomDocInput}
              placeholder="Other document..."
              maxLength={255}
              style={{ flex: 1 }}
            />
            <TouchableOpacity
              style={styles.addDocBtn}
              disabled={!customDocInput.trim()}
              onPress={addCustomDoc}
            >
              <Text style={styles.addDocBtnText}>+ Add</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.hint}>
            If the borrower accepts, you&apos;ll need to approve disbursement
            from your Portfolio to release the funds.
          </Text>

          <View style={styles.actions}>
            <Button title="Cancel" variant="outline" onPress={onClose} style={styles.flex} />
            <Button
              title={sendOffer.isPending ? "Sending…" : "Send Offer"}
              onPress={() => sendOffer.mutate()}
              loading={sendOffer.isPending}
              disabled={rate === "" || rateInvalid}
              color={Colors.gold}
              style={styles.flex}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function ApplicationsInboxScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const typography = useScaledTypography();
  const styles = useMemo(() => makeStyles(typography), [typography]);
  const [tab, setTab] = useState<Tab>("All");
  const [offerModalApp, setOfferModalApp] = useState<MarketplaceApplication | null>(null);
  const [skipTarget, setSkipTarget] = useState<MarketplaceApplication | null>(null);

  const { data: marketplace, isLoading } = useQuery({
    queryKey: ["lender", "marketplace", "inbox"],
    queryFn: () => fetchMarketplace(1, 50),
  });
  const { data: myOffers } = useQuery({
    queryKey: ["lender", "offers"],
    queryFn: fetchMyOffers,
  });

  const applications = marketplace?.applications ?? [];
  const pendingOffersCount = (myOffers ?? []).filter((o) => o.status === "pending").length;
  const myOfferByApplicationId = new Map((myOffers ?? []).map((o) => [o.applicationId, o]));

  // The marketplace only ever returns open (pending) applications — once a
  // lender's offer is accepted the application leaves the marketplace, so
  // "Approved"/"Declined" are always empty here by design, not a bug.
  const filtered = tab === "All" || tab === "Pending" ? applications : [];

  const skip = useMutation({
    mutationFn: skipApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lender", "marketplace"] });
      setSkipTarget(null);
      Alert.alert("Hidden", "Hidden from your marketplace — still visible to other lenders.");
    },
    onError: (e: any) => {
      setSkipTarget(null);
      Alert.alert("Failed to hide request", e?.message || "Please try again.");
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Applications Inbox</Text>
          <TouchableOpacity
            style={styles.postOfferBtn}
            onPress={() => router.push("/(lender)/post-offer")}
          >
            <Text style={styles.postOfferText}>+ Post an Offer</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bannerRow}>
          <Text style={styles.bannerText}>
            {applications.length} open request{applications.length === 1 ? "" : "s"} on the marketplace
          </Text>
          <Text style={styles.bannerSubtext}>
            {pendingOffersCount} of your offers awaiting a response
          </Text>
        </View>

        <View style={styles.tabsRow}>
          {TABS.map((t) => {
            const count = t === "All" || t === "Pending" ? applications.length : 0;
            return (
              <TouchableOpacity
                key={t}
                style={[styles.tab, tab === t && styles.tabActive]}
                onPress={() => setTab(t)}
              >
                <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                  {t} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {isLoading ? (
          <SkeletonList count={4} cardHeight={130} />
        ) : filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No applications in this category.</Text>
          </View>
        ) : (
          filtered.map((app) => (
            <View key={app.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.avatarWrap}>
                  <Text style={styles.avatarText}>
                    {(app.borrower?.fullName ?? "?")[0]?.toUpperCase() ?? "?"}
                  </Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.borrowerName}>{app.borrower?.fullName ?? "Unknown"}</Text>
                  <View style={styles.scoreMetaRow}>
                    <Text style={styles.borrowerMeta}>
                      {app.loanType} · {timeSince(app.createdAt)} · Score{" "}
                      {app.borrower?.creditScore ?? "—"}/100
                    </Text>
                    <InfoTip
                      title="About credit scores"
                      text="A new borrower starts at a neutral 50 — no resolved loan history yet, not a red flag by itself. It only moves once a loan is fully resolved: rising toward 100 for full, on-time repayment, dropping toward 0 for a default or overdue history. With few resolved loans the swings are sharp, so weigh it alongside KYC status and guarantors, especially for a borrower with only one or two loans behind them."
                    />
                  </View>
                </View>
                <View style={styles.amountBox}>
                  <Text style={styles.amount}>UGX {app.amount.toLocaleString()}</Text>
                  <Text style={styles.duration}>{formatDuration(app.duration, app.durationDays)}</Text>
                </View>
              </View>
              <View style={styles.actionsRow}>
                {(() => {
                  const cooldown = autoMatchCooldown(myOfferByApplicationId.get(app.id));
                  if (cooldown) {
                    return (
                      <View style={styles.cooldownBadge}>
                        <Text style={styles.cooldownText}>
                          Awaiting borrower ({cooldown.hoursLeft}h)
                        </Text>
                      </View>
                    );
                  }
                  return (
                    <TouchableOpacity
                      style={styles.approveBtn}
                      onPress={() => setOfferModalApp(app)}
                    >
                      <Text style={styles.approveText}>Make Offer</Text>
                    </TouchableOpacity>
                  );
                })()}
                <TouchableOpacity
                  style={styles.declineBtn}
                  disabled={skip.isPending}
                  onPress={() => setSkipTarget(app)}
                >
                  <Text style={styles.declineText}>Decline</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.viewBtn}
                  onPress={() =>
                    router.push({
                      pathname: "/(lender)/borrower-profile",
                      params: { applicationId: app.id },
                    })
                  }
                >
                  <Text style={styles.viewText}>View</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {offerModalApp && (
        <OfferModal app={offerModalApp} onClose={() => setOfferModalApp(null)} />
      )}

      <ConfirmModal
        visible={!!skipTarget}
        icon="eye-off-outline"
        title="Decline this request?"
        message={`This hides ${skipTarget?.borrower?.fullName ?? "this borrower"}'s request from your marketplace — it stays visible to other lenders.`}
        confirmLabel="Decline"
        destructive
        loading={skip.isPending}
        onCancel={() => setSkipTarget(null)}
        onConfirm={() => skipTarget && skip.mutate(skipTarget.id)}
      />
    </SafeAreaView>
  );
}

function makeStyles(typography: ReturnType<typeof useScaledTypography>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    scroll: { padding: Spacing.lg, paddingBottom: 136 },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: Spacing.md,
    },
    title: { ...typography.h2, color: Colors.white },
    postOfferBtn: {
      backgroundColor: Colors.gold,
      borderRadius: BorderRadius.full,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
    },
    postOfferText: { ...typography.smallMedium, color: Colors.white },
    bannerRow: {
      backgroundColor: Colors.warningBg,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      marginBottom: Spacing.md,
      gap: 2,
    },
    bannerText: { ...typography.smallMedium, color: Colors.textPrimary },
    bannerSubtext: { ...typography.caption, color: Colors.textMuted },
    tabsRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm, marginBottom: Spacing.lg },
    tab: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    tabActive: { backgroundColor: Colors.gold, borderColor: Colors.gold },
    tabText: { ...typography.smallMedium, color: Colors.textSecondary },
    tabTextActive: { color: Colors.white },
    emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: Spacing.xxl },
    emptyText: { ...typography.body, color: Colors.textMuted },
    card: {
      backgroundColor: Colors.surface,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.md,
    },
    cardTop: { flexDirection: "row", alignItems: "center", marginBottom: Spacing.md },
    avatarWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: Colors.gold + "25",
      alignItems: "center",
      justifyContent: "center",
      marginRight: Spacing.md,
    },
    avatarText: { ...typography.bodyMedium, color: Colors.gold },
    cardInfo: { flex: 1 },
    borrowerName: { ...typography.bodyMedium, color: Colors.textPrimary },
    borrowerMeta: { ...typography.caption, color: Colors.textMuted, marginTop: 2, textTransform: "capitalize" },
    scoreMetaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
    amountBox: { alignItems: "flex-end" },
    amount: { ...typography.bodyMedium, color: Colors.textPrimary },
    duration: { ...typography.caption, color: Colors.textMuted },
    actionsRow: { flexDirection: "row", gap: Spacing.sm },
    approveBtn: {
      flex: 1,
      backgroundColor: Colors.success,
      borderRadius: BorderRadius.md,
      paddingVertical: Spacing.sm,
      alignItems: "center",
    },
    approveText: { ...typography.smallMedium, color: Colors.white },
    cooldownBadge: {
      flex: 1,
      backgroundColor: Colors.warningBg,
      borderWidth: 1,
      borderColor: Colors.warning,
      borderRadius: BorderRadius.md,
      paddingVertical: Spacing.sm,
      alignItems: "center",
    },
    cooldownText: { ...typography.caption, color: Colors.warning, fontWeight: "600" },
    declineBtn: {
      flex: 1,
      borderWidth: 1,
      borderColor: Colors.border,
      borderRadius: BorderRadius.md,
      paddingVertical: Spacing.sm,
      alignItems: "center",
    },
    declineText: { ...typography.smallMedium, color: Colors.textSecondary },
    viewBtn: {
      flex: 1,
      backgroundColor: Colors.gold,
      borderRadius: BorderRadius.md,
      paddingVertical: Spacing.sm,
      alignItems: "center",
    },
    viewText: { ...typography.smallMedium, color: Colors.white },
    overlay: {
      flex: 1,
      backgroundColor: Colors.overlay,
      justifyContent: "center",
      padding: Spacing.lg,
    },
    sheet: {
      backgroundColor: Colors.surface,
      borderRadius: BorderRadius.xl,
      padding: Spacing.xl,
    },
    sheetTitle: { ...typography.h3, color: Colors.textPrimary },
    sheetSubtitle: { ...typography.small, color: Colors.textMuted, marginTop: 2, marginBottom: Spacing.md },
    summaryBox: {
      backgroundColor: Colors.warningBg,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      gap: Spacing.xs,
      marginBottom: Spacing.md,
    },
    summaryRow: { flexDirection: "row", justifyContent: "space-between" },
    summaryLabel: { ...typography.small, color: Colors.textMuted },
    summaryValue: { ...typography.smallMedium, color: Colors.textPrimary },
    fieldLabel: { ...typography.smallMedium, color: Colors.textSecondary, marginTop: Spacing.sm, marginBottom: Spacing.sm },
    chipRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.xs, marginBottom: Spacing.md },
    chip: {
      paddingHorizontal: Spacing.md,
      paddingVertical: 6,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    chipSelected: { backgroundColor: Colors.gold, borderColor: Colors.gold },
    chipText: { ...typography.caption, color: Colors.textSecondary },
    chipTextSelected: { color: Colors.white, fontWeight: "600" },
    customDocRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, marginBottom: Spacing.md },
    addDocBtn: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    addDocBtnText: { ...typography.smallMedium, color: Colors.textSecondary },
    hint: { ...typography.caption, color: Colors.textMuted, marginBottom: Spacing.md },
    actions: { flexDirection: "row", gap: Spacing.md, marginTop: Spacing.sm },
    flex: { flex: 1 },
  });
}
