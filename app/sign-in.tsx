import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors, Spacing, BorderRadius, useScaledTypography } from "../src/theme";
import { Button, Input, PhoneInput } from "../src/components";
import { useAuthViewModel } from "../src/viewmodels";
import { isBiometricSupported, isBiometricLoginEnabled, tryBiometricSignIn } from "../src/services/biometrics";

export default function SignInScreen() {
  const router = useRouter();
  const vm = useAuthViewModel();
  const [biometricReady, setBiometricReady] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState(["", "", "", "", "", ""]);
  const twoFactorRefs = useRef<(TextInput | null)[]>([]);
  const typography = useScaledTypography();
  const styles = useMemo(() => makeStyles(typography), [typography]);

  useEffect(() => {
    (async () => {
      const [supported, enabled] = await Promise.all([
        isBiometricSupported(),
        isBiometricLoginEnabled(),
      ]);
      setBiometricReady(supported && enabled);
    })();
  }, []);

  const routeForRole = (role: string | undefined) => {
    if (role === "lender") {
      router.replace("/(lender)/home");
    } else {
      router.replace("/(borrower)/home");
    }
  };

  const handleSignIn = async () => {
    const user = await vm.login();
    // If this account has 2FA enabled, vm.twoFactorUsername is now set and
    // the code-entry step below renders instead of navigating away.
    if (user) {
      routeForRole(user.role);
    }
  };

  const handleTwoFactorDigit = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...twoFactorCode];
    next[index] = digit;
    setTwoFactorCode(next);
    if (digit && index < 5) {
      twoFactorRefs.current[index + 1]?.focus();
    }
  };

  const handleTwoFactorKeyPress = (index: number, key: string) => {
    if (key === "Backspace" && !twoFactorCode[index] && index > 0) {
      twoFactorRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyTwoFactor = async () => {
    const user = await vm.verifyTwoFactor(twoFactorCode.join(""));
    if (user) {
      routeForRole(user.role);
    }
  };

  const handleBiometricSignIn = async () => {
    setBiometricLoading(true);
    try {
      const user = await tryBiometricSignIn();
      if (user) {
        routeForRole(user.role);
      } else {
        Alert.alert(
          "Biometric sign-in unavailable",
          "Please sign in with your password to continue.",
        );
      }
    } finally {
      setBiometricLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Text style={styles.logoLetter}>M</Text>
          </View>
          <Text style={styles.appName}>Mpola</Text>
        </View>

        {vm.twoFactorUsername ? (
          <>
            {/* Title */}
            <Text style={styles.title}>Two-Factor Verification</Text>
            <Text style={styles.subtitle}>
              Enter the 6-digit code we just texted to your phone to finish
              signing in.
            </Text>

            {!!vm.errors.code && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{vm.errors.code}</Text>
              </View>
            )}

            <View style={{ height: Spacing.lg }} />

            <View style={styles.otpRow}>
              {twoFactorCode.map((digit, i) => (
                <TextInput
                  key={i}
                  ref={(el) => {
                    twoFactorRefs.current[i] = el;
                  }}
                  style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
                  value={digit}
                  onChangeText={(v) => handleTwoFactorDigit(i, v)}
                  onKeyPress={({ nativeEvent }) =>
                    handleTwoFactorKeyPress(i, nativeEvent.key)
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
              title={vm.loading ? "Verifying…" : "Verify & Sign In"}
              onPress={handleVerifyTwoFactor}
              color={Colors.teal}
              disabled={vm.loading || twoFactorCode.join("").length < 6}
            />
          </>
        ) : (
          <>
        {/* Title */}
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to your account</Text>

        <View style={{ height: Spacing.xxxl }} />

        {/* Phone Number */}
        <PhoneInput
          label="PHONE NUMBER"
          value={vm.email}
          onChangeText={vm.setEmail}
          error={vm.errors.email}
        />

        <View style={{ height: Spacing.lg }} />

        {/* Password */}
        <Input
          label="PASSWORD"
          value={vm.password}
          onChangeText={vm.setPassword}
          placeholder="Enter your password"
          secureTextEntry
          error={vm.errors.password}
        />

        {/* Forgot Password */}
        <TouchableOpacity
          style={styles.forgotBtn}
          onPress={() => router.push("/forgot-password")}
        >
          <Text style={styles.forgotText}>Forgot password?</Text>
        </TouchableOpacity>

        <View style={{ height: Spacing.lg }} />

        <Button
          title={vm.loading ? "Signing in…" : "Sign In"}
          onPress={handleSignIn}
          color={Colors.teal}
          disabled={vm.loading || !vm.email || !vm.password}
        />

        <View style={{ height: Spacing.xxl }} />

        {/* Register link — goes to the Welcome screen's borrower/lender
            choice, not straight to one role's form, since sign-in has no
            way to know which the person actually wants. */}
        <TouchableOpacity
          style={styles.registerRow}
          onPress={() => router.push("/")}
        >
          <Text style={styles.registerText}>No account? </Text>
          <Text style={[styles.registerText, styles.registerLink]}>
            Register
          </Text>
        </TouchableOpacity>

        <View style={{ height: Spacing.xl }} />

        {biometricReady && (
          <>
            <View style={{ height: Spacing.md }} />
            <TouchableOpacity
              style={[styles.otpBtn, styles.biometricBtn]}
              onPress={handleBiometricSignIn}
              disabled={biometricLoading}
            >
              <Ionicons
                name="finger-print-outline"
                size={18}
                color={Colors.textSecondary}
                style={{ marginRight: Spacing.xs }}
              />
              <Text style={styles.otpText}>
                {biometricLoading ? "Verifying…" : "Sign in with Face ID / Fingerprint"}
              </Text>
            </TouchableOpacity>
          </>
        )}
          </>
        )}
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
      paddingTop: Spacing.xl,
      paddingBottom: Spacing.section,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: Spacing.section,
    },
    logoBox: {
      width: 36,
      height: 36,
      borderRadius: 9,
      backgroundColor: Colors.teal,
      alignItems: "center",
      justifyContent: "center",
      marginRight: Spacing.sm,
    },
    logoLetter: { fontSize: 18, fontWeight: "700", color: Colors.white },
    appName: { ...typography.h3, color: Colors.white },
    title: {
      fontSize: 28,
      fontWeight: "700",
      color: Colors.white,
      marginBottom: Spacing.xs,
    },
    subtitle: { ...typography.body, color: Colors.textSecondary },
    errorBox: {
      backgroundColor: Colors.dangerBg,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      marginTop: Spacing.md,
    },
    errorText: { ...typography.small, color: Colors.danger },
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
      backgroundColor: Colors.surfaceLift,
      color: Colors.white,
      fontSize: 24,
      fontWeight: "700",
    },
    otpBoxFilled: { borderColor: Colors.teal },
    forgotBtn: { alignItems: "flex-end", marginTop: -Spacing.sm },
    forgotText: { ...typography.bodyMedium, color: Colors.teal },
    registerRow: { flexDirection: "row", justifyContent: "center" },
    registerText: { ...typography.body, color: Colors.textSecondary },
    registerLink: { color: Colors.teal, fontWeight: "600" },
    otpBtn: {
      borderWidth: 1,
      borderColor: Colors.border,
      borderRadius: BorderRadius.full,
      paddingVertical: Spacing.md,
      alignItems: "center",
    },
    otpText: { ...typography.bodyMedium, color: Colors.textSecondary },
    biometricBtn: { flexDirection: "row", justifyContent: "center" },
  });
}
