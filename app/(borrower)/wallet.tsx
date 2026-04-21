import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, BorderRadius } from "../../src/theme";
import { Card, Button, TransactionItem } from "../../src/components";
import { useBorrowerWalletViewModel } from "../../src/viewmodels";

export default function WalletScreen() {
  const { wallet } = useBorrowerWalletViewModel();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.headerRow}>
          <Text style={styles.title}>My Wallet</Text>
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
            UGX {wallet?.balance.toLocaleString()}
          </Text>
          <Text style={styles.balanceUsd}>≈ USD {wallet?.balanceUsd}</Text>
          <View style={styles.balanceActions}>
            <TouchableOpacity style={styles.topUpBtn}>
              <Text style={styles.topUpText}>+ Top Up</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.withdrawBtn}>
              <Text style={styles.withdrawText}>Withdraw</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Transactions */}
        <View style={styles.txHeader}>
          <Text style={styles.txTitle}>Transaction History</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        {wallet?.transactions.map((tx) => (
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
  title: { ...Typography.h2, color: Colors.textPrimary },
  balanceCard: {
    backgroundColor: Colors.navy,
    alignItems: "center",
    marginBottom: Spacing.xxl,
  },
  balanceLabel: {
    ...Typography.caption,
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  balanceAmount: {
    ...Typography.h1,
    color: Colors.white,
    fontSize: 32,
    marginTop: 4,
  },
  balanceUsd: {
    ...Typography.small,
    color: Colors.textMuted,
    marginTop: 2,
    marginBottom: Spacing.lg,
  },
  balanceActions: { flexDirection: "row", gap: Spacing.md },
  topUpBtn: {
    backgroundColor: Colors.teal,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  topUpText: { ...Typography.buttonSmall, color: Colors.white },
  withdrawBtn: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: Colors.textMuted,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  withdrawText: { ...Typography.buttonSmall, color: Colors.textMuted },
  txHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  txTitle: { ...Typography.h4, color: Colors.textPrimary },
  seeAll: { ...Typography.smallMedium, color: Colors.teal },
});
