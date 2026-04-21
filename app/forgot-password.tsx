import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Colors, Typography, Spacing, BorderRadius } from "../src/theme";
import { Button, Input } from "../src/components";
import {
  apiForgotPasswordSend,
  apiForgotPasswordVerify,
  apiForgotPasswordReset,
} from "../src/services/auth";

type Step = "request" | "verify" | "reset";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("request");
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const otpRefs = useRef<(TextInput | null)[]>([]);

  // ── Step 1: send OTP ──────────────────────────────────────
  const handleSend = async () => {
    if (!identifier.trim()) {
      setError("Please enter your email or phone number.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await apiForgotPasswordSend(identifier.trim());
      setStep("verify");
    } catch (e: any) {
      setError(e?.message || "Could not send reset code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: verify OTP ────────────────────────────────────
  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length < 6) {
      setError("Please enter the full 6-digit code.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await apiForgotPasswordVerify(identifier.trim(), code);
      setResetToken(res.access_token);
      setStep("reset");
    } catch (e: any) {
      setError(e?.message || "Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: set new password ──────────────────────────────
  const handleReset = async () => {
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await apiForgotPasswordReset(newPassword, resetToken);
      Alert.alert(
        "Password Reset",
        "Your password has been updated. Please sign in.",
        [{ text: "Sign In", onPress: () => router.replace("/sign-in") }],
      );
    } catch (e: any) {
      setError(e?.message || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── OTP digit input helpers ───────────────────────────────
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

  // ── Step indicator ────────────────────────────────────────
  const steps: { key: Step; label: string }[] = [
    { key: "request", label: "Request" },
    { key: "verify", label: "Verify" },
    { key: "reset", label: "Reset" },
  ];
  const stepIndex = steps.findIndex((s) => s.key === step);

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
        <Text style={styles.title}>Forgot Password</Text>
        <Text style={styles.subtitle}>
          {step === "request"
            ? "Enter your email or phone to receive a reset code."
            : step === "verify"
              ? "Enter the 6-digit code we sent you."
              : "Choose a new password for your account."}
        </Text>

        {/* Step indicator */}
        <View style={styles.stepRow}>
          {steps.map((s, i) => (
            <React.Fragment key={s.key}>
              <View style={styles.stepItem}>
                <View
                  style={[
                    styles.stepCircle,
                    i <= stepIndex && styles.stepCircleActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.stepNumber,
                      i <= stepIndex && styles.stepNumberActive,
                    ]}
                  >
                    {i + 1}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    i <= stepIndex && styles.stepLabelActive,
                  ]}
                >
                  {s.label}
                </Text>
              </View>
              {i < 2 && (
                <View
                  style={[
                    styles.stepLine,
                    i < stepIndex && styles.stepLineActive,
                  ]}
                />
              )}
            </React.Fragment>
          ))}
        </View>

        {/* Error */}
        {!!error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* ── STEP 1 ── */}
        {step === "request" && (
          <>
            <Input
              label="Email or Phone Number"
              value={identifier}
              onChangeText={setIdentifier}
              placeholder="you@email.com or 0772XXXXXX"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <View style={{ height: Spacing.lg }} />
            <Button
              title={loading ? "Sending…" : "Send Reset Code"}
              onPress={handleSend}
              color={Colors.teal}
              disabled={loading}
            />
          </>
        )}

        {/* ── STEP 2 ── */}
        {step === "verify" && (
          <>
            <Text style={styles.otpHint}>
              Code sent to <Text style={styles.bold}>{identifier}</Text>
            </Text>
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
              title={loading ? "Verifying…" : "Verify Code"}
              onPress={handleVerify}
              color={Colors.teal}
              disabled={loading || otp.join("").length < 6}
            />
            <TouchableOpacity
              style={styles.resendBtn}
              onPress={() => {
                setOtp(["", "", "", "", "", ""]);
                setStep("request");
              }}
            >
              <Text style={styles.resendText}>
                Didn't receive it? Try again
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* ── STEP 3 ── */}
        {step === "reset" && (
          <>
            <Input
              label="New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Min. 8 characters"
              secureTextEntry
            />
            <View style={{ height: Spacing.md }} />
            <Input
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Repeat your new password"
              secureTextEntry
            />
            <View style={{ height: Spacing.lg }} />
            <Button
              title={loading ? "Saving…" : "Reset Password"}
              onPress={handleReset}
              color={Colors.teal}
              disabled={loading || !newPassword || !confirmPassword}
            />
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
  // step indicator
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  stepItem: { alignItems: "center" },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.navyLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.border,
  },
  stepCircleActive: {
    backgroundColor: Colors.teal,
    borderColor: Colors.teal,
  },
  stepNumber: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontWeight: "700",
  },
  stepNumberActive: { color: Colors.white },
  stepLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: 4,
    fontSize: 10,
  },
  stepLabelActive: { color: Colors.teal },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.border,
    marginBottom: Spacing.lg,
    marginHorizontal: 4,
  },
  stepLineActive: { backgroundColor: Colors.teal },
  // error
  errorBox: {
    backgroundColor: Colors.dangerLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  errorText: { ...Typography.small, color: Colors.danger },
  // otp
  otpHint: {
    ...Typography.body,
    color: Colors.textMuted,
    marginBottom: Spacing.lg,
    textAlign: "center",
  },
  bold: { color: Colors.white, fontWeight: "700" },
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
