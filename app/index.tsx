import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, Typography, Spacing, BorderRadius } from "../src/theme";
import { Button } from "../src/components";

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo Area */}
        <View style={styles.logoArea}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>LF</Text>
          </View>
          <Text style={styles.appName}>Welend</Text>
          <Text style={styles.tagline}>Fair credit, made simple</Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttons}>
          <Button
            title="I'm a Borrower"
            onPress={() => router.push("/(borrower)/register")}
            color={Colors.teal}
          />
          <View style={{ height: Spacing.md }} />
          <Button
            title="I'm a Lender"
            onPress={() => router.push("/(lender)/register")}
            color={Colors.gold}
          />
          <View style={{ height: Spacing.xxl }} />
          <Text style={styles.signInText}>Already have an account?</Text>
          <View style={{ height: Spacing.sm }} />
          <Button
            title="Sign In"
            onPress={() => router.push("/sign-in")}
            variant="outline"
            color={Colors.teal}
          />
        </View>
      </View>

      <Text style={styles.footer}>Regulated by Bank of Uganda</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.navy,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing.xxl,
  },
  logoArea: {
    alignItems: "center",
    marginBottom: Spacing.section,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.teal,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  logoText: {
    ...Typography.h1,
    color: Colors.white,
  },
  appName: {
    ...Typography.h1,
    color: Colors.white,
    fontSize: 32,
    marginBottom: Spacing.xs,
  },
  tagline: {
    ...Typography.body,
    color: Colors.textMuted,
  },
  buttons: {
    width: "100%",
  },
  signInText: {
    ...Typography.body,
    color: Colors.textMuted,
    textAlign: "center",
  },
  footer: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: "center",
    paddingBottom: Spacing.lg,
  },
});
