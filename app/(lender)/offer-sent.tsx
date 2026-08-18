import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, BorderRadius, useScaledTypography } from "../../src/theme";

export default function OfferSentScreen() {
  const router = useRouter();
  const typography = useScaledTypography();
  const styles = useMemo(() => makeStyles(typography), [typography]);
  const { offerId } = useLocalSearchParams<{ offerId: string }>();

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => router.replace("/(lender)/home")}
        accessibilityLabel="Go back"
        accessibilityRole="button"
      >
        <Ionicons name="arrow-back" size={24} color={Colors.white} />
      </TouchableOpacity>
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

function makeStyles(typography: ReturnType<typeof useScaledTypography>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    backBtn: { paddingHorizontal: Spacing.xxl, paddingTop: Spacing.md },
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
      ...typography.h1,
      color: Colors.white,
      textAlign: "center",
      marginBottom: Spacing.sm,
    },
    subtitle: {
      ...typography.body,
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
      ...typography.caption,
      color: Colors.textMuted,
      letterSpacing: 1,
    },
    refValue: { ...typography.h3, color: Colors.gold, marginTop: Spacing.xs },
    note: {
      ...typography.small,
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
    primaryBtnText: { ...typography.button, color: Colors.white },
    outlineBtn: {
      borderRadius: BorderRadius.full,
      paddingVertical: 16,
      alignItems: "center",
      borderWidth: 1,
      borderColor: Colors.border,
    },
    outlineBtnText: { ...typography.button, color: Colors.textSecondary },
  });
}
