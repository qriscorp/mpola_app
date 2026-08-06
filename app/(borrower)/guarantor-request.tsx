import React from "react";
import { View, Text, StyleSheet, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Colors, Typography, Spacing, BorderRadius } from "../../src/theme";
import { Button, Card, SkeletonHero, SkeletonCard } from "../../src/components";
import { Ionicons } from "@expo/vector-icons";
import { fetchGuarantorInvite, respondToGuarantorInvite } from "../../src/services";

export default function GuarantorRequestScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ["guarantor-invite", token],
    queryFn: () => fetchGuarantorInvite(token as string),
    enabled: !!token,
  });

  const respond = useMutation({
    mutationFn: (status: "accepted" | "declined") =>
      respondToGuarantorInvite(token as string, status),
    onSuccess: (_res, status) => {
      Alert.alert(
        status === "accepted" ? "You're now a guarantor" : "Request declined",
        status === "accepted"
          ? "Thank you for confirming."
          : "You've declined this guarantor request.",
        [{ text: "OK", onPress: () => router.back() }],
      );
    },
    onError: (err: Error) => Alert.alert("Error", err.message),
  });

  if (!token) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.sub}>No guarantor invite found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.lg }}>
          <SkeletonHero height={110} />
          <SkeletonCard height={140} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (error || !data) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.sub}>
            This invite is invalid or has already been responded to.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const alreadyResponded = data.guarantor.status !== "pending";
  const monthlyEstimate =
    data.application.amount && data.application.duration
      ? Math.round(data.application.amount / data.application.duration)
      : null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <Text style={styles.emoji}>🤝</Text>
          <Text style={styles.title}>Guarantor Request</Text>
          <Text style={styles.sub}>You&apos;ve been asked to guarantee a loan</Text>
        </View>

        <Card style={styles.loanCard}>
          <View style={styles.row}>
            <Text style={styles.label}>Borrower</Text>
            <Text style={styles.value}>
              {data.application.borrowerName ?? "Unknown"}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Amount</Text>
            <Text style={styles.value}>
              UGX {(data.application.amount ?? 0).toLocaleString()}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Duration</Text>
            <Text style={styles.value}>
              {data.application.duration ?? "—"} months
            </Text>
          </View>
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <Text style={styles.label}>Est. Monthly Payment</Text>
            <Text style={styles.value}>
              {monthlyEstimate ? `~UGX ${monthlyEstimate.toLocaleString()}` : "—"}
            </Text>
          </View>
        </Card>

        {alreadyResponded ? (
          <Card style={styles.warningBox}>
            <Ionicons name="checkmark-circle-outline" size={18} color={Colors.teal} />
            <Text style={styles.warningText}>
              You already {data.guarantor.status} this request.
            </Text>
          </Card>
        ) : (
          <>
            <Card style={styles.warningBox}>
              <Ionicons name="warning-outline" size={18} color={Colors.warning} />
              <Text style={styles.warningText}>
                By accepting, you agree to be responsible for repayment if the
                borrower defaults.
              </Text>
            </Card>

            <Button
              title="✓ Accept as Guarantor"
              onPress={() => respond.mutate("accepted")}
              color={Colors.teal}
              disabled={respond.isPending}
            />
            <View style={{ height: Spacing.md }} />
            <Button
              title="Decline"
              onPress={() => respond.mutate("declined")}
              variant="outline"
              color={Colors.danger}
              disabled={respond.isPending}
            />
          </>
        )}

        <Text style={styles.support}>Questions? Contact Support</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.xxl, paddingBottom: 40 },
  hero: { alignItems: "center", marginBottom: Spacing.xxl },
  emoji: { fontSize: 48, marginBottom: Spacing.md },
  title: { ...Typography.h2, color: Colors.white },
  sub: { ...Typography.body, color: Colors.textSecondary, marginTop: 4 },
  loanCard: { marginBottom: Spacing.lg },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  label: { ...Typography.body, color: Colors.textSecondary },
  value: { ...Typography.bodyMedium, color: Colors.textPrimary },
  warningBox: {
    flexDirection: "row",
    gap: Spacing.sm,
    alignItems: "flex-start",
    backgroundColor: Colors.warningBg,
    marginBottom: Spacing.xxl,
  },
  warningText: { ...Typography.small, color: Colors.textPrimary, flex: 1 },
  support: {
    ...Typography.body,
    color: Colors.teal,
    textAlign: "center",
    marginTop: Spacing.xxl,
  },
});
