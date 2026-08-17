import React, { useEffect, useMemo, useState } from "react";
import { Modal, View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Colors, Spacing, BorderRadius, useScaledTypography } from "../theme";
import { Input } from "./Input";
import { PhoneInput } from "./PhoneInput";
import { Button } from "./Button";
import { detectCarrier } from "../services/fees";
import { fetchProfile } from "../services";

interface Props {
  visible: boolean;
  onClose: () => void;
  onDepositMobileMoney: (data: {
    amount: number;
    phone: string;
    carrier: "MTN" | "AIRTEL";
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
  const typography = useScaledTypography();
  const styles = useMemo(() => makeStyles(typography), [typography]);
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: fetchProfile });
  const [method, setMethod] = useState<Method>("mobile_money");
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [carrierOverride, setCarrierOverride] = useState<"MTN" | "AIRTEL" | null>(null);

  // Auto-fill from the account's saved phone number and auto-select the
  // matching network — same as kumpi. Only runs before the user has typed
  // or picked anything themselves, so it never clobbers a manual choice.
  useEffect(() => {
    if (!phoneTouched && !phone && profile?.phone) {
      const digits = profile.phone.replace(/\D/g, "").slice(-9);
      if (digits.length === 9) {
        setPhone(digits);
        setCarrierOverride(detectCarrier(`0${digits}`));
      }
    }
  }, [profile, phone, phoneTouched]);

  const isSubmitting = isSubmittingMobileMoney || isSubmittingCard;
  const canSubmit =
    !!amount && (method === "card" || phone.length === 9) && !isSubmitting;
  const carrier = carrierOverride ?? detectCarrier(phone ? `0${phone}` : "");
  const phoneError =
    method === "mobile_money" && phone.length > 0 && phone.length !== 9
      ? "Enter a full 9-digit number after +256"
      : null;

  const handleSubmit = async () => {
    const numericAmount = Number(amount);
    try {
      if (method === "mobile_money") {
        await onDepositMobileMoney({ amount: numericAmount, phone: `+256${phone}`, carrier });
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
            placeholder="e.g. 1000"
            keyboardType="numeric"
          />

          {method === "mobile_money" ? (
            <>
              <PhoneInput
                label="Phone Number"
                value={phone}
                onChangeText={(t) => {
                  setPhoneTouched(true);
                  setPhone(t.replace(/\D/g, "").slice(0, 9));
                }}
                error={phoneError ?? undefined}
              />
              <Text style={styles.label}>Network</Text>
              <View style={styles.tabs}>
                {(["MTN", "AIRTEL"] as const).map((c) => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => {
                      setPhoneTouched(true);
                      setCarrierOverride(c);
                    }}
                    style={[
                      styles.tab,
                      carrier === c && { backgroundColor: Colors.navyLight },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tabText,
                        carrier === c && { color: Colors.textPrimary },
                      ]}
                    >
                      {c === "MTN" ? "MTN Mobile Money" : "Airtel Money"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          ) : (
            <Text style={styles.hint}>
              You&apos;ll complete your card payment in a secure browser.
              We&apos;ll confirm it automatically once you&apos;re done.
            </Text>
          )}

          {!!Number(amount) && (
            <View style={styles.feeBox}>
              <View style={styles.feeRow}>
                <Text style={styles.feeLabel}>You&apos;re depositing</Text>
                <Text style={styles.feeValue}>
                  UGX {Number(amount).toLocaleString()}
                </Text>
              </View>
              <View style={styles.feeRow}>
                <Text style={styles.feeLabel}>Via</Text>
                <Text style={styles.feeValue}>
                  {method === "mobile_money"
                    ? `${carrier === "MTN" ? "MTN Mobile Money" : "Airtel Money"}${phone.length === 9 ? ` · +256${phone}` : ""}`
                    : "Card"}
                </Text>
              </View>
              <View style={[styles.feeRow, styles.feeTotalRow]}>
                <Text style={styles.feeTotalLabel}>Deposit fee</Text>
                <Text style={styles.feeTotalLabel}>Free</Text>
              </View>
            </View>
          )}

          {isSubmittingCard && (
            <Text style={styles.waiting}>Waiting for payment confirmation…</Text>
          )}

          <View style={styles.actions}>
            <Button
              title={isSubmittingCard ? "Close (keeps waiting)" : "Cancel"}
              variant="outline"
              onPress={onClose}
              disabled={isSubmittingMobileMoney}
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

function makeStyles(typography: ReturnType<typeof useScaledTypography>) {
  return StyleSheet.create({
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
      ...typography.h3,
      color: Colors.textPrimary,
      marginBottom: Spacing.md,
    },
    label: {
      ...typography.small,
      color: Colors.textMuted,
      marginBottom: Spacing.xs,
      letterSpacing: 0.8,
      textTransform: "uppercase",
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
    tabText: { ...typography.smallMedium, color: Colors.textSecondary },
    hint: {
      ...typography.small,
      color: Colors.textMuted,
      marginBottom: Spacing.lg,
    },
    feeBox: {
      backgroundColor: Colors.navyLight,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      marginBottom: Spacing.md,
      gap: Spacing.xs,
    },
    feeRow: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    feeLabel: { ...typography.small, color: Colors.textSecondary },
    feeValue: { ...typography.small, color: Colors.textSecondary },
    feeTotalRow: {
      borderTopWidth: 1,
      borderTopColor: Colors.border,
      paddingTop: Spacing.xs,
      marginTop: Spacing.xs,
    },
    feeTotalLabel: { ...typography.smallMedium, color: Colors.textPrimary },
    waiting: {
      ...typography.small,
      color: Colors.warning,
      marginBottom: Spacing.sm,
    },
    actions: { flexDirection: "row", gap: Spacing.md, marginTop: Spacing.sm },
    flex: { flex: 1 },
  });
}
