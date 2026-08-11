import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from "react-native";
import { Colors, Typography, Spacing } from "../theme";

interface Props {
  id: string;
  amount: number;
  description: string;
  date: string;
  type: "credit" | "debit";
  onPress?: () => void;
  style?: ViewStyle;
}

export function TransactionItem({
  amount,
  description,
  date,
  type,
  onPress,
  style,
}: Props) {
  const isCredit = type === "credit";

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.6 : 1}
      onPress={onPress}
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
});
