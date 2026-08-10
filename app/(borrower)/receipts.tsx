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
import { SkeletonList } from "../../src/components";
import { useReceiptsViewModel } from "../../src/viewmodels";

const METHOD_LABEL: Record<string, string> = {
  mobile_money: "Mobile Money",
  wallet: "Mpola Wallet",
};

const STATUS_COLOR: Record<string, string> = {
  completed: Colors.success,
  pending: Colors.warning,
  late: Colors.danger,
};

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-UG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ReceiptsScreen() {
  const router = useRouter();
  const vm = useReceiptsViewModel();

  const handleDownload = async (repaymentId: string) => {
    try {
      await vm.download(repaymentId);
    } catch {
      Alert.alert("Couldn't download the receipt", "Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Receipts</Text>
        <View style={{ width: 24 }} />
      </View>

      {vm.isLoading ? (
        <View style={styles.scroll}>
          <SkeletonList count={4} cardHeight={70} />
        </View>
      ) : vm.repayments.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            You haven't made any repayments yet — once you do, every
            receipt shows up here for download.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {vm.repayments.map((r) => (
            <View key={r.id} style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={styles.amountRow}>
                  <Text style={styles.amount}>
                    UGX {r.amount.toLocaleString()}
                  </Text>
                  <Text
                    style={[
                      styles.status,
                      { color: STATUS_COLOR[r.status] ?? Colors.textMuted },
                    ]}
                  >
                    {r.status}
                  </Text>
                </View>
                <Text style={styles.meta}>
                  Instalment #{r.instalmentNumber} ·{" "}
                  {r.lenderName ? `To ${r.lenderName}` : `Loan #${r.loanId.slice(0, 8)}`}
                </Text>
                <Text style={styles.meta}>
                  {METHOD_LABEL[r.paymentMethod ?? ""] ?? r.paymentMethod ?? "—"} ·{" "}
                  {formatDateTime(r.createdAt)}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.downloadBtn}
                disabled={vm.downloadingId === r.id}
                onPress={() => handleDownload(r.id)}
              >
                {vm.downloadingId === r.id ? (
                  <Text style={styles.downloadText}>…</Text>
                ) : (
                  <Ionicons name="download-outline" size={18} color={Colors.teal} />
                )}
              </TouchableOpacity>
            </View>
          ))}

          {vm.totalPages > 1 && (
            <View style={styles.pager}>
              <TouchableOpacity
                onPress={() => vm.setPage((p) => Math.max(0, p - 1))}
                disabled={vm.page === 0}
                style={[styles.pagerBtn, vm.page === 0 && styles.pagerBtnDisabled]}
              >
                <Text style={styles.pagerText}>Previous</Text>
              </TouchableOpacity>
              <Text style={styles.pagerLabel}>
                Page {vm.page + 1} of {vm.totalPages}
              </Text>
              <TouchableOpacity
                onPress={() => vm.setPage((p) => Math.min(vm.totalPages - 1, p + 1))}
                disabled={vm.page >= vm.totalPages - 1}
                style={[
                  styles.pagerBtn,
                  vm.page >= vm.totalPages - 1 && styles.pagerBtnDisabled,
                ]}
              >
                <Text style={styles.pagerText}>Next</Text>
              </TouchableOpacity>
            </View>
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
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerTitle: { ...Typography.h3, color: Colors.white },
  scroll: { padding: Spacing.lg, paddingBottom: 40 },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", padding: Spacing.xl },
  emptyText: { ...Typography.body, color: Colors.textMuted, textAlign: "center" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  rowLeft: { flex: 1 },
  amountRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  amount: { ...Typography.bodyMedium, color: Colors.textPrimary },
  status: { ...Typography.caption, textTransform: "capitalize", fontWeight: "600" },
  meta: { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },
  downloadBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.teal,
    alignItems: "center",
    justifyContent: "center",
  },
  downloadText: { color: Colors.teal, fontWeight: "700" },
  pager: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.md,
  },
  pagerBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pagerBtnDisabled: { opacity: 0.4 },
  pagerText: { ...Typography.smallMedium, color: Colors.textSecondary },
  pagerLabel: { ...Typography.small, color: Colors.textMuted },
});
