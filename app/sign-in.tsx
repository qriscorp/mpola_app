import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Colors, Typography, Spacing, BorderRadius } from "../src/theme";
import { Button, Input } from "../src/components";
import { useAuthViewModel } from "../src/viewmodels";

export default function SignInScreen() {
  const router = useRouter();
  const vm = useAuthViewModel();

  const handleSignIn = async () => {
    const success = await vm.login();
    if (success) {
      // Route based on user role
      const role = vm.authUser?.role;
      if (role === "lender") {
        router.replace("/(lender)/home");
      } else {
        router.replace("/(borrower)/home");
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={styles.logoArea}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>LF</Text>
          </View>
          <Text style={styles.appName}>Welend</Text>
          <Text style={styles.tagline}>Sign in to your account</Text>
        </View>

        {/* Form */}
        <Input
          label="Email or Phone"
          value={vm.email}
          onChangeText={vm.setEmail}
          placeholder="you@email.com or 772XXXXXX"
          keyboardType="email-address"
          error={vm.errors.email}
        />

        <Input
          label="Password"
          value={vm.password}
          onChangeText={vm.setPassword}
          placeholder="Enter your password"
          secureTextEntry
          error={vm.errors.password}
        />

        <View style={{ height: Spacing.lg }} />

        <Button
          title={vm.loading ? "Signing in…" : "Sign In"}
          onPress={handleSignIn}
          color={Colors.teal}
          disabled={vm.loading || !vm.email || !vm.password}
        />

        <View style={{ height: Spacing.xl }} />

        {/* Forgot password */}
        <TouchableOpacity
          style={styles.linkBtn}
          onPress={() => router.push("/forgot-password")}
        >
          <Text style={styles.linkText}>Forgot password?</Text>
        </TouchableOpacity>

        <View style={{ height: Spacing.md }} />

        {/* Phone OTP sign in */}
        <TouchableOpacity
          style={[styles.linkBtn, styles.otpBtn]}
          onPress={() => router.push("/phone-otp-signin")}
        >
          <Text style={styles.otpText}>Sign in with Phone OTP</Text>
        </TouchableOpacity>

        <View style={{ height: Spacing.xl }} />

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>Back to Welcome</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.navy,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.section,
    paddingBottom: Spacing.section,
  },
  logoArea: {
    alignItems: "center",
    marginBottom: Spacing.section,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.teal,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  logoText: {
    ...Typography.h2,
    color: Colors.white,
  },
  appName: {
    ...Typography.h2,
    color: Colors.white,
    marginBottom: Spacing.xs,
  },
  tagline: {
    ...Typography.body,
    color: Colors.textMuted,
  },
  backText: {
    ...Typography.body,
    color: Colors.teal,
    textAlign: "center",
  },
  linkBtn: {
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  linkText: {
    ...Typography.body,
    color: Colors.teal,
    textDecorationLine: "underline",
  },
  otpBtn: {
    borderWidth: 1,
    borderColor: Colors.teal,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  otpText: {
    ...Typography.body,
    color: Colors.teal,
    fontWeight: "600",
  },
});
