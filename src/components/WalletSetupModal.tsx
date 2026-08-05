import React, { useState } from "react";
import { Modal, View, Text, StyleSheet } from "react-native";
import { Colors, Typography, Spacing, BorderRadius } from "../theme";
import { Input } from "./Input";
import { Button } from "./Button";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (pin: string) => void;
  loading?: boolean;
  error?: string;
  accentColor?: string;
}

export function WalletSetupModal({
  visible,
  onClose,
  onSubmit,
  loading,
  error,
  accentColor = Colors.teal,
}: Props) {
  const [pin, setPin] = useState("");
  const valid = pin.length >= 4 && pin.length <= 6;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Set Up Your Wallet</Text>
          <Text style={styles.subtitle}>
            Create a 4-6 digit PIN to secure deposits and withdrawals.
          </Text>
          <Input
            label="Wallet PIN"
            value={pin}
            onChangeText={(t) => setPin(t.replace(/\D/g, "").slice(0, 6))}
            placeholder="••••"
            keyboardType="numeric"
            secureTextEntry
            error={error}
          />
          <View style={styles.actions}>
            <Button
              title="Cancel"
              variant="outline"
              onPress={onClose}
              style={styles.flex}
            />
            <Button
              title="Confirm"
              onPress={() => onSubmit(pin)}
              loading={loading}
              disabled={!valid}
              color={accentColor}
              style={styles.flex}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: "center",
    padding: Spacing.lg,
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
  },
  title: {
    ...Typography.h3,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.small,
    color: Colors.textMuted,
    marginBottom: Spacing.lg,
  },
  actions: { flexDirection: "row", gap: Spacing.md, marginTop: Spacing.sm },
  flex: { flex: 1 },
});
