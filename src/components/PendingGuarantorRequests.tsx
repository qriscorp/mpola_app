import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Colors, Typography, Spacing, BorderRadius } from "../theme";
import { fetchGuarantorRequests, respondToGuarantorRequest } from "../services";

/** "You were asked to be a guarantor" — shown on both the borrower and
 * lender notifications screens, since either role can be invited. This is
 * the only place to respond now that guarantors need a real Mpola account
 * (no more SMS link to a public screen). */
export function PendingGuarantorRequests() {
  const qc = useQueryClient();
  const { data: requests = [] } = useQuery({
    queryKey: ["guarantor-requests", "pending"],
    queryFn: () => fetchGuarantorRequests("pending"),
  });

  const respond = useMutation({
    mutationFn: ({ guarantorId, status }: { guarantorId: string; status: "accepted" | "declined" }) =>
      respondToGuarantorRequest(guarantorId, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["guarantor-requests"] }),
    onError: (e: any) => Alert.alert("Failed", e?.message || "Please try again."),
  });

  if (requests.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Ionicons name="people-outline" size={16} color={Colors.info} />
        <Text style={styles.headerText}>
          Guarantor request{requests.length > 1 ? "s" : ""} for you
        </Text>
      </View>
      {requests.map((r) => (
        <View key={r.id} style={styles.card}>
          <Text style={styles.message}>
            <Text style={{ fontWeight: "700" }}>{r.borrowerName ?? "Someone"}</Text> asked you to
            guarantee their UGX {(r.amount ?? 0).toLocaleString()} {r.loanType ?? ""} loan request
            {r.duration ? ` (${r.duration} months)` : ""}.
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

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.info + "1A",
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: Spacing.xs },
  headerText: { ...Typography.smallMedium, color: Colors.info },
  card: { backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, gap: Spacing.sm },
  message: { ...Typography.small, color: Colors.textPrimary },
  actions: { flexDirection: "row", gap: Spacing.sm },
  declineBtn: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  declineText: { ...Typography.caption, fontWeight: "600", color: Colors.textSecondary },
  approveBtn: {
    backgroundColor: Colors.info,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  approveText: { ...Typography.caption, fontWeight: "600", color: Colors.white },
});
