import React, { useState } from "react";
import { Modal, View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Colors, Typography, Spacing, BorderRadius } from "../theme";
import { Input } from "./Input";
import { Button } from "./Button";

interface Props {
  visible: boolean;
  onClose: () => void;
  onDepositMobileMoney: (data: {
    amount: number;
    phone: string;
  }) => Promise<unknown>;
  onDepositCard: (data: { amount: number }) => Promise<unknown>;
  isSubmittingMobileMoney?: boolean;
  isSubmittingCard?: boolean;
  accentColor?: string;
}

type Method = "mobile_money" | "card";

export function WalletDepositModal({
  visible,
  onClose,
  onDepositMobileMoney,
  onDepositCard,
  isSubmittingMobileMoney,
  isSubmittingCard,
  accentColor = Colors.teal,
}: Props) {
  const [method, setMethod] = useState<Method>("mobile_money");
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");

  const isSubmitting = isSubmittingMobileMoney || isSubmittingCard;
  const canSubmit =
    !!amount && (method === "card" || !!phone) && !isSubmitting;

  const handleSubmit = async () => {
    const numericAmount = Number(amount);
    try {
      if (method === "mobile_money") {
        await onDepositMobileMoney({ amount: numericAmount, phone });
      } else {
        await onDepositCard({ amount: numericAmount });
      }
      onClose();
    } catch (e) {
      Alert.alert(
        "Deposit failed",
        e instanceof Error ? e.message : "Please try again.",
      );
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Deposit Funds</Text>

          <View style={styles.tabs}>
            {(["mobile_money", "card"] as Method[]).map((m) => (
              <TouchableOpacity
                key={m}
                onPress={() => setMethod(m)}
                style={[
                  styles.tab,
                  method === m && { backgroundColor: Colors.navyLight },
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    method === m && { color: Colors.textPrimary },
                  ]}
                >
                  {m === "mobile_money" ? "Mobile Money" : "Card"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Input
            label="Amount (UGX)"
            value={amount}
            onChangeText={setAmount}
            placeholder="e.g. 500000"
            keyboardType="numeric"
          />

          {method === "mobile_money" ? (
            <Input
              label="Phone Number"
              value={phone}
              onChangeText={setPhone}
              placeholder="+256 7XX XXX XXX"
              keyboardType="phone-pad"
            />
          ) : (
            <Text style={styles.hint}>
              You&apos;ll complete your card payment in a secure browser.
              We&apos;ll confirm it automatically once you&apos;re done.
            </Text>
          )}

          {isSubmittingCard && (
            <Text style={styles.waiting}>Waiting for payment confirmation…</Text>
          )}

          <View style={styles.actions}>
            <Button
              title="Cancel"
              variant="outline"
              onPress={onClose}
              disabled={isSubmitting}
              style={styles.flex}
            />
            <Button
              title="Confirm"
              onPress={handleSubmit}
              loading={isSubmitting}
              disabled={!canSubmit}
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
    marginBottom: Spacing.md,
  },
  tabs: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  tabText: { ...Typography.smallMedium, color: Colors.textSecondary },
  hint: {
    ...Typography.small,
    color: Colors.textMuted,
    marginBottom: Spacing.lg,
  },
  waiting: {
    ...Typography.small,
    color: Colors.warning,
    marginBottom: Spacing.sm,
  },
  actions: { flexDirection: "row", gap: Spacing.md, marginTop: Spacing.sm },
  flex: { flex: 1 },
});
