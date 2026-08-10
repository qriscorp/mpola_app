import React, { useState } from "react";
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
import { Colors, Typography, Spacing, BorderRadius } from "../../src/theme";
import { Input, Button } from "../../src/components";
import { DOCUMENT_OPTIONS } from "../../src/viewmodels";
import {
  fetchMarketplace,
  fetchMyOffers,
  skipApplication,
  makeOffer,
} from "../../src/services";
import type { MarketplaceApplication } from "../../src/models";

type Tab = "All" | "Pending" | "Approved" | "Declined";
const TABS: Tab[] = ["All", "Pending", "Approved", "Declined"];

function timeSince(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diffMs / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

function OfferModal({
  app,
  onClose,
}: {
  app: MarketplaceApplication;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [rate, setRate] = useState("15");
  const [requiredDocs, setRequiredDocs] = useState<string[]>([]);

  const rateInvalid = rate !== "" && (Number(rate) < 0.1 || Number(rate) > 25);

  const toggleDoc = (label: string) => {
    setRequiredDocs((prev) =>
      prev.includes(label) ? prev.filter((d) => d !== label) : [...prev, label],
    );
  };

  const sendOffer = useMutation({
    mutationFn: () =>
      makeOffer({
        applicationId: app.id,
        amount: app.amount,
        interestRate: Number(rate),
        duration: app.duration,
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
              <Text style={styles.summaryValue}>{app.duration} months</Text>
            </View>
          </View>

          <Input
            label="Your Rate (%/month)"
            value={rate}
            onChangeText={setRate}
            keyboardType="numeric"
            error={rateInvalid ? "Must be between 0.1% and 25%" : undefined}
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
          </View>

          <Text style={styles.hint}>
            If the borrower accepts, funds are disbursed automatically to their Mpola wallet.
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
  const [tab, setTab] = useState<Tab>("All");
  const [offerModalApp, setOfferModalApp] = useState<MarketplaceApplication | null>(null);

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

  // The marketplace only ever returns open (pending) applications — once a
  // lender's offer is accepted the application leaves the marketplace, so
  // "Approved"/"Declined" are always empty here by design, not a bug.
  const filtered = tab === "All" || tab === "Pending" ? applications : [];

  const skip = useMutation({
    mutationFn: skipApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lender", "marketplace"] });
    },
    onError: (e: any) => Alert.alert("Failed to hide request", e?.message || "Please try again."),
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

        {isLoading ? null : filtered.length === 0 ? (
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
                  <Text style={styles.borrowerMeta}>
                    {app.loanType} · {timeSince(app.createdAt)} · Score{" "}
                    {app.borrower?.creditScore ?? "—"}/100
                  </Text>
                </View>
                <View style={styles.amountBox}>
                  <Text style={styles.amount}>UGX {app.amount.toLocaleString()}</Text>
                  <Text style={styles.duration}>{app.duration} months</Text>
                </View>
              </View>
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.approveBtn}
                  onPress={() => setOfferModalApp(app)}
                >
                  <Text style={styles.approveText}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.declineBtn}
                  disabled={skip.isPending}
                  onPress={() =>
                    skip.mutate(app.id, {
                      onSuccess: () =>
                        Alert.alert("Hidden", "Hidden from your marketplace — still visible to other lenders."),
                    })
                  }
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, paddingBottom: 40 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  title: { ...Typography.h2, color: Colors.white },
  postOfferBtn: {
    backgroundColor: Colors.gold,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  postOfferText: { ...Typography.smallMedium, color: Colors.white },
  bannerRow: {
    backgroundColor: Colors.warningBg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: 2,
  },
  bannerText: { ...Typography.smallMedium, color: Colors.textPrimary },
  bannerSubtext: { ...Typography.caption, color: Colors.textMuted },
  tabsRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm, marginBottom: Spacing.lg },
  tab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabActive: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  tabText: { ...Typography.smallMedium, color: Colors.textSecondary },
  tabTextActive: { color: Colors.white },
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: Spacing.xxl },
  emptyText: { ...Typography.body, color: Colors.textMuted },
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
  avatarText: { ...Typography.bodyMedium, color: Colors.gold },
  cardInfo: { flex: 1 },
  borrowerName: { ...Typography.bodyMedium, color: Colors.textPrimary },
  borrowerMeta: { ...Typography.caption, color: Colors.textMuted, marginTop: 2, textTransform: "capitalize" },
  amountBox: { alignItems: "flex-end" },
  amount: { ...Typography.bodyMedium, color: Colors.textPrimary },
  duration: { ...Typography.caption, color: Colors.textMuted },
  actionsRow: { flexDirection: "row", gap: Spacing.sm },
  approveBtn: {
    flex: 1,
    backgroundColor: Colors.success,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    alignItems: "center",
  },
  approveText: { ...Typography.smallMedium, color: Colors.white },
  declineBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    alignItems: "center",
  },
  declineText: { ...Typography.smallMedium, color: Colors.textSecondary },
  viewBtn: {
    flex: 1,
    backgroundColor: Colors.gold,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    alignItems: "center",
  },
  viewText: { ...Typography.smallMedium, color: Colors.white },
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
  sheetTitle: { ...Typography.h3, color: Colors.textPrimary },
  sheetSubtitle: { ...Typography.small, color: Colors.textMuted, marginTop: 2, marginBottom: Spacing.md },
  summaryBox: {
    backgroundColor: Colors.warningBg,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  summaryRow: { flexDirection: "row", justifyContent: "space-between" },
  summaryLabel: { ...Typography.small, color: Colors.textMuted },
  summaryValue: { ...Typography.smallMedium, color: Colors.textPrimary },
  fieldLabel: { ...Typography.smallMedium, color: Colors.textSecondary, marginTop: Spacing.sm, marginBottom: Spacing.sm },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.xs, marginBottom: Spacing.md },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipSelected: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  chipText: { ...Typography.caption, color: Colors.textSecondary },
  chipTextSelected: { color: Colors.white, fontWeight: "600" },
  hint: { ...Typography.caption, color: Colors.textMuted, marginBottom: Spacing.md },
  actions: { flexDirection: "row", gap: Spacing.md, marginTop: Spacing.sm },
  flex: { flex: 1 },
});
