import React, { useMemo } from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { Colors, Spacing, BorderRadius, Shadow, useScaledTypography } from "../theme";

interface Props {
  children: React.ReactNode;
  title?: string;
  style?: ViewStyle;
  noPadding?: boolean;
}

export function Card({ children, title, style, noPadding }: Props) {
  const typography = useScaledTypography();
  const styles = useMemo(() => makeStyles(typography), [typography]);
  return (
    <View style={[styles.card, noPadding && { padding: 0 }, style]}>
      {title && <Text style={styles.title}>{title}</Text>}
      {children}
    </View>
  );
}

function makeStyles(typography: ReturnType<typeof useScaledTypography>) {
  return StyleSheet.create({
    card: {
      backgroundColor: Colors.surface,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
    },
    title: {
      ...typography.h4,
      color: Colors.textPrimary,
      marginBottom: Spacing.md,
    },
  });
}
