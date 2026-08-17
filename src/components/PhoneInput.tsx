import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors, Spacing, BorderRadius, useScaledTypography } from "../theme";
import { Input } from "./Input";

interface Props {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  editable?: boolean;
  maxLength?: number;
}

/** Phone number field — a separate "+256" box next to the digits. This is
 * the design Sign In originally used on its own; every other screen that
 * collects a phone number now shares it instead of each rolling its own
 * prefix treatment (most used Input's plain inline `prefix` prop, which
 * looks visually different — one box instead of two). */
export function PhoneInput({
  label,
  value,
  onChangeText,
  placeholder = "700 000 000",
  error,
  editable = true,
  maxLength,
}: Props) {
  const typography = useScaledTypography();
  const styles = useMemo(() => makeStyles(typography), [typography]);

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.row}>
        <View style={styles.countryCode}>
          <Text style={styles.countryCodeText}>+256</Text>
        </View>
        <Input
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          keyboardType="phone-pad"
          error={error}
          editable={editable}
          maxLength={maxLength}
          style={{ flex: 1, marginBottom: 0 }}
        />
      </View>
    </View>
  );
}

function makeStyles(typography: ReturnType<typeof useScaledTypography>) {
  return StyleSheet.create({
    wrapper: { marginBottom: Spacing.lg },
    label: {
      ...typography.small,
      color: Colors.textMuted,
      marginBottom: Spacing.xs,
      letterSpacing: 0.8,
      textTransform: "uppercase",
    },
    row: { flexDirection: "row", gap: Spacing.sm },
    countryCode: {
      backgroundColor: Colors.surfaceLift,
      borderWidth: 1,
      borderColor: Colors.border,
      borderRadius: BorderRadius.md,
      paddingHorizontal: Spacing.md,
      justifyContent: "center",
      minHeight: 50,
    },
    countryCodeText: { ...typography.bodyMedium, color: Colors.teal },
  });
}
