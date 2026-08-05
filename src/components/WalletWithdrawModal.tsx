import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { Colors, Typography, Spacing, BorderRadius } from "../theme";
import { Input } from "./Input";
import { Button } from "./Button";
import type { BankOption } from "../models";

interface Props {
  visible: boolean;
  onClose: () => void;
  onWithdrawMobileMoney: (data: {
    amount: number;
    phone: string;
  }) => Promise<unknown>;
  onWithdrawBank: (data: {
    amount: number;
    accountBank: string;
    accountNumber: string;
    beneficiaryName: string;
  }) => Promise<unknown>;
  banks: BankOption[];
  banksLoading?: boolean;
  isSubmittingMobileMoney?: boolean;
  isSubmittingBank?: boolean;
  accentColor?: string;
}

type Method = "mobile_money" | "bank";

export function WalletWithdrawModal({
  visible,
  onClose,
  onWithdrawMobileMoney,
  onWithdrawBank,
  banks,
  banksLoading,
  isSubmittingMobileMoney,
  isSubmittingBank,
  accentColor = Colors.teal,
}: Props) {
  const [method, setMethod] = useState<Method>("mobile_money");
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedBank, setSelectedBank] = useState<BankOption | null>(null);
  const [accountNumber, setAccountNumber] = useState("");
  const [beneficiaryName, setBeneficiaryName] = useState("");

  const isSubmitting = isSubmittingMobileMoney || isSubmittingBank;
  const bankValid = !!selectedBank && !!accountNumber && !!beneficiaryName;
  const canSubmit =
    !!amount &&
    (method === "mobile_money" ? !!phone : bankValid) &&
    !isSubmitting;

  const handleSubmit = async () => {
    const numericAmount = Number(amount);
    try {
      if (method === "mobile_money") {
        await onWithdrawMobileMoney({ amount: numericAmount, phone });
      } else if (selectedBank) {
        await onWithdrawBank({
          amount: numericAmount,
          accountBank: selectedBank.code,
          accountNumber,
          beneficiaryName,
        });
      }
      onClose();
    } catch (e) {
      Alert.alert(
        "Withdrawal failed",
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
          <Text style={styles.title}>Withdraw Funds</Text>

          <View style={styles.tabs}>
            {(["mobile_money", "bank"] as Method[]).map((m) => (
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
                  {m === "mobile_money" ? "Mobile Money" : "Bank Transfer"}
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
            <>
              <Text style={styles.label}>Bank</Text>
              <ScrollView style={styles.bankList} nestedScrollEnabled>
                {banksLoading ? (
                  <Text style={styles.hint}>Loading banks…</Text>
                ) : (
                  banks.map((b) => (
                    <TouchableOpacity
                      key={b.code}
                      style={[
                        styles.bankRow,
                        selectedBank?.code === b.code && {
                          borderColor: accentColor,
                        },
                      ]}
                      onPress={() => setSelectedBank(b)}
                    >
                      <Text style={styles.bankRowText}>{b.name}</Text>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
              <Input
                label="Account Number"
                value={accountNumber}
                onChangeText={setAccountNumber}
                keyboardType="default"
              />
              <Input
                label="Account Holder Name"
                value={beneficiaryName}
                onChangeText={setBeneficiaryName}
              />
            </>
          )}

          {isSubmittingBank && (
            <Text style={styles.waiting}>Processing your transfer…</Text>
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
    maxHeight: "85%",
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
  label: {
    ...Typography.small,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  bankList: {
    maxHeight: 140,
    marginBottom: Spacing.lg,
  },
  bankRow: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
  },
  bankRowText: { ...Typography.body, color: Colors.textPrimary },
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
