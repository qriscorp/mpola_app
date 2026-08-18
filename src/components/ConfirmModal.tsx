import React, { useMemo } from "react";
import { Modal, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, BorderRadius, useScaledTypography } from "../theme";

interface Props {
  visible: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Red icon/confirm-button treatment for irreversible or destructive
   * actions (sign out, withdraw, decline, deactivate). Defaults to the
   * given accentColor for a neutral confirm. */
  destructive?: boolean;
  accentColor?: string;
  /** Shows a spinner in the confirm button and disables both buttons —
   * for confirms that kick off an async action before this modal closes. */
  loading?: boolean;
  /** Optional structured content (e.g. a fee/line-item breakdown) rendered
   * between the message and the action buttons — for confirms that need
   * more than a sentence, without falling back to a wall of plain text. */
  children?: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

/** A label/value row for use inside ConfirmModal's `children` slot — a
 * fee breakdown, loan terms, anything a plain sentence can't carry. */
export function ConfirmDetailRow({
  label,
  value,
  valueColor,
  emphasis,
}: {
  label: string;
  value: string;
  valueColor?: string;
  /** Slightly bolder/larger — for a total or other standout row. */
  emphasis?: boolean;
}) {
  const typography = useScaledTypography();
  const styles = useMemo(() => makeStyles(typography), [typography]);
  return (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, emphasis && styles.detailLabelEmphasis]}>{label}</Text>
      <Text
        style={[
          styles.detailValue,
          emphasis && styles.detailValueEmphasis,
          valueColor ? { color: valueColor } : null,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

/** The app's one reusable confirmation dialog — every "are you sure?" gets
 * the same on-brand look (a color-matched icon badge, centered copy, two
 * full-width actions) instead of the OS's plain native Alert.alert. */
export function ConfirmModal({
  visible,
  icon = "help-circle",
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  accentColor = Colors.teal,
  loading = false,
  children,
  onConfirm,
  onCancel,
}: Props) {
  const typography = useScaledTypography();
  const styles = useMemo(() => makeStyles(typography), [typography]);
  const tone = destructive ? Colors.danger : accentColor;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={[styles.iconBadge, { backgroundColor: tone + "20" }]}>
            <Ionicons name={icon} size={28} color={tone} />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={[styles.message, children ? { marginBottom: Spacing.md } : null]}>{message}</Text>
          {children && <View style={styles.detailsBlock}>{children}</View>}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onCancel}
              disabled={loading}
            >
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: tone }, loading && styles.confirmBtnLoading]}
              onPress={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Text style={styles.confirmText}>{confirmLabel}</Text>
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
      maxWidth: 340,
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
      marginBottom: Spacing.xl,
    },
    detailsBlock: {
      width: "100%",
      backgroundColor: Colors.background,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      marginBottom: Spacing.lg,
    },
    detailRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: Spacing.xs,
    },
    detailLabel: { ...typography.caption, color: Colors.textMuted },
    detailLabelEmphasis: { ...typography.smallMedium, color: Colors.textSecondary },
    detailValue: { ...typography.caption, color: Colors.textSecondary, fontWeight: "600" },
    detailValueEmphasis: { ...typography.smallMedium, color: Colors.textPrimary, fontWeight: "700" },
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
    confirmBtnLoading: { opacity: 0.8 },
    confirmText: { ...typography.buttonSmall, color: Colors.white },
  });
}
