import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Redirect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, Spacing, BorderRadius, useScaledTypography } from "../src/theme";
import { Logo } from "../src/components";
import { hasSeenOnboarding, subscribeToOnboardingState } from "../src/services/onboarding";

export default function WelcomeScreen() {
  const router = useRouter();
  const typography = useScaledTypography();
  const styles = useMemo(() => makeStyles(typography), [typography]);

  // Checked here (not just in _layout.tsx's AuthGate) so a first-ever
  // launch never actually paints this screen's real content before jumping
  // to onboarding — AuthGate's own redirect only fires in an effect AFTER
  // this component has already mounted and rendered once, which is exactly
  // what caused the one-frame "blink" of the welcome screen. A <Redirect>
  // resolves during render instead, before anything below it paints.
  const [onboardingSeen, setOnboardingSeen] = useState<boolean | null>(null);
  useEffect(() => {
    let active = true;
    hasSeenOnboarding()
      .then((seen) => {
        if (active) setOnboardingSeen(seen);
      })
      .catch(() => {
        if (active) setOnboardingSeen(true);
      });
    const unsubscribe = subscribeToOnboardingState((seen) => setOnboardingSeen(seen));
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  if (onboardingSeen === null) {
    return <View style={styles.container} />;
  }
  if (onboardingSeen === false) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoArea}>
          <Logo size={72} style={{ marginBottom: Spacing.lg }} />
          <Text style={styles.appName}>Mpola</Text>
          <Text style={styles.tagline}>Lend me, grow together</Text>
        </View>

        {/* Action buttons */}
        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: Colors.teal }]}
            onPress={() => router.push("/register-borrower")}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>I'm a Borrower</Text>
          </TouchableOpacity>

          <View style={{ height: Spacing.md }} />

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: Colors.gold }]}
            onPress={() => router.push("/register-lender")}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>I'm a Lender</Text>
          </TouchableOpacity>

          <View style={{ height: Spacing.xxxl }} />

          <TouchableOpacity
            style={styles.signInBtn}
            onPress={() => router.push("/sign-in")}
            activeOpacity={0.7}
          >
            <Text style={styles.signInText}>Already have an account?</Text>
            <Text style={[styles.signInText, styles.signInLink]}> Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

function makeStyles(typography: ReturnType<typeof useScaledTypography>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    content: {
      flex: 1,
      justifyContent: "center",
      paddingHorizontal: Spacing.xxl,
    },
    logoArea: { alignItems: "center", marginBottom: Spacing.section },
    appName: {
      fontSize: 36,
      fontWeight: "700",
      color: Colors.white,
      marginBottom: Spacing.xs,
    },
    tagline: { ...typography.body, color: Colors.textMuted },
    buttons: { width: "100%" },
    primaryBtn: {
      height: 54,
      borderRadius: BorderRadius.full,
      alignItems: "center",
      justifyContent: "center",
    },
    primaryBtnText: { ...typography.button, color: Colors.white },
    signInBtn: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
    },
    signInText: { ...typography.body, color: Colors.textSecondary },
    signInLink: { color: Colors.teal, fontWeight: "600" },
    footer: {
      ...typography.caption,
      color: Colors.textMuted,
      textAlign: "center",
      paddingBottom: Spacing.lg,
    },
  });
}
