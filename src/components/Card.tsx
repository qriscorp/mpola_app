import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { Colors, Typography, Spacing, BorderRadius, Shadow } from "../theme";

interface Props {
  children: React.ReactNode;
  title?: string;
  style?: ViewStyle;
  noPadding?: boolean;
}

export function Card({ children, title, style, noPadding }: Props) {
  return (
    <View style={[styles.card, noPadding && { padding: 0 }, style]}>
      {title && <Text style={styles.title}>{title}</Text>}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  title: {
    ...Typography.h4,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
});
