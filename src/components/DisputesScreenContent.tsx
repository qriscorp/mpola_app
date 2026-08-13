import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Colors, Typography, Spacing, BorderRadius } from "../theme";
import { Card } from "./Card";
import { Button } from "./Button";
import { Badge } from "./Badge";
import { SkeletonList } from "./Skeleton";
import { fetchMyDisputes, fileDispute, fetchMyLoansForDispute } from "../services";

const formatCurrency = (amount: number) => `UGX ${amount.toLocaleString()}`;

const statusVariant: Record<string, "info" | "warning" | "success" | "danger"> = {
  open: "info",
  investigating: "warning",
  resolved: "success",
  rejected: "danger",
};

const CATEGORIES: { value: string; label: string }[] = [
  { value: "payment", label: "Payment" },
  { value: "loan_terms", label: "Loan Terms" },
  { value: "fraud", label: "Fraud" },
  { value: "disbursement", label: "Disbursement" },
  { value: "other", label: "Other" },
];

function Chip({ label, active, onPress, color }: { label: string; active: boolean; onPress: () => void; color: string }) {
  return (
    <TouchableOpacity
      style={[styles.chip, active && { backgroundColor: color, borderColor: color }]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function DisputesScreenContent({
  accentColor = Colors.teal,
  detailRoute,
  role,
}: {
  accentColor?: string;
  detailRoute: string;
  role: "borrower" | "lender";
}) {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: disputes, isLoading } = useQuery({
    queryKey: ["disputes", "mine"],
    queryFn: fetchMyDisputes,
  });
  const { data: loans } = useQuery({
    queryKey: ["loans", "mine-for-dispute"],
    queryFn: fetchMyLoansForDispute,
  });

  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState("payment");
  const [loanId, setLoanId] = useState<string | null>(null);
  const [description, setDescription] = useState("");

  const file = useMutation({
    mutationFn: () => fileDispute({ category, description, loan_id: loanId ?? undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["disputes", "mine"] });
      setDescription("");
      setLoanId(null);
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
        Something wrong with a specific loan? File it here — the other party is notified and most
        disputes get resolved directly between you two.
      </Text>

      {showForm && (
        <View style={styles.formBox}>
          <Text style={styles.fieldLabel}>Category</Text>
          <View style={styles.chipRow}>
            {CATEGORIES.map((c) => (
              <Chip key={c.value} label={c.label} active={category === c.value} onPress={() => setCategory(c.value)} color={accentColor} />
            ))}
          </View>

          <Text style={styles.fieldLabel}>Which loan is this about? (optional)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.sm }}>
            <View style={{ flexDirection: "row", gap: Spacing.xs }}>
              <Chip label="Not loan-specific" active={!loanId} onPress={() => setLoanId(null)} color={accentColor} />
              {loans?.map((l) => (
                <Chip
                  key={l.id}
                  label={`${formatCurrency(l.amount)} — ${role === "borrower" ? l.lenderName : l.borrowerName}`}
                  active={loanId === l.id}
                  onPress={() => setLoanId(l.id)}
                  color={accentColor}
                />
              ))}
            </View>
          </ScrollView>

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
          <TouchableOpacity
            key={d.id}
            style={styles.disputeRow}
            onPress={() => router.push({ pathname: detailRoute as any, params: { disputeId: d.id } })}
          >
            <View style={styles.rowBetween}>
              <Badge label={CATEGORIES.find((c) => c.value === d.category)?.label ?? d.category} variant="default" />
              <Badge label={d.status} variant={statusVariant[d.status] ?? "default"} />
            </View>
            <Text style={styles.disputeDesc} numberOfLines={2}>{d.description}</Text>
            <View style={styles.rowBetween}>
              <Text style={styles.disputeDate}>
                {d.respondent_name ? `With ${d.respondent_name} · ` : ""}
                Filed {new Date(d.created_at).toLocaleDateString()}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </View>
          </TouchableOpacity>
        ))
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { ...Typography.h4, color: Colors.textPrimary },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  helperText: { ...Typography.small, color: Colors.textSecondary, marginTop: 4, marginBottom: Spacing.sm },
  formBox: { gap: Spacing.xs, marginBottom: Spacing.md },
  fieldLabel: { ...Typography.smallMedium, color: Colors.textSecondary, marginTop: Spacing.sm },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.xs, marginBottom: Spacing.sm },
  chip: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
  },
  chipText: { ...Typography.caption, color: Colors.textSecondary, fontWeight: "600" },
  chipTextActive: { color: Colors.white },
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
  disputeDate: { ...Typography.caption, color: Colors.textMuted },
});
