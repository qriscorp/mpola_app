import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, BorderRadius, useScaledTypography } from "../../src/theme";
import { goToTabRoot } from "../../src/services";
import { formatDuration } from "../../src/services/duration";

/** Success screen after posting a new standing offer template — distinct
 * from offer-sent.tsx, which is for a manual one-off offer on a specific
 * borrower's application. A freshly-created template isn't live yet (it
 * sits as pending_review until an admin approves it, see
 * create_offer_template in routers/loans.py), so this deliberately says
 * "submitted for review," not "live on the marketplace" like the original
 * design mockup assumed. */
export default function OfferPostedScreen() {
  const router = useRouter();
  const typography = useScaledTypography();
  const styles = useMemo(() => makeStyles(typography), [typography]);
  const { templateId, minAmount, maxAmount, interestRate, duration, durationDays } =
    useLocalSearchParams<{
      templateId: string;
      minAmount: string;
      maxAmount: string;
      interestRate: string;
      duration?: string;
      durationDays?: string;
    }>();

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => goToTabRoot("/(lender)/(tabs)/home")}
        accessibilityLabel="Go back"
        accessibilityRole="button"
      >
        <Ionicons name="arrow-back" size={24} color={Colors.white} />
      </TouchableOpacity>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="checkmark" size={40} color={Colors.gold} />
        </View>
        <Text style={styles.title}>Offer Posted!</Text>
        <Text style={styles.subtitle}>
          Submitted for review — it'll go live on the marketplace once approved.
        </Text>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Offer ID</Text>
            <Text style={styles.summaryValue}>
              {templateId ? `#${templateId.slice(0, 10).toUpperCase()}` : "—"}
            </Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryRowBorder]}>
            <Text style={styles.summaryLabel}>Amount Range</Text>
            <Text style={styles.summaryValue}>
              UGX {Number(minAmount ?? 0).toLocaleString()} – {Number(maxAmount ?? 0).toLocaleString()}
            </Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryRowBorder]}>
            <Text style={styles.summaryLabel}>Rate</Text>
            <Text style={[styles.summaryValue, { color: Colors.gold }]}>{interestRate}%/month</Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryRowBorder]}>
            <Text style={styles.summaryLabel}>Duration</Text>
            <Text style={styles.summaryValue}>
              Max {formatDuration(duration ? Number(duration) : null, durationDays ? Number(durationDays) : null)}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => goToTabRoot("/(lender)/my-offers")}
        >
          <Text style={styles.primaryBtnText}>View My Offers</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.outlineBtn}
          onPress={() => router.replace("/(lender)/post-offer")}
        >
          <Text style={styles.outlineBtnText}>Post Another</Text>
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
    title: { ...typography.h1, color: Colors.white, textAlign: "center", marginBottom: Spacing.sm },
    subtitle: {
      ...typography.body,
      color: Colors.textSecondary,
      textAlign: "center",
      lineHeight: 22,
      marginBottom: Spacing.xxl,
    },
    summaryCard: {
      backgroundColor: Colors.surface,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.xxl,
    },
    summaryRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: Spacing.sm },
    summaryRowBorder: { borderTopWidth: 1, borderTopColor: Colors.border },
    summaryLabel: { ...typography.small, color: Colors.textMuted },
    summaryValue: { ...typography.smallMedium, color: Colors.white, fontWeight: "600" },
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
