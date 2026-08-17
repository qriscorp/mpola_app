import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Colors, Spacing, BorderRadius, useScaledTypography } from "../theme";
import { fetchGuarantorRequests, respondToGuarantorRequest } from "../services";
import { formatDuration } from "../services/duration";

/** Everything the current user has been asked to approve — right now just
 * guarantor requests, but the dedicated Approvals tab (not buried inside
 * Notifications) is meant to be the one place a person checks for "is
 * there anything I need to act on," so future approval types belong here
 * too rather than growing into more one-off banners. */
export function ApprovalsList() {
  const typography = useScaledTypography();
  const styles = useMemo(() => makeStyles(typography), [typography]);
  const qc = useQueryClient();
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["guarantor-requests", "pending"],
    queryFn: () => fetchGuarantorRequests("pending"),
  });

  const respond = useMutation({
    mutationFn: ({ guarantorId, status }: { guarantorId: string; status: "accepted" | "declined" }) =>
      respondToGuarantorRequest(guarantorId, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["guarantor-requests"] }),
    onError: (e: any) => Alert.alert("Failed", e?.message || "Please try again."),
  });

  if (isLoading) return null;

  if (requests.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="checkmark-done-circle-outline" size={40} color={Colors.textMuted} />
        <Text style={styles.emptyText}>Nothing needs your approval right now.</Text>
      </View>
    );
  }

  return (
    <View style={{ gap: Spacing.sm }}>
      {requests.map((r) => (
        <View key={r.id} style={styles.card}>
          <Text style={styles.message}>
            <Text style={{ fontWeight: "700" }}>{r.borrowerName ?? "Someone"}</Text> asked you to
            guarantee their loan request. If you approve, you&apos;re vouching for them — lenders will
            see you as one of their two required guarantors.
          </Text>
          <View style={styles.detailsGrid}>
            <View style={styles.detailCell}>
              <Text style={styles.detailLabel}>Amount</Text>
              <Text style={styles.detailValue}>UGX {(r.amount ?? 0).toLocaleString()}</Text>
            </View>
            <View style={styles.detailCell}>
              <Text style={styles.detailLabel}>Type</Text>
              <Text style={styles.detailValue}>{r.loanType ?? "—"}</Text>
            </View>
            <View style={styles.detailCell}>
              <Text style={styles.detailLabel}>Duration</Text>
              <Text style={styles.detailValue}>{formatDuration(r.duration, r.durationDays)}</Text>
            </View>
            <View style={styles.detailCell}>
              <Text style={styles.detailLabel}>Purpose</Text>
              <Text style={styles.detailValue} numberOfLines={1}>{r.purpose || "Not specified"}</Text>
            </View>
          </View>
          <Text style={styles.disclaimer}>
            No lender has been assigned yet — once both guarantors approve, this request becomes
            visible to lenders on the marketplace, and any of them can choose to fund it.
          </Text>
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.declineBtn}
              disabled={respond.isPending}
              onPress={() => respond.mutate({ guarantorId: r.id, status: "declined" })}
            >
              <Text style={styles.declineText}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.approveBtn}
              disabled={respond.isPending}
              onPress={() => respond.mutate({ guarantorId: r.id, status: "accepted" })}
            >
              <Text style={styles.approveText}>Approve</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
}

function makeStyles(typography: ReturnType<typeof useScaledTypography>) {
  return StyleSheet.create({
    emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: Spacing.xxl, gap: Spacing.sm },
    emptyText: { ...typography.body, color: Colors.textMuted, textAlign: "center" },
    card: { backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, gap: Spacing.sm },
    message: { ...typography.small, color: Colors.textPrimary },
    detailsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      backgroundColor: Colors.background,
      borderRadius: BorderRadius.sm,
      padding: Spacing.sm,
      gap: Spacing.sm,
    },
    detailCell: { width: "45%" },
    detailLabel: { ...typography.caption, color: Colors.textMuted },
    detailValue: { ...typography.smallMedium, color: Colors.textPrimary, textTransform: "capitalize" },
    disclaimer: { ...typography.caption, color: Colors.textMuted },
    actions: { flexDirection: "row", gap: Spacing.sm },
    declineBtn: {
      borderWidth: 1,
      borderColor: Colors.border,
      borderRadius: BorderRadius.full,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
    },
    declineText: { ...typography.caption, fontWeight: "600", color: Colors.textSecondary },
    approveBtn: {
      backgroundColor: Colors.info,
      borderRadius: BorderRadius.full,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
    },
    approveText: { ...typography.caption, fontWeight: "600", color: Colors.white },
  });
}
