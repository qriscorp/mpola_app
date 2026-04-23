import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, BorderRadius } from "../../src/theme";
import { Card, TransactionItem } from "../../src/components";
import { useLenderWalletViewModel } from "../../src/viewmodels";

export default function LenderWalletScreen() {
  const { wallet, isLoading } = useLenderWalletViewModel();

  if (isLoading || !wallet) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator
          size="large"
          color={Colors.gold}
          style={{ flex: 1 }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.headerRow}>
          <Text style={styles.title}>Wallet</Text>
          <TouchableOpacity>
            <Ionicons
              name="notifications-outline"
              size={22}
              color={Colors.textPrimary}
            />
          </TouchableOpacity>
        </View>

        {/* Balance Card */}
        <Card style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>WALLET BALANCE</Text>
          <Text style={styles.balanceAmount}>
            UGX {wallet.balance.toLocaleString()}
          </Text>
          <Text style={styles.balanceUsd}>≈ USD {wallet.balanceUsd}</Text>
          <View style={styles.balanceActions}>
            <TouchableOpacity style={styles.depositBtn}>
              <Ionicons
                name="add-circle-outline"
                size={18}
                color={Colors.white}
              />
              <Text style={styles.depositText}>Deposit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.withdrawBtn}>
              <Ionicons
                name="arrow-up-circle-outline"
                size={18}
                color={Colors.textMuted}
              />
              <Text style={styles.withdrawText}>Withdraw</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Transactions */}
        <View style={styles.txHeader}>
          <Text style={styles.txTitle}>Recent Transactions</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        {wallet.transactions.map((tx) => (
          <TransactionItem
            key={tx.id}
            amount={tx.amount}
            description={tx.description}
            date={tx.date}
            type={tx.amount > 0 ? "credit" : "debit"}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, paddingBottom: 40 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  title: { ...Typography.h2, color: Colors.white },
  balanceCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: "center",
    marginBottom: Spacing.xxl,
  },
  balanceLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  balanceAmount: {
    fontSize: 34,
    fontWeight: "800",
    color: Colors.white,
    marginTop: 4,
  },
  balanceUsd: {
    ...Typography.small,
    color: Colors.textMuted,
    marginTop: 2,
    marginBottom: Spacing.lg,
  },
  balanceActions: { flexDirection: "row", gap: Spacing.md },
  depositBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: Colors.gold,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  depositText: { ...Typography.buttonSmall, color: Colors.white },
  withdrawBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  withdrawText: { ...Typography.buttonSmall, color: Colors.textSecondary },
  txHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  txTitle: { ...Typography.h4, color: Colors.textPrimary },
  seeAll: { ...Typography.smallMedium, color: Colors.gold },
});
