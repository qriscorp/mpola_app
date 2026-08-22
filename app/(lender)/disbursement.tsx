import React, { useMemo, useState } from "react";
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
import { Colors, Spacing, BorderRadius, useScaledTypography } from "../../src/theme";
import {
  StatCard,
  SkeletonStatRow,
  SkeletonList,
  RequiredDocumentsChecklist,
  ConfirmModal,
  ConfirmDetailRow,
} from "../../src/components";
import { useDisbursementViewModel } from "../../src/viewmodels";
import { showAlert } from "../../src/services/alerts";
import { calcPlatformFee } from "../../src/services/fees";
import { formatDuration } from "../../src/services/duration";
import { formatCompactUGX } from "../../src/services/currency";

export default function DisbursementScreen() {
  const router = useRouter();
  const typography = useScaledTypography();
  const styles = useMemo(() => makeStyles(typography), [typography]);
  const {
    queue,
    pending,
    selected,
    selectedId,
    setSelectedId,
    isLoading,
    approve,
    approving,
    approvingLoanId,
    batchApprove,
    batchApproving,
  } = useDisbursementViewModel();

  const [confirming, setConfirming] = useState(false);
  const [batchConfirming, setBatchConfirming] = useState(false);

  const handleApprove = async () => {
    if (!selected) return;
    try {
      await approve(selected.id);
      setConfirming(false);
      showAlert("Disbursed", `UGX ${selected.amount.toLocaleString()} sent to ${selected.borrowerName}'s wallet.`);
    } catch (e: any) {
      setConfirming(false);
      showAlert("Couldn't disburse", e?.message || "Please try again.");
    }
  };

  const handleBatchApprove = async () => {
    try {
      const res = await batchApprove();
      setBatchConfirming(false);
      // One alert only — showAlert only ever holds a single message at a
      // time (see AlertHost), so calling it twice back to back would just
      // have the second call silently overwrite the first before it ever
      // renders. Combine success + failure into one title/message instead.
      if (res.failed.length === 0) {
        showAlert(
          "Batch disbursed",
          `${res.disbursed.length} loan${res.disbursed.length === 1 ? "" : "s"} disbursed.`,
        );
      } else {
        // Always show WHY, not just how many — "insufficient balance" is
        // self-explanatory, but "this borrower already has an active loan
        // elsewhere" genuinely needs the reason surfaced.
        const uniqueReasons = Array.from(new Set(res.failed.map((f) => f.reason)));
        const reasonText =
          res.failed.length === 1
            ? uniqueReasons[0]
            : `${res.failed.length} loans could not be sent: ${uniqueReasons.join("; ")}`;
        showAlert(
          res.disbursed.length > 0 ? "Partially disbursed" : "Couldn't disburse",
          res.disbursed.length > 0
            ? `${res.disbursed.length} loan${res.disbursed.length === 1 ? "" : "s"} disbursed. ${reasonText}`
            : reasonText,
        );
      }
    } catch (e: any) {
      setBatchConfirming(false);
      showAlert("Batch disbursement failed", e?.message || "Please try again.");
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.xl }}>
          <SkeletonStatRow count={3} />
          <SkeletonList count={3} cardHeight={90} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const platformFee = selected ? calcPlatformFee(selected.amount) : 0;
  const totalDebit = selected ? selected.amount + platformFee : 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.title}>Disbursement</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard
            label="Pending"
            value={String(queue?.pendingCount ?? 0)}
            color={Colors.warning}
          />
          <View style={{ width: Spacing.sm }} />
          <StatCard
            label="Disbursed Today"
            value={String(queue?.disbursedTodayCount ?? 0)}
            color={Colors.success}
          />
        </View>
        <View style={styles.statsRow}>
          <StatCard
            label="Wallet Balance"
            value={formatCompactUGX(queue?.walletBalance ?? 0)}
            color={Colors.gold}
          />
        </View>

        {/* Batch action */}
        {pending.length > 0 && (
          <View style={styles.batchCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.batchTitle}>
                {pending.length} loan{pending.length === 1 ? "" : "s"} awaiting disbursement
              </Text>
              <Text style={styles.batchSub}>
                UGX {(queue?.pendingTotal ?? 0).toLocaleString()} total
              </Text>
            </View>
            <TouchableOpacity
              style={styles.batchBtn}
              disabled={batchApproving}
              onPress={() => setBatchConfirming(true)}
            >
              <Text style={styles.batchBtnText}>
                {batchApproving ? "Disbursing…" : "Disburse All"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Queue */}
        <Text style={styles.sectionLabel}>Queue</Text>
        {pending.length === 0 ? (
          <Text style={styles.emptyText}>Nothing awaiting disbursement right now.</Text>
        ) : (
          pending.map((loan) => (
            <TouchableOpacity
              key={loan.id}
              style={[styles.queueRow, selectedId === loan.id && styles.queueRowActive]}
              onPress={() => setSelectedId(loan.id)}
            >
              <View style={styles.queueAvatar}>
                <Text style={styles.queueAvatarText}>
                  {loan.borrowerName
                    .split(" ")
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Text style={styles.queueName}>{loan.borrowerName}</Text>
                  {loan.borrowerHasActiveLoanElsewhere && (
                    <Ionicons name="warning" size={12} color={Colors.warning} />
                  )}
                </View>
                <Text style={styles.queueMeta}>
                  #{loan.id.slice(0, 8)} · {loan.interestRate}%/mo
                </Text>
              </View>
              <Text style={styles.queueAmount}>UGX {loan.amount.toLocaleString()}</Text>
            </TouchableOpacity>
          ))
        )}

        {/* Selected loan detail */}
        {selected && (
          <View style={styles.detailCard}>
            <View style={styles.detailHeader}>
              <Text style={styles.detailTitle}>Loan #{selected.id.slice(0, 8)}</Text>
              {selected.borrowerHasActiveLoanElsewhere ? (
                <View style={styles.holdBadge}>
                  <Text style={styles.holdBadgeText}>On Hold</Text>
                </View>
              ) : (
                <View style={styles.readyBadge}>
                  <Text style={styles.readyBadgeText}>Ready to Disburse</Text>
                </View>
              )}
            </View>

            {selected.borrowerHasActiveLoanElsewhere && (
              <View style={styles.holdBanner}>
                <Ionicons name="warning" size={16} color={Colors.warning} />
                <Text style={styles.holdBannerText}>
                  This borrower already has an active loan with another lender. They can&apos;t be
                  disbursed a second loan until that one is fully repaid.
                </Text>
              </View>
            )}

            {selected.requiredDocumentsStatus.length > 0 && (
              <RequiredDocumentsChecklist items={selected.requiredDocumentsStatus} readOnly />
            )}

            <View style={styles.amtRow}>
              <View style={styles.amtBox}>
                <Text style={styles.amtLabel}>PRINCIPAL</Text>
                <Text style={[styles.amtValue, { color: Colors.gold }]}>
                  UGX {selected.amount.toLocaleString()}
                </Text>
              </View>
              <View style={styles.amtBox}>
                <Text style={styles.amtLabel}>TOTAL REPAYABLE</Text>
                <Text style={styles.amtValue}>
                  UGX {selected.totalRepayable.toLocaleString()}
                </Text>
              </View>
            </View>

            <Text style={styles.sectionLabel}>Disbursement Method</Text>
            <View style={styles.methodRow}>
              <View style={styles.methodIcon}>
                <Text style={styles.methodIconText}>M</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.methodName}>Mpola Wallet</Text>
                <Text style={styles.methodSub}>Credited to the borrower&apos;s wallet instantly</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.disburseBtn, selected.borrowerHasActiveLoanElsewhere && styles.disburseBtnDisabled]}
              disabled={approving || selected.borrowerHasActiveLoanElsewhere}
              onPress={() => setConfirming(true)}
            >
              <Ionicons name="paper-plane-outline" size={16} color={Colors.white} />
              <Text style={styles.disburseBtnText}>
                {approving && approvingLoanId === selected.id
                  ? "Disbursing…"
                  : selected.borrowerHasActiveLoanElsewhere
                    ? "On Hold"
                    : "Disburse Now"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <ConfirmModal
        visible={confirming && !!selected}
        icon="cash-outline"
        title="Disburse this loan?"
        message={
          selected
            ? `This sends UGX ${selected.amount.toLocaleString()} from your wallet to ${selected.borrowerName}'s Mpola wallet right now. This can't be undone.`
            : ""
        }
        confirmLabel="Yes, Disburse"
        accentColor={Colors.gold}
        loading={approving}
        onCancel={() => setConfirming(false)}
        onConfirm={handleApprove}
      >
        {selected && (
          <>
            <ConfirmDetailRow label="Loan principal" value={`UGX ${selected.amount.toLocaleString()}`} />
            <ConfirmDetailRow label="Platform fee (0.5%)" value={`UGX ${platformFee.toLocaleString()}`} />
            <ConfirmDetailRow
              label="Total from your wallet"
              value={`UGX ${totalDebit.toLocaleString()}`}
              valueColor={Colors.gold}
              emphasis
            />
          </>
        )}
      </ConfirmModal>

      <ConfirmModal
        visible={batchConfirming}
        icon="paper-plane-outline"
        title={`Disburse all ${pending.length} pending loans?`}
        message={`This sends a total of UGX ${(queue?.pendingTotal ?? 0).toLocaleString()} from your wallet, one loan at a time. If your balance runs out partway through, the rest are simply left pending.`}
        confirmLabel={`Yes, disburse all ${pending.length}`}
        accentColor={Colors.gold}
        loading={batchApproving}
        onCancel={() => setBatchConfirming(false)}
        onConfirm={handleBatchApprove}
      />
    </SafeAreaView>
  );
}

function makeStyles(typography: ReturnType<typeof useScaledTypography>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    scroll: { padding: Spacing.lg, paddingBottom: 48 },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: Spacing.lg,
    },
    title: { ...typography.h2, color: Colors.white },
    statsRow: { flexDirection: "row", marginBottom: Spacing.sm },
    batchCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: Colors.surface,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginTop: Spacing.md,
      marginBottom: Spacing.lg,
      gap: Spacing.md,
    },
    batchTitle: { ...typography.h4, color: Colors.textPrimary },
    batchSub: { ...typography.small, color: Colors.textSecondary, marginTop: 2 },
    batchBtn: {
      backgroundColor: Colors.gold,
      borderRadius: BorderRadius.md,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
    },
    batchBtnText: { ...typography.smallMedium, color: Colors.white },
    sectionLabel: {
      ...typography.smallMedium,
      color: Colors.textMuted,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: Spacing.sm,
      marginTop: Spacing.sm,
    },
    emptyText: {
      ...typography.small,
      color: Colors.textMuted,
      textAlign: "center",
      paddingVertical: Spacing.xl,
    },
    queueRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
      backgroundColor: Colors.surface,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      marginBottom: Spacing.sm,
      borderWidth: 1,
      borderColor: "transparent",
    },
    queueRowActive: { borderColor: Colors.gold },
    queueAvatar: {
      width: 36,
      height: 36,
      borderRadius: BorderRadius.sm,
      backgroundColor: Colors.navy,
      alignItems: "center",
      justifyContent: "center",
    },
    queueAvatarText: { ...typography.smallMedium, color: Colors.white },
    queueName: { ...typography.smallMedium, color: Colors.textPrimary },
    queueMeta: { ...typography.small, color: Colors.textMuted, marginTop: 1 },
    queueAmount: { ...typography.h4, color: Colors.textPrimary },
    detailCard: {
      backgroundColor: Colors.surface,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginTop: Spacing.lg,
    },
    detailHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: Spacing.md,
    },
    detailTitle: { ...typography.h4, color: Colors.textPrimary },
    readyBadge: {
      backgroundColor: Colors.success + "22",
      borderRadius: BorderRadius.full,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 3,
    },
    readyBadgeText: { ...typography.small, color: Colors.success },
    holdBadge: {
      backgroundColor: Colors.warning + "22",
      borderRadius: BorderRadius.full,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 3,
    },
    holdBadgeText: { ...typography.small, color: Colors.warning },
    holdBanner: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: Spacing.sm,
      backgroundColor: Colors.warningBg,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      marginBottom: Spacing.md,
    },
    holdBannerText: { ...typography.caption, color: Colors.warning, flex: 1 },
    amtRow: { flexDirection: "row", gap: Spacing.sm, marginTop: Spacing.md, marginBottom: Spacing.md },
    amtBox: {
      flex: 1,
      backgroundColor: Colors.background,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
    },
    amtLabel: { ...typography.small, color: Colors.textMuted, marginBottom: 3 },
    amtValue: { ...typography.h4, color: Colors.textPrimary },
    methodRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
      backgroundColor: Colors.gold + "1A",
      borderWidth: 1,
      borderColor: Colors.gold,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      marginBottom: Spacing.lg,
    },
    methodIcon: {
      width: 36,
      height: 36,
      borderRadius: BorderRadius.sm,
      backgroundColor: Colors.navy,
      alignItems: "center",
      justifyContent: "center",
    },
    methodIconText: { ...typography.smallMedium, color: Colors.white },
    methodName: { ...typography.smallMedium, color: Colors.textPrimary },
    methodSub: { ...typography.small, color: Colors.textSecondary, marginTop: 1 },
    disburseBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: Spacing.sm,
      backgroundColor: Colors.gold,
      borderRadius: BorderRadius.md,
      paddingVertical: Spacing.md,
    },
    disburseBtnText: { ...typography.smallMedium, color: Colors.white },
    disburseBtnDisabled: { backgroundColor: Colors.surfaceLift },
  });
}
