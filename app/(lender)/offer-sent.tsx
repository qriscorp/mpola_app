import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, BorderRadius } from "../../src/theme";
import { Button } from "../../src/components";

export default function OfferSentScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Success Icon */}
        <View style={styles.iconWrap}>
          <Ionicons name="checkmark-circle" size={80} color={Colors.gold} />
        </View>

        <Text style={styles.title}>Offer Sent!</Text>
        <Text style={styles.subtitle}>
          Your lending offer has been submitted. The borrower will review and
          respond shortly.
        </Text>

        {/* Reference */}
        <View style={styles.refCard}>
          <Text style={styles.refLabel}>Reference Number</Text>
          <Text style={styles.refValue}>
            LF-OFF-2025-04-{Math.floor(Math.random() * 9000 + 1000)}
          </Text>
        </View>

        <Text style={styles.note}>
          You will receive a notification when the borrower responds to your
          offer.
        </Text>

        <Button
          title="View Portfolio"
          onPress={() => router.replace("/(lender)/portfolio")}
          color={Colors.gold}
          style={{ marginTop: Spacing.xxl }}
        />

        <Button
          title="Browse More Borrowers"
          onPress={() => router.replace("/(lender)/browse")}
          color={Colors.white}
          style={{
            marginTop: Spacing.md,
            borderWidth: 1,
            borderColor: Colors.border,
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: Spacing.xxl,
  },
  iconWrap: {
    alignItems: "center",
    marginBottom: Spacing.xxl,
  },
  title: {
    ...Typography.h1,
    color: Colors.textPrimary,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  refCard: {
    backgroundColor: Colors.goldLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: "center",
    marginTop: Spacing.xxl,
  },
  refLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  refValue: {
    ...Typography.h3,
    color: Colors.goldDark,
    marginTop: Spacing.xs,
  },
  note: {
    ...Typography.small,
    color: Colors.textMuted,
    textAlign: "center",
    marginTop: Spacing.lg,
  },
});
