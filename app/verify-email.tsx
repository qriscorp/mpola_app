import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Colors, Typography, Spacing, BorderRadius } from "../src/theme";
import { Button } from "../src/components";
import {
  apiSendSignupEmailOtp,
  apiVerifySignupEmailOtp,
  clearSignupDraft,
  getSignupDraft,
  type SignupDraftState,
} from "../src/services/auth";

function toPortal(value: string | string[] | undefined): "borrower" | "lender" {
  if (Array.isArray(value))
    return value[0] === "lender" ? "lender" : "borrower";
  return value === "lender" ? "lender" : "borrower";
}

export default function VerifyEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ portal?: string }>();
  const portal = toPortal(params.portal);
  const accent = portal === "lender" ? Colors.gold : Colors.teal;

  const [draft, setDraft] = useState<SignupDraftState | null>(null);
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const otpRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    const loadDraft = async () => {
      const existing = await getSignupDraft();
      setDraft(existing);
    };
    void loadDraft();
  }, []);

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...code];
    next[index] = digit;
    setCode(next);
    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (index: number, key: string) => {
    if (key === "Backspace" && !code[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = async () => {
    if (!draft) return;
    setError("");
    setResending(true);
    try {
      await apiSendSignupEmailOtp(draft.draftId);
    } catch (e: any) {
      setError(e?.message || "Failed to send email code");
    } finally {
      setResending(false);
    }
  };

  const handleVerify = async () => {
    if (!draft) return;
    const otp = code.join("");
    if (otp.length < 6) {
      setError("Enter the full 6-digit code");
      return;
    }

    setError("");
    setLoading(true);
    try {
      await apiVerifySignupEmailOtp(draft.draftId, otp);
      setDraft({ ...draft, emailVerified: true });
      router.replace(`/verify-phone?portal=${draft.role}`);
    } catch (e: any) {
      setError(e?.message || "Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const startOverRoute =
    portal === "lender" ? "/(lender)/register" : "/(borrower)/register";

  if (!draft) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>No signup draft found</Text>
          <Text style={styles.emptyText}>
            Start registration first, then verify your email.
          </Text>
          <Button
            title="Go to Register"
            onPress={() => router.replace(startOverRoute)}
            color={accent}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: accent }]}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Verify your email</Text>
        <Text style={styles.subtitle}>
          We sent a 6-digit code to {draft.email}. Enter it below to continue
          signup.
        </Text>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.otpRow}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={(el) => {
                otpRefs.current[index] = el;
              }}
              value={digit}
              onChangeText={(value) => handleOtpChange(index, value)}
              onKeyPress={({ nativeEvent }) =>
                handleOtpKeyPress(index, nativeEvent.key)
              }
              keyboardType="number-pad"
              maxLength={1}
              style={styles.otpInput}
              textAlign="center"
              selectTextOnFocus
            />
          ))}
        </View>

        <Button
          title={loading ? "Verifying..." : "Verify Email"}
          onPress={handleVerify}
          color={accent}
          loading={loading}
          disabled={loading || code.join("").length < 6}
        />

        <TouchableOpacity
          style={styles.inlineBtn}
          onPress={handleResend}
          disabled={resending}
        >
          <Text style={[styles.inlineBtnText, { color: accent }]}>
            {resending ? "Sending new code..." : "Resend code"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.inlineBtn}
          onPress={async () => {
            await clearSignupDraft();
            router.replace(startOverRoute);
          }}
        >
          <Text style={styles.mutedBtnText}>Start over</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.section,
  },
  backBtn: { marginBottom: Spacing.lg },
  backText: { ...Typography.bodyMedium },
  title: {
    ...Typography.h2,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
  },
  errorBox: {
    borderWidth: 1,
    borderColor: Colors.danger,
    backgroundColor: Colors.dangerBg,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  errorText: { ...Typography.small, color: Colors.dangerLight },
  otpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  otpInput: {
    flex: 1,
    minHeight: 54,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceLift,
    color: Colors.textPrimary,
    ...Typography.h3,
  },
  inlineBtn: {
    alignItems: "center",
    marginTop: Spacing.lg,
  },
  inlineBtnText: { ...Typography.bodyMedium },
  mutedBtnText: { ...Typography.bodyMedium, color: Colors.textMuted },
  emptyWrap: {
    flex: 1,
    paddingHorizontal: Spacing.xxl,
    justifyContent: "center",
    gap: Spacing.md,
  },
  emptyTitle: { ...Typography.h3, color: Colors.textPrimary },
  emptyText: { ...Typography.body, color: Colors.textSecondary },
});
