import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadow,
} from "../../src/theme";
import { Card, StatCard, ProgressBar } from "../../src/components";
import { useBorrowerDashboardViewModel } from "../../src/viewmodels";

export default function BorrowerHomeScreen() {
  const router = useRouter();
  const { user, stats, loan, paymentProgress, remainingPayments, isLoading } =
    useBorrowerDashboardViewModel();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Greeting */}
        <View style={styles.greetingRow}>
          <View>
            <Text style={styles.greeting}>Welcome back</Text>
            <Text style={styles.name}>
              {user.firstName} {user.lastName}
            </Text>
          </View>
          <TouchableOpacity style={styles.bellBtn}>
            <Ionicons
              name="notifications-outline"
              size={22}
              color={Colors.textPrimary}
            />
          </TouchableOpacity>
        </View>

        {/* Active Loan Card */}
        <Card style={styles.loanCard}>
          <View style={styles.loanHeader}>
            <Text style={styles.loanLabel}>Active Loan</Text>
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>Active</Text>
            </View>
          </View>
          <Text style={styles.loanAmount}>
            UGX {loan?.amount.toLocaleString()}
          </Text>

          <View style={styles.loanDetailRow}>
            <Text style={styles.loanDetailLabel}>
              Next Payment — {loan?.nextPaymentDate?.split("-").pop()} May 1
            </Text>
            <Text style={styles.loanDetailValue}>
              UGX {(loan?.nextPaymentAmount ?? 0).toLocaleString()}
            </Text>
          </View>

          <Text style={styles.paymentsLeft}>
            {remainingPayments} payments remaining
          </Text>
          <ProgressBar progress={paymentProgress} color={Colors.teal} />
        </Card>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <StatCard
            label="Loans Taken"
            value={String(stats.loansTaken)}
            color={Colors.teal}
          />
          <View style={{ width: Spacing.sm }} />
          <StatCard
            label="Repaid"
            value={`${stats.paymentsRepaid}/${stats.totalPayments}`}
            color={Colors.teal}
          />
          <View style={{ width: Spacing.sm }} />
          <StatCard
            label="Credit Score"
            value={String(stats.creditScore)}
            color={Colors.gold}
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: Colors.teal }]}
            onPress={() => router.push("/(borrower)/apply")}
          >
            <Ionicons
              name="document-text-outline"
              size={20}
              color={Colors.white}
            />
            <Text style={styles.actionText}>Apply for Loan</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionBtn,
              {
                backgroundColor: Colors.white,
                borderWidth: 1,
                borderColor: Colors.border,
              },
            ]}
            onPress={() => router.push("/(borrower)/payment")}
          >
            <Ionicons
              name="cash-outline"
              size={20}
              color={Colors.textPrimary}
            />
            <Text style={[styles.actionText, { color: Colors.textPrimary }]}>
              Make Payment
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              {
                backgroundColor: Colors.white,
                borderWidth: 1,
                borderColor: Colors.border,
              },
            ]}
            onPress={() => router.push("/(borrower)/loans")}
          >
            <Ionicons
              name="list-outline"
              size={20}
              color={Colors.textPrimary}
            />
            <Text style={[styles.actionText, { color: Colors.textPrimary }]}>
              My Loans
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionBtn,
              {
                backgroundColor: Colors.white,
                borderWidth: 1,
                borderColor: Colors.border,
              },
            ]}
            onPress={() => router.push("/(borrower)/wallet")}
          >
            <Ionicons
              name="wallet-outline"
              size={20}
              color={Colors.textPrimary}
            />
            <Text style={[styles.actionText, { color: Colors.textPrimary }]}>
              My Wallet
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, paddingBottom: 40 },
  greetingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  greeting: { ...Typography.body, color: Colors.textSecondary },
  name: { ...Typography.h2, color: Colors.textPrimary },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
    ...Shadow.sm,
  },
  loanCard: { backgroundColor: Colors.navy, marginBottom: Spacing.lg },
  loanHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  loanLabel: { ...Typography.small, color: Colors.textMuted },
  activeBadge: {
    backgroundColor: Colors.teal + "30",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  activeBadgeText: {
    ...Typography.caption,
    color: Colors.teal,
    fontWeight: "600",
  },
  loanAmount: {
    ...Typography.h1,
    color: Colors.white,
    marginBottom: Spacing.md,
  },
  loanDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
  },
  loanDetailLabel: { ...Typography.small, color: Colors.textMuted },
  loanDetailValue: { ...Typography.smallMedium, color: Colors.white },
  paymentsLeft: {
    ...Typography.small,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  statsRow: { flexDirection: "row", marginBottom: Spacing.lg },
  actions: { flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.sm },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    ...Shadow.sm,
  },
  actionText: { ...Typography.buttonSmall, color: Colors.white },
});
