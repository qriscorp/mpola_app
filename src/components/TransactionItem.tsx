import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from "react-native";
import { Colors, Typography, Spacing, BorderRadius } from "../theme";

interface Props {
  id: string;
  amount: number;
  description: string;
  date: string;
  type: "credit" | "debit";
  status?: "pending" | "completed" | "failed";
  reference?: string | null;
  counterparty?: string;
  createdAt?: string;
  style?: ViewStyle;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-UG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function TransactionItem({
  id,
  amount,
  description,
  date,
  type,
  status,
  reference,
  counterparty,
  createdAt,
  style,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const isCredit = type === "credit";
  const hasDetails = !!(status || reference || counterparty || createdAt);

  return (
    <TouchableOpacity
      activeOpacity={hasDetails ? 0.6 : 1}
      onPress={() => hasDetails && setExpanded((v) => !v)}
      style={[styles.container, style]}
    >
      <View style={styles.row}>
        <View
          style={[
            styles.icon,
            { backgroundColor: isCredit ? Colors.successBg : Colors.dangerBg },
          ]}
        >
          <Text style={{ fontSize: 14 }}>{isCredit ? "↓" : "↑"}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.desc}>{description}</Text>
          <Text style={styles.date}>{date}</Text>
        </View>
        <Text
          style={[
            styles.amount,
            { color: isCredit ? Colors.success : Colors.textPrimary },
          ]}
        >
          {isCredit ? "+" : "-"}UGX {Math.abs(amount).toLocaleString()}
        </Text>
      </View>

      {expanded && (
        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Transaction ID</Text>
            <Text style={styles.detailValue}>{id}</Text>
          </View>
          {reference && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Reference</Text>
              <Text style={styles.detailValue}>{reference}</Text>
            </View>
          )}
          {createdAt && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date &amp; Time</Text>
              <Text style={styles.detailValue}>{formatDateTime(createdAt)}</Text>
            </View>
          )}
          {status && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status</Text>
              <Text style={styles.detailValue}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </View>
          )}
          {counterparty && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Counterparty</Text>
              <Text style={styles.detailValue}>{counterparty}</Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  info: { flex: 1 },
  desc: { ...Typography.bodyMedium, color: Colors.textPrimary },
  date: { ...Typography.small, color: Colors.textMuted, marginTop: 2 },
  amount: { ...Typography.bodySemibold },
  details: {
    backgroundColor: Colors.surfaceLift,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: 4,
  },
  detailRow: { flexDirection: "row", justifyContent: "space-between" },
  detailLabel: { ...Typography.small, color: Colors.textMuted },
  detailValue: {
    ...Typography.smallMedium,
    color: Colors.textPrimary,
    flexShrink: 1,
    textAlign: "right",
    marginLeft: Spacing.md,
  },
});
