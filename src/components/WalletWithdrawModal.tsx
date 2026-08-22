import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Colors, Spacing, BorderRadius, useScaledTypography } from "../theme";
import { Input } from "./Input";
import { PhoneInput } from "./PhoneInput";
import { Button } from "./Button";
import { showAlert } from "../services/alerts";
import { ConfirmModal, ConfirmDetailRow } from "./ConfirmModal";
import { OtpConfirmModal } from "./OtpConfirmModal";
import type { BankOption } from "../models";
import {
  calcMobileMoneyWithdrawalCharges,
  calcBankWithdrawalCharges,
  detectCarrier,
} from "../services/fees";
import { fetchProfile } from "../services";
import { SkeletonBox } from "./Skeleton";

function formatUgx(n: number): string {
  return `UGX ${Math.round(n).toLocaleString()}`;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onWithdrawMobileMoney: (data: {
    amount: number;
    phone: string;
    carrier: "MTN" | "AIRTEL";
    otpCode: string;
  }) => Promise<unknown>;
  onWithdrawBank: (data: {
    amount: number;
    accountBank: string;
    accountNumber: string;
    beneficiaryName: string;
    otpCode: string;
  }) => Promise<unknown>;
  onSendOtp: () => Promise<unknown>;
  isSendingOtp?: boolean;
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
  onSendOtp,
  isSendingOtp,
  banks,
  banksLoading,
  isSubmittingMobileMoney,
  isSubmittingBank,
  accentColor = Colors.teal,
}: Props) {
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: fetchProfile });
  const typography = useScaledTypography();
  const styles = useMemo(() => makeStyles(typography), [typography]);
  const [method, setMethod] = useState<Method>("mobile_money");
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [carrierOverride, setCarrierOverride] = useState<"MTN" | "AIRTEL" | null>(null);
  const [selectedBank, setSelectedBank] = useState<BankOption | null>(null);
  const [accountNumber, setAccountNumber] = useState("");
  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [showFinalConfirm, setShowFinalConfirm] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [resendingOtp, setResendingOtp] = useState(false);

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

  const carrier = carrierOverride ?? detectCarrier(phone ? `0${phone}` : "");
  const phoneError =
    method === "mobile_money" && phone.length > 0 && phone.length !== 9
      ? "Enter a full 9-digit number after +256"
      : null;
  const isSubmitting = isSubmittingMobileMoney || isSubmittingBank;
  const bankValid = !!selectedBank && !!accountNumber && !!beneficiaryName;
  const canSubmit =
    !!amount &&
    (method === "mobile_money" ? phone.length === 9 : bankValid) &&
    !isSubmitting;

  const numericAmount = Number(amount) || 0;
  const charges =
    numericAmount > 0
      ? method === "mobile_money"
        ? calcMobileMoneyWithdrawalCharges(numericAmount, carrier)
        : calcBankWithdrawalCharges(numericAmount)
      : null;

  // "Confirm" on the fee-breakdown step just requests the SMS code — actual
  // submission (and thus the real charge/payout) only happens once that
  // code comes back verified from handleVerifyOtp below.
  const handleRequestOtp = async () => {
    setOtpError(null);
    try {
      await onSendOtp();
      setShowFinalConfirm(false);
      setShowOtpModal(true);
    } catch (e) {
      showAlert(
        "Couldn't send code",
        e instanceof Error ? e.message : "Please try again.",
      );
    }
  };

  const handleResendOtp = async () => {
    setResendingOtp(true);
    setOtpError(null);
    try {
      await onSendOtp();
    } catch (e) {
      setOtpError(e instanceof Error ? e.message : "Couldn't resend the code.");
    } finally {
      setResendingOtp(false);
    }
  };

  const handleVerifyOtp = async (otpCode: string) => {
    setOtpError(null);
    try {
      let fee: number | null | undefined;
      if (method === "mobile_money") {
        const result = (await onWithdrawMobileMoney({
          amount: numericAmount,
          phone: `+256${phone}`,
          carrier,
          otpCode,
        })) as { fee?: number } | undefined;
        fee = result?.fee;
      } else if (selectedBank) {
        const result = (await onWithdrawBank({
          amount: numericAmount,
          accountBank: selectedBank.code,
          accountNumber,
          beneficiaryName,
          otpCode,
        })) as { fee?: number | null } | undefined;
        fee = result?.fee;
      }
      setShowOtpModal(false);
      onClose();
      if (fee != null) {
        showAlert("Withdrawal successful", `${formatUgx(fee)} fee charged.`);
      }
    } catch (e) {
      // Stays open so a wrong/expired code can be retried without redoing
      // the whole form — a fresh Alert on top of an open modal reads as a
      // glitch, an inline message in the modal that's already up doesn't.
      setOtpError(e instanceof Error ? e.message : "Please try again.");
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
            <>
              <Text style={styles.label}>Bank</Text>
              <ScrollView style={styles.bankList} nestedScrollEnabled>
                {banksLoading ? (
                  <View style={{ gap: Spacing.xs }}>
                    {[1, 2, 3].map((i) => (
                      <SkeletonBox key={i} height={40} radius={BorderRadius.md} />
                    ))}
                  </View>
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

          {charges && (
            <View style={styles.feeBox}>
              <View style={styles.feeRow}>
                <Text style={styles.feeLabel}>Recipient receives</Text>
                <Text style={styles.feeValue}>{formatUgx(numericAmount)}</Text>
              </View>
              <View style={styles.feeRow}>
                <Text style={styles.feeLabel}>Platform fee (0.5%)</Text>
                <Text style={styles.feeValue}>
                  {formatUgx(charges.platform_fee)}
                </Text>
              </View>
              <View style={styles.feeRow}>
                <Text style={styles.feeLabel}>
                  {method === "mobile_money"
                    ? "Network fee"
                    : "Flutterwave fee (3%)"}
                </Text>
                <Text style={styles.feeValue}>
                  {formatUgx(charges.provider_fee)}
                </Text>
              </View>
              <View style={[styles.feeRow, styles.feeTotalRow]}>
                <Text style={styles.feeTotalLabel}>
                  Total debited from wallet
                </Text>
                <Text style={styles.feeTotalValue}>
                  {formatUgx(numericAmount + charges.total_fee)}
                </Text>
              </View>
            </View>
          )}

          {isSubmittingBank && (
            <Text style={styles.waiting}>Processing your transfer…</Text>
          )}

          <View style={styles.actions}>
            <Button
              title={isSubmittingBank ? "Close (keeps waiting)" : "Cancel"}
              variant="outline"
              onPress={onClose}
              disabled={isSubmittingMobileMoney}
              style={styles.flex}
            />
            <Button
              title="Confirm"
              onPress={() => setShowFinalConfirm(true)}
              loading={isSubmitting}
              disabled={!canSubmit}
              color={accentColor}
              style={styles.flex}
            />
          </View>
        </View>
      </View>

      <ConfirmModal
        visible={showFinalConfirm}
        icon="cash-outline"
        title="Confirm withdrawal?"
        message={
          method === "mobile_money"
            ? `This sends money to +256${phone} and can't be undone.`
            : `This sends money to ${selectedBank?.name ?? "your bank"} and can't be undone.`
        }
        confirmLabel="Send Code"
        accentColor={accentColor}
        loading={isSendingOtp}
        onCancel={() => setShowFinalConfirm(false)}
        onConfirm={handleRequestOtp}
      >
        {charges && (
          <>
            <ConfirmDetailRow label="Recipient receives" value={formatUgx(numericAmount)} />
            <ConfirmDetailRow label="Platform fee (0.5%)" value={formatUgx(charges.platform_fee)} />
            <ConfirmDetailRow
              label={method === "mobile_money" ? "Network fee" : "Flutterwave fee (3%)"}
              value={formatUgx(charges.provider_fee)}
            />
            <ConfirmDetailRow
              label="Total debited from wallet"
              value={formatUgx(numericAmount + charges.total_fee)}
              valueColor={accentColor}
              emphasis
            />
          </>
        )}
      </ConfirmModal>

      <OtpConfirmModal
        visible={showOtpModal}
        title="Enter verification code"
        message="We sent a 6-digit code to your registered phone number to confirm this withdrawal."
        accentColor={accentColor}
        loading={isSubmitting}
        resending={resendingOtp}
        error={otpError}
        onCancel={() => setShowOtpModal(false)}
        onConfirm={handleVerifyOtp}
        onResend={handleResendOtp}
      />
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
      maxHeight: "85%",
    },
    title: {
      ...typography.h3,
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
    tabText: { ...typography.smallMedium, color: Colors.textSecondary },
    label: {
      ...typography.small,
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
    bankRowText: { ...typography.body, color: Colors.textPrimary },
    hint: {
      ...typography.small,
      color: Colors.textMuted,
      marginBottom: Spacing.lg,
    },
    waiting: {
      ...typography.small,
      color: Colors.warning,
      marginBottom: Spacing.sm,
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
    feeTotalValue: { ...typography.smallMedium, color: Colors.textPrimary },
    actions: { flexDirection: "row", gap: Spacing.md, marginTop: Spacing.sm },
    flex: { flex: 1 },
  });
}
