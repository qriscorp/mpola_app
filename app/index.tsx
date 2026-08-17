import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, Spacing, BorderRadius, useScaledTypography } from "../src/theme";

export default function WelcomeScreen() {
  const router = useRouter();
  const typography = useScaledTypography();
  const styles = useMemo(() => makeStyles(typography), [typography]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoArea}>
          <View style={styles.logoBox}>
            <Text style={styles.logoLetter}>M</Text>
          </View>
          <Text style={styles.appName}>Mpola</Text>
          <Text style={styles.tagline}>Lend me, grow together</Text>
        </View>

        {/* Action buttons */}
        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: Colors.teal }]}
            onPress={() => router.push("/(borrower)/register")}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>I'm a Borrower</Text>
          </TouchableOpacity>

          <View style={{ height: Spacing.md }} />

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: Colors.gold }]}
            onPress={() => router.push("/(lender)/register")}
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

      <Text style={styles.footer}>Regulated by Bank of Uganda</Text>
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
    logoBox: {
      width: 72,
      height: 72,
      borderRadius: 18,
      backgroundColor: Colors.teal,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: Spacing.lg,
    },
    logoLetter: { fontSize: 36, fontWeight: "700", color: Colors.white },
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
