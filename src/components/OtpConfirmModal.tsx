import React, { useEffect, useMemo, useRef, useState } from "react";
import { Modal, View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, BorderRadius, useScaledTypography } from "../theme";

interface Props {
  visible: boolean;
  title: string;
  message: string;
  accentColor?: string;
  /** Verifying the entered code with the server. */
  loading?: boolean;
  /** Re-sending a fresh code. */
  resending?: boolean;
  error?: string | null;
  onCancel: () => void;
  onConfirm: (code: string) => void;
  onResend: () => void;
}

/** A 6-digit SMS code confirmation — same on-brand card as ConfirmModal, but
 * for the step-up verification flows (wallet withdrawal, etc.) that need an
 * actual code instead of a yes/no choice. Matches the digit-box style
 * already used on sign-in's 2FA step and the email/phone verify screens. */
export function OtpConfirmModal({
  visible,
  title,
  message,
  accentColor = Colors.teal,
  loading = false,
  resending = false,
  error,
  onCancel,
  onConfirm,
  onResend,
}: Props) {
  const typography = useScaledTypography();
  const styles = useMemo(() => makeStyles(typography), [typography]);
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const refs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (visible) setCode(["", "", "", "", "", ""]);
  }, [visible]);

  const handleDigit = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...code];
    next[index] = digit;
    setCode(next);
    if (digit && index < 5) {
      refs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === "Backspace" && !code[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  const full = code.join("");

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={[styles.iconBadge, { backgroundColor: accentColor + "20" }]}>
            <Ionicons name="key-outline" size={28} color={accentColor} />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.otpRow}>
            {code.map((digit, i) => (
              <TextInput
                key={i}
                ref={(el) => {
                  refs.current[i] = el;
                }}
                style={[styles.otpBox, digit ? { borderColor: accentColor } : null]}
                value={digit}
                onChangeText={(v) => handleDigit(i, v)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(i, nativeEvent.key)}
                keyboardType="number-pad"
                maxLength={1}
                textAlign="center"
                selectTextOnFocus
                editable={!loading}
              />
            ))}
          </View>

          {!!error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity onPress={onResend} disabled={resending || loading} style={styles.resendBtn}>
            <Text style={[styles.resendText, { color: accentColor }]}>
              {resending ? "Sending…" : "Resend code"}
            </Text>
          </TouchableOpacity>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} disabled={loading}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.confirmBtn,
                { backgroundColor: accentColor },
                (loading || full.length < 6) && styles.confirmBtnDisabled,
              ]}
              onPress={() => onConfirm(full)}
              disabled={loading || full.length < 6}
            >
              {loading ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Text style={styles.confirmText}>Verify</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function makeStyles(typography: ReturnType<typeof useScaledTypography>) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: Colors.overlay,
      alignItems: "center",
      justifyContent: "center",
      padding: Spacing.xl,
    },
    card: {
      width: "100%",
      maxWidth: 360,
      backgroundColor: Colors.surface,
      borderRadius: BorderRadius.xl,
      padding: Spacing.xl,
      alignItems: "center",
    },
    iconBadge: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: Spacing.md,
    },
    title: {
      ...typography.h4,
      color: Colors.textPrimary,
      textAlign: "center",
      marginBottom: Spacing.xs,
    },
    message: {
      ...typography.small,
      color: Colors.textSecondary,
      textAlign: "center",
      lineHeight: 20,
      marginBottom: Spacing.lg,
    },
    otpRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      width: "100%",
      gap: 6,
      marginBottom: Spacing.sm,
    },
    otpBox: {
      flex: 1,
      height: 48,
      borderRadius: BorderRadius.md,
      borderWidth: 2,
      borderColor: Colors.border,
      backgroundColor: Colors.background,
      color: Colors.textPrimary,
      fontSize: 20,
      fontWeight: "700",
    },
    error: { ...typography.caption, color: Colors.danger, textAlign: "center", marginTop: Spacing.xs },
    resendBtn: { marginTop: Spacing.md, marginBottom: Spacing.lg },
    resendText: { ...typography.smallMedium, fontWeight: "700" },
    actions: { flexDirection: "row", gap: Spacing.sm, width: "100%" },
    cancelBtn: {
      flex: 1,
      borderRadius: BorderRadius.full,
      paddingVertical: Spacing.sm,
      alignItems: "center",
      borderWidth: 1,
      borderColor: Colors.border,
    },
    cancelText: { ...typography.buttonSmall, color: Colors.textSecondary },
    confirmBtn: {
      flex: 1,
      borderRadius: BorderRadius.full,
      paddingVertical: Spacing.sm,
      alignItems: "center",
      justifyContent: "center",
    },
    confirmBtnDisabled: { opacity: 0.5 },
    confirmText: { ...typography.buttonSmall, color: Colors.white },
  });
}
