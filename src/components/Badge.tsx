import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { Colors, Typography, Spacing, BorderRadius } from "../theme";

type BadgeVariant =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "default"
  | "gold";

interface Props {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

const variantColors: Record<BadgeVariant, { bg: string; text: string }> = {
  success: { bg: Colors.successBg, text: Colors.success },
  warning: { bg: Colors.warningBg, text: Colors.warning },
  danger: { bg: Colors.dangerBg, text: Colors.danger },
  info: { bg: "#1A2A40", text: Colors.info },
  default: { bg: Colors.borderLight, text: Colors.textSecondary },
  gold: { bg: "#2A2215", text: Colors.gold },
};

export function Badge({ label, variant = "default", style }: Props) {
  const c = variantColors[variant];
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }, style]}>
      <Text style={[styles.text, { color: c.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    alignSelf: "flex-start",
  },
  text: {
    ...Typography.caption,
    fontWeight: "600",
  },
});
