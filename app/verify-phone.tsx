import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { BorderRadius, Colors, Spacing, useScaledTypography } from "../src/theme";
import { Button, PhoneInput } from "../src/components";
import { showAlert } from "../src/services/alerts";
import {
  apiRefreshSignupDraft,
  apiSendSignupPhoneOtp,
  apiVerifySignupPhoneOtp,
  clearSignupDraft,
  enterAuthenticatedApp,
  getSignupDraftNextStep,
  type SignupDraftState,
} from "../src/services/auth";

function toPortal(value: string | string[] | undefined): "borrower" | "lender" {
  if (Array.isArray(value))
    return value[0] === "lender" ? "lender" : "borrower";
  return value === "lender" ? "lender" : "borrower";
}

function withoutCountryCode(phone: string): string {
  return phone.startsWith("256") ? phone.slice(3) : phone;
}

export default function VerifyPhoneScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ portal?: string }>();
  const portal = toPortal(params.portal);
  const accent = portal === "lender" ? Colors.gold : Colors.teal;
  const typography = useScaledTypography();
  const styles = useMemo(() => makeStyles(typography), [typography]);

  const [draft, setDraft] = useState<SignupDraftState | null>(null);
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const otpRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    const loadDraft = async () => {
      const existing = await apiRefreshSignupDraft();
      if (existing) {
        const nextStep = getSignupDraftNextStep(existing);
        if (nextStep === "verify-email") {
          router.replace(`/verify-email?portal=${existing.role}`);
          return;
        }
        if (nextStep === "completed") {
          router.replace("/sign-in");
          return;
        }
      }
      setDraft(existing);
      if (existing?.phoneNumber) {
        setPhone(withoutCountryCode(existing.phoneNumber));
      }
      // register_start already dispatched a code (email attempt failed, so
      // it fell back to SMS) whenever the draft's next step is verify-phone
      // — skip straight to code entry instead of a redundant manual send
      // that would silently invalidate the code already texted.
      setOtpSent(true);
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

  const handleSendCode = async () => {
    if (!draft) return;
    if (!phone.trim()) {
      setError("Enter your phone number first.");
      return;
    }

    setError("");
    setSending(true);
    try {
      await apiSendSignupPhoneOtp(draft.draftId, phone.trim());
      setOtpSent(true);
      setCode(["", "", "", "", "", ""]);
    } catch (e: any) {
      setError(e?.message || "Failed to send phone OTP.");
    } finally {
      setSending(false);
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
      const response = await apiVerifySignupPhoneOtp(
        draft.draftId,
        phone.trim(),
        otp,
      );
      if (response.account_created) {
        if (response.user) {
          // This is a login as far as navigation is concerned — reset the
          // whole auth stack so the signup/verify screens can't be revealed
          // by a back gesture from the home screen.
          enterAuthenticatedApp(response.user);
        } else {
          // Tokens weren't issued for some reason — fall back to asking
          // the user to sign in manually rather than leaving them stuck.
          showAlert("Account ready", "Signup complete. Please sign in.", [
            {
              text: "Sign In",
              onPress: () => router.replace("/sign-in"),
            },
          ]);
        }
        return;
      }

      const latestDraft = await apiRefreshSignupDraft();
      if (!latestDraft) {
        router.replace(startOverRoute);
        return;
      }

      setDraft(latestDraft);
      const nextStep = getSignupDraftNextStep(latestDraft);
      if (nextStep === "verify-email") {
        router.replace(`/verify-email?portal=${latestDraft.role}`);
        return;
      }

      showAlert("Phone verified", response.message);
    } catch (e: any) {
      setError(e?.message || "Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const startOverRoute =
    portal === "lender" ? "/register-lender" : "/register-borrower";

  if (!draft) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>No signup draft found</Text>
          <Text style={styles.emptyText}>
            Start registration first, then continue phone verification.
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

        <Text style={styles.title}>Verify your phone</Text>
        <Text style={styles.subtitle}>
          {otpSent
            ? `We sent a verification code via SMS to +256${phone}. Enter it below to finish signup.`
            : "Enter your phone number, request a code, then verify to finish signup."}
        </Text>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <PhoneInput
          label="Phone Number"
          value={phone}
          onChangeText={setPhone}
          editable={!otpSent}
        />

        <Button
          title={sending ? "Sending code..." : otpSent ? "Resend Code" : "Send Code"}
          onPress={handleSendCode}
          color={accent}
          loading={sending}
          disabled={sending || !phone}
        />

        {otpSent && (
          <>
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
              title={loading ? "Verifying..." : "Verify Phone"}
              onPress={handleVerify}
              color={accent}
              loading={loading}
              disabled={loading || code.join("").length < 6}
            />
          </>
        )}

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
      marginTop: Spacing.xl,
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
