import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from "react-native";
import { Colors, Typography, Spacing, BorderRadius, Shadow } from "../theme";

interface Props {
  amount: number;
  description: string;
  date: string;
  type: "credit" | "debit";
  style?: ViewStyle;
}

export function TransactionItem({
  amount,
  description,
  date,
  type,
  style,
}: Props) {
  const isCredit = type === "credit";
  return (
    <View style={[styles.row, style]}>
      <View
        style={[
          styles.icon,
          {
            backgroundColor: isCredit ? Colors.successBg : Colors.dangerBg,
          },
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
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
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
});
