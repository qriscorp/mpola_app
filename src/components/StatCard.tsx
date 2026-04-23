import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { Colors, Typography, Spacing, BorderRadius } from "../theme";

interface Props {
  label: string;
  value: string;
  sub?: string;
  color?: string;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export function StatCard({
  label,
  value,
  sub,
  color = Colors.teal,
  icon,
  style,
}: Props) {
  return (
    <View style={[styles.container, style]}>
      {icon && (
        <View style={[styles.iconWrap, { backgroundColor: color + "15" }]}>
          {icon}
        </View>
      )}
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {sub && <Text style={[styles.sub, { color }]}>{sub}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 80,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },
  value: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  label: {
    ...Typography.small,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  sub: {
    ...Typography.smallMedium,
    marginTop: 2,
  },
});
