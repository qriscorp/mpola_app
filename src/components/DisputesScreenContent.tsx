import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Colors, Typography, Spacing, BorderRadius } from "../theme";
import { Card } from "./Card";
import { Button } from "./Button";
import { Badge } from "./Badge";
import { SkeletonList } from "./Skeleton";
import { fetchMyDisputes, fileDispute } from "../services";

const statusVariant: Record<string, "info" | "warning" | "success" | "danger"> = {
  open: "info",
  investigating: "warning",
  resolved: "success",
  rejected: "danger",
};

const categoryLabel: Record<string, string> = {
  payment: "Payment",
  loan_terms: "Loan Terms",
  fraud: "Fraud",
  disbursement: "Disbursement",
  other: "Other",
};

export function DisputesScreenContent({ accentColor = Colors.teal }: { accentColor?: string }) {
  const qc = useQueryClient();
  const { data: disputes, isLoading } = useQuery({
    queryKey: ["disputes", "mine"],
    queryFn: fetchMyDisputes,
  });

  const [showForm, setShowForm] = useState(false);
  const [description, setDescription] = useState("");

  const file = useMutation({
    mutationFn: () => fileDispute({ category: "payment", description }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["disputes", "mine"] });
      setDescription("");
      setShowForm(false);
    },
  });

  return (
    <Card>
      <View style={styles.rowBetween}>
        <Text style={styles.sectionTitle}>Disputes</Text>
        <TouchableOpacity onPress={() => setShowForm((v) => !v)}>
          <Ionicons name="add-circle" size={26} color={accentColor} />
        </TouchableOpacity>
      </View>
      <Text style={styles.helperText}>
        Use this if something went wrong with a specific loan, repayment, or
        disbursement.
      </Text>

      {showForm && (
        <View style={styles.formBox}>
          <TextInput
            style={[styles.input, { height: 90, textAlignVertical: "top" }]}
            placeholder="Describe what happened (at least 10 characters)..."
            placeholderTextColor={Colors.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
          />
          <Button
            title={file.isPending ? "Submitting…" : "Submit Dispute"}
            onPress={() => file.mutate()}
            color={accentColor}
            disabled={file.isPending || description.trim().length < 10}
          />
        </View>
      )}

      {isLoading ? (
        <SkeletonList count={2} cardHeight={72} />
      ) : !disputes?.length ? (
        <Text style={styles.emptyText}>No disputes filed.</Text>
      ) : (
        disputes.map((d) => (
          <View key={d.id} style={styles.disputeRow}>
            <View style={styles.rowBetween}>
              <Badge label={categoryLabel[d.category] ?? d.category} variant="default" />
              <Badge label={d.status} variant={statusVariant[d.status] ?? "default"} />
            </View>
            <Text style={styles.disputeDesc}>{d.description}</Text>
            {d.resolution_note && (
              <Text style={styles.resolutionNote}>Resolution: {d.resolution_note}</Text>
            )}
            <Text style={styles.disputeDate}>
              Filed {new Date(d.created_at).toLocaleDateString()}
            </Text>
          </View>
        ))
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { ...Typography.h4, color: Colors.textPrimary },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  helperText: { ...Typography.small, color: Colors.textSecondary, marginTop: 4, marginBottom: Spacing.sm },
  formBox: { gap: Spacing.sm, marginBottom: Spacing.md },
  input: {
    backgroundColor: Colors.surfaceLift,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    color: Colors.textPrimary,
    ...Typography.body,
    marginBottom: Spacing.sm,
  },
  emptyText: { ...Typography.body, color: Colors.textMuted, textAlign: "center", paddingVertical: Spacing.lg },
  disputeRow: { paddingVertical: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border, gap: 4 },
  disputeDesc: { ...Typography.body, color: Colors.textPrimary },
  resolutionNote: { ...Typography.small, color: Colors.textSecondary },
  disputeDate: { ...Typography.caption, color: Colors.textMuted },
});
