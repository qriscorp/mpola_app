import React, { useEffect, useMemo, useState } from "react";
import { Modal, View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, BorderRadius, useScaledTypography } from "../theme";
import { registerAlertListener, type AlertState } from "../services/alerts";

export type AlertTone = "default" | "success" | "danger" | "warning";
export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
}

interface Props {
  visible: boolean;
  title: string;
  message?: string;
  buttons: AlertButton[];
  tone: AlertTone;
  onRequestClose: () => void;
}

const TONE_META: Record<AlertTone, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  default: { icon: "information-circle", color: Colors.teal },
  success: { icon: "checkmark-circle", color: Colors.success },
  danger: { icon: "close-circle", color: Colors.danger },
  warning: { icon: "warning", color: Colors.warning },
};

/** The app's replacement for React Native's native Alert.alert — same
 * single-title/message/buttons shape, but rendered in Mpola's own dark
 * theme (matches ConfirmModal's overlay/card/icon-badge exactly) instead
 * of the OS's plain white system dialog. Triggered via
 * src/services/alerts.ts's showAlert(), never rendered directly by callers
 * — AlertHost (mounted once in app/_layout.tsx) owns the single instance. */
export function AlertModal({ visible, title, message, buttons, tone, onRequestClose }: Props) {
  const typography = useScaledTypography();
  const styles = useMemo(() => makeStyles(typography), [typography]);
  const meta = TONE_META[tone];

  const handlePress = (btn: AlertButton) => {
    onRequestClose();
    btn.onPress?.();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onRequestClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={[styles.iconBadge, { backgroundColor: meta.color + "20" }]}>
            <Ionicons name={meta.icon} size={28} color={meta.color} />
          </View>
          <Text style={styles.title}>{title}</Text>
          {!!message && <Text style={styles.message}>{message}</Text>}
          <View style={styles.actions}>
            {buttons.map((btn, i) => {
              const isCancel = btn.style === "cancel";
              const isDestructive = btn.style === "destructive";
              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.btn,
                    isCancel
                      ? styles.cancelBtn
                      : { backgroundColor: isDestructive ? Colors.danger : meta.color },
                  ]}
                  onPress={() => handlePress(btn)}
                >
                  <Text style={isCancel ? styles.cancelText : styles.actionText}>{btn.text}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

/** Mounted once, at the app root (app/_layout.tsx) — subscribes to
 * showAlert() calls from anywhere (screens, components, or plain service
 * files like realtime.ts) and renders the single shared AlertModal
 * instance. Nothing else should render <AlertModal> directly. */
export function AlertHost() {
  const [state, setState] = useState<AlertState | null>(null);

  useEffect(() => {
    registerAlertListener(setState);
    return () => registerAlertListener(null);
  }, []);

  return (
    <AlertModal
      visible={!!state}
      title={state?.title ?? ""}
      message={state?.message}
      buttons={state?.buttons ?? [{ text: "OK" }]}
      tone={state?.tone ?? "default"}
      onRequestClose={() => setState(null)}
    />
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
    actions: { flexDirection: "row", gap: Spacing.sm, width: "100%" },
    btn: {
      flex: 1,
      borderRadius: BorderRadius.full,
      paddingVertical: Spacing.sm,
      alignItems: "center",
      justifyContent: "center",
    },
    cancelBtn: { borderWidth: 1, borderColor: Colors.border },
    cancelText: { ...typography.buttonSmall, color: Colors.textSecondary },
    actionText: { ...typography.buttonSmall, color: Colors.white },
  });
}
