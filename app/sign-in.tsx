import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors, Typography, Spacing, BorderRadius } from "../src/theme";
import { Button, Input } from "../src/components";
import { useAuthViewModel } from "../src/viewmodels";
import { isBiometricSupported, isBiometricLoginEnabled, tryBiometricSignIn } from "../src/services/biometrics";

export default function SignInScreen() {
  const router = useRouter();
  const vm = useAuthViewModel();
  const [biometricReady, setBiometricReady] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);

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
    const success = await vm.login();
    if (success) {
      routeForRole(vm.authUser?.role);
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

        {/* Title */}
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to your account</Text>

        <View style={{ height: Spacing.xxxl }} />

        {/* Phone Number */}
        <Text style={styles.fieldLabel}>PHONE NUMBER</Text>
        <View style={styles.phoneRow}>
          <View style={styles.countryCode}>
            <Text style={styles.countryCodeText}>+256</Text>
          </View>
          <View style={[styles.phoneInput, { flex: 1 }]}>
            <Input
              value={vm.email}
              onChangeText={vm.setEmail}
              placeholder="700 000 000"
              keyboardType="phone-pad"
              error={vm.errors.email}
              style={{ marginBottom: 0 }}
            />
          </View>
        </View>

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

        {/* Register link */}
        <TouchableOpacity
          style={styles.registerRow}
          onPress={() => router.push("/(borrower)/register")}
        >
          <Text style={styles.registerText}>No account? </Text>
          <Text style={[styles.registerText, styles.registerLink]}>
            Register
          </Text>
        </TouchableOpacity>

        <View style={{ height: Spacing.xl }} />

        {/* OTP sign in */}
        <TouchableOpacity
          style={styles.otpBtn}
          onPress={() => router.push("/phone-otp-signin")}
        >
          <Text style={styles.otpText}>Sign in with Phone OTP</Text>
        </TouchableOpacity>

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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  appName: { ...Typography.h3, color: Colors.white },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.white,
    marginBottom: Spacing.xs,
  },
  subtitle: { ...Typography.body, color: Colors.textSecondary },
  fieldLabel: {
    ...Typography.small,
    color: Colors.textMuted,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: Spacing.xs,
  },
  phoneRow: { flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.lg },
  countryCode: {
    backgroundColor: Colors.surfaceLift,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    justifyContent: "center",
    minHeight: 50,
  },
  countryCodeText: { ...Typography.bodyMedium, color: Colors.teal },
  phoneInput: {},
  forgotBtn: { alignItems: "flex-end", marginTop: -Spacing.sm },
  forgotText: { ...Typography.bodyMedium, color: Colors.teal },
  registerRow: { flexDirection: "row", justifyContent: "center" },
  registerText: { ...Typography.body, color: Colors.textSecondary },
  registerLink: { color: Colors.teal, fontWeight: "600" },
  otpBtn: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    alignItems: "center",
  },
  otpText: { ...Typography.bodyMedium, color: Colors.textSecondary },
  biometricBtn: { flexDirection: "row", justifyContent: "center" },
});
