import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, BorderRadius, useScaledTypography } from "../../src/theme";
import { Button, Card } from "../../src/components";
import { goToTabRoot } from "../../src/services";

const METHOD_LABEL: Record<string, string> = {
  wallet: "Mpola Wallet",
  momo: "MTN Mobile Money",
  airtel: "Airtel Money",
};

export default function PaymentFailedScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    reason?: string;
    amount?: string;
    paymentMethod?: string;
    loanId?: string;
  }>();

  const amount = Number(params.amount ?? 0);
  const typography = useScaledTypography();
  const styles = useMemo(() => makeStyles(typography), [typography]);

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => router.back()}
        accessibilityLabel="Go back"
        accessibilityRole="button"
      >
        <Ionicons name="arrow-back" size={24} color={Colors.white} />
      </TouchableOpacity>
      <View style={styles.content}>
        <View style={styles.xCircle}>
          <Text style={styles.x}>✕</Text>
        </View>
        <Text style={styles.title}>Payment Failed</Text>
        <Text style={styles.reason}>
          {params.reason ?? "Something went wrong. Please try again."}
        </Text>

        <Card style={styles.details}>
          <View style={styles.row}>
            <Text style={styles.label}>Attempted Amount</Text>
            <Text style={styles.value}>UGX {amount.toLocaleString()}</Text>
          </View>
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <Text style={styles.label}>Payment Method</Text>
            <Text style={styles.value}>
              {METHOD_LABEL[params.paymentMethod ?? ""] ??
                params.paymentMethod ??
                "—"}
            </Text>
          </View>
        </Card>

        <Text style={styles.note}>
          Nothing was charged — you can try again with the same or a different payment method.
        </Text>

        <Button
          title="Try Again"
          onPress={() =>
            router.replace({
              pathname: "/(borrower)/payment",
            })
          }
          color={Colors.teal}
        />
        <View style={{ height: Spacing.md }} />
        <Button
          title="Dashboard"
          variant="outline"
          onPress={() => goToTabRoot("/(borrower)/(tabs)/home")}
          color={Colors.teal}
        />
      </View>
    </SafeAreaView>
  );
}

function makeStyles(typography: ReturnType<typeof useScaledTypography>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    backBtn: { paddingHorizontal: Spacing.xxl, paddingTop: Spacing.md },
    content: {
      flex: 1,
      justifyContent: "center",
      paddingHorizontal: Spacing.xxl,
    },
    xCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: Colors.danger + "25",
      alignItems: "center",
      justifyContent: "center",
      alignSelf: "center",
      marginBottom: Spacing.lg,
    },
    x: { fontSize: 32, color: Colors.danger },
    title: {
      ...typography.h2,
      color: Colors.white,
      textAlign: "center",
      marginBottom: Spacing.xs,
    },
    reason: {
      ...typography.small,
      color: Colors.textMuted,
      textAlign: "center",
      marginBottom: Spacing.xxl,
    },
    details: { marginBottom: Spacing.lg },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
    label: { ...typography.body, color: Colors.textSecondary },
    value: { ...typography.bodyMedium, color: Colors.textPrimary },
    note: {
      ...typography.small,
      color: Colors.textMuted,
      textAlign: "center",
      marginBottom: Spacing.xxl,
    },
  });
}
