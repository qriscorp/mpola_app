import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, BorderRadius } from "../../src/theme";

export default function OfferSentScreen() {
  const router = useRouter();
  const { offerId } = useLocalSearchParams<{ offerId: string }>();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="checkmark" size={40} color={Colors.gold} />
        </View>
        <Text style={styles.title}>Offer Sent!</Text>
        <Text style={styles.subtitle}>
          Your lending offer has been submitted. The borrower will review and
          respond shortly.
        </Text>

        <View style={styles.refCard}>
          <Text style={styles.refLabel}>Reference Number</Text>
          <Text style={styles.refValue}>
            {offerId ? `#${offerId.slice(0, 10).toUpperCase()}` : "—"}
          </Text>
        </View>

        <Text style={styles.note}>
          You will receive a notification when the borrower responds to your
          offer.
        </Text>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.replace("/(lender)/portfolio")}
        >
          <Text style={styles.primaryBtnText}>View Portfolio</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.outlineBtn}
          onPress={() => router.replace("/(lender)/browse")}
        >
          <Text style={styles.outlineBtnText}>Browse More Borrowers</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, justifyContent: "center", padding: Spacing.xxl },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.gold + "25",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.h1,
    color: Colors.white,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: Spacing.xxl,
  },
  refCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: "center",
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.gold + "40",
  },
  refLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  refValue: { ...Typography.h3, color: Colors.gold, marginTop: Spacing.xs },
  note: {
    ...Typography.small,
    color: Colors.textMuted,
    textAlign: "center",
    marginBottom: Spacing.xxl,
  },
  primaryBtn: {
    backgroundColor: Colors.gold,
    borderRadius: BorderRadius.full,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  primaryBtnText: { ...Typography.button, color: Colors.white },
  outlineBtn: {
    borderRadius: BorderRadius.full,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  outlineBtnText: { ...Typography.button, color: Colors.textSecondary },
});
