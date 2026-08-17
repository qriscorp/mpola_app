import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from "react-native";
import { Colors, BorderRadius, Spacing, useScaledTypography } from "../theme";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface Props {
  title: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  color?: string; // override primary color (teal or gold)
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  color = Colors.teal,
  icon,
  style,
  textStyle,
  fullWidth = true,
}: Props) {
  const typography = useScaledTypography();
  const bg =
    variant === "primary"
      ? color
      : variant === "secondary"
        ? Colors.navy
        : variant === "danger"
          ? Colors.danger
          : "transparent";

  const borderColor =
    variant === "outline"
      ? color
      : variant === "danger"
        ? Colors.danger
        : "transparent";

  const txtColor =
    variant === "primary" || variant === "secondary" || variant === "danger"
      ? Colors.white
      : variant === "outline"
        ? color
        : Colors.textPrimary;

  const height = size === "sm" ? 36 : size === "lg" ? 52 : 44;
  const fontSize =
    size === "sm"
      ? typography.buttonSmall.fontSize
      : typography.button.fontSize;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        styles.base,
        {
          backgroundColor: bg,
          borderColor,
          borderWidth: variant === "outline" ? 1.5 : 0,
          height,
          opacity: disabled ? 0.5 : 1,
        },
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={txtColor} size="small" />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, { color: txtColor, fontSize }, textStyle]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  fullWidth: { width: "100%" },
  text: {
    fontWeight: "600",
  },
});
