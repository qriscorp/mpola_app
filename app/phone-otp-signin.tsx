import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Colors, Typography, Spacing, BorderRadius } from "../src/theme";
import { Button, Input } from "../src/components";
import {
  apiSendLoginPhoneOtp,
  apiVerifyLoginPhoneOtp,
} from "../src/services/auth";

type Step = "phone" | "otp";

export default function PhoneOtpSigninScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const otpRefs = useRef<(TextInput | null)[]>([]);

  // ── Step 1: send OTP ──────────────────────────────────────
  const handleSend = async () => {
    if (!phone.trim()) {
      setError("Please enter your phone number.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await apiSendLoginPhoneOtp(phone.trim());
      setStep("otp");
    } catch (e: any) {
      setError(e?.message || "Could not send code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: verify OTP and sign in ────────────────────────
  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length < 6) {
      setError("Please enter the full 6-digit code.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const user = await apiVerifyLoginPhoneOtp(phone.trim(), code);
      const role = user.role;
      if (role === "lender") {
        router.replace("/(lender)/home");
      } else {
        router.replace("/(borrower)/home");
      }
    } catch (e: any) {
      setError(e?.message || "Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── OTP digit helpers ─────────────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (index: number, key: string) => {
    if (key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back */}
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        {/* Header */}
        <Text style={styles.title}>
          {step === "phone" ? "Sign In with Phone" : "Enter Code"}
        </Text>
        <Text style={styles.subtitle}>
          {step === "phone"
            ? "We'll send a one-time code to your registered phone number."
            : `Enter the 6-digit code sent to ${phone}`}
        </Text>

        {/* Error */}
        {!!error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* ── STEP 1 ── */}
        {step === "phone" && (
          <>
            <Input
              label="Phone Number"
              value={phone}
              onChangeText={setPhone}
              placeholder="0772 XXX XXX"
              keyboardType="phone-pad"
            />
            <View style={{ height: Spacing.lg }} />
            <Button
              title={loading ? "Sending…" : "Send Code"}
              onPress={handleSend}
              color={Colors.teal}
              disabled={loading || !phone}
            />
          </>
        )}

        {/* ── STEP 2 ── */}
        {step === "otp" && (
          <>
            <View style={styles.otpRow}>
              {otp.map((digit, i) => (
                <TextInput
                  key={i}
                  ref={(el) => {
                    otpRefs.current[i] = el;
                  }}
                  style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
                  value={digit}
                  onChangeText={(v) => handleOtpChange(i, v)}
                  onKeyPress={({ nativeEvent }) =>
                    handleOtpKeyPress(i, nativeEvent.key)
                  }
                  keyboardType="number-pad"
                  maxLength={1}
                  textAlign="center"
                  selectTextOnFocus
                />
              ))}
            </View>
            <View style={{ height: Spacing.lg }} />
            <Button
              title={loading ? "Verifying…" : "Sign In"}
              onPress={handleVerify}
              color={Colors.teal}
              disabled={loading || otp.join("").length < 6}
            />
            <TouchableOpacity
              style={styles.resendBtn}
              onPress={() => {
                setOtp(["", "", "", "", "", ""]);
                setStep("phone");
              }}
            >
              <Text style={styles.resendText}>
                Didn't receive it? Try again
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.navy },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.section,
  },
  back: { marginBottom: Spacing.lg },
  backText: { ...Typography.body, color: Colors.teal },
  title: { ...Typography.h2, color: Colors.white, marginBottom: Spacing.sm },
  subtitle: {
    ...Typography.body,
    color: Colors.textMuted,
    marginBottom: Spacing.xl,
  },
  errorBox: {
    backgroundColor: Colors.dangerLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  errorText: { ...Typography.small, color: Colors.danger },
  otpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  otpBox: {
    flex: 1,
    height: 56,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.navyLight,
    color: Colors.white,
    fontSize: 24,
    fontWeight: "700",
  },
  otpBoxFilled: { borderColor: Colors.teal },
  resendBtn: { marginTop: Spacing.lg, alignItems: "center" },
  resendText: { ...Typography.body, color: Colors.teal },
});
