import React, { useEffect, useMemo, useRef, useState } from "react";
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
import { Colors, Spacing, BorderRadius, useScaledTypography } from "../src/theme";
import { Button } from "../src/components";
import {
  apiRefreshSignupDraft,
  apiSendSignupEmailOtp,
  apiVerifySignupEmailOtp,
  clearSignupDraft,
  getSignupDraftNextStep,
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
  const typography = useScaledTypography();
  const styles = useMemo(() => makeStyles(typography), [typography]);

  const [draft, setDraft] = useState<SignupDraftState | null>(null);
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const otpRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    const loadDraft = async () => {
      const existing = await apiRefreshSignupDraft();
      if (existing) {
        const nextStep = getSignupDraftNextStep(existing);
        if (nextStep === "verify-phone") {
          router.replace(`/verify-phone?portal=${existing.role}`);
          return;
        }
        if (nextStep === "completed") {
          router.replace("/sign-in");
          return;
        }
      }
      setDraft(existing);
    };
    void loadDraft();
  }, [router]);

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
      const response = await apiVerifySignupEmailOtp(draft.draftId, otp);
      if (response.account_created) {
        await clearSignupDraft();
        router.replace("/sign-in");
        return;
      }

      const latestDraft = await apiRefreshSignupDraft();
      if (!latestDraft) {
        router.replace(startOverRoute);
        return;
      }

      setDraft(latestDraft);
      const nextStep = getSignupDraftNextStep(latestDraft);
      if (nextStep === "verify-phone") {
        router.replace(`/verify-phone?portal=${latestDraft.role}`);
        return;
      }

      router.replace(`/verify-email?portal=${latestDraft.role}`);
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

function makeStyles(typography: ReturnType<typeof useScaledTypography>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    scroll: { flex: 1 },
    content: {
      paddingHorizontal: Spacing.xxl,
      paddingTop: Spacing.lg,
      paddingBottom: Spacing.section,
    },
    backBtn: { marginBottom: Spacing.lg },
    backText: { ...typography.bodyMedium },
    title: {
      ...typography.h2,
      color: Colors.textPrimary,
      marginBottom: Spacing.sm,
    },
    subtitle: {
      ...typography.body,
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
    errorText: { ...typography.small, color: Colors.dangerLight },
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
      ...typography.h3,
    },
    inlineBtn: {
      alignItems: "center",
      marginTop: Spacing.lg,
    },
    inlineBtnText: { ...typography.bodyMedium },
    mutedBtnText: { ...typography.bodyMedium, color: Colors.textMuted },
    emptyWrap: {
      flex: 1,
      paddingHorizontal: Spacing.xxl,
      justifyContent: "center",
      gap: Spacing.md,
    },
    emptyTitle: { ...typography.h3, color: Colors.textPrimary },
    emptyText: { ...typography.body, color: Colors.textSecondary },
  });
}
