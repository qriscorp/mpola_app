import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors, Typography, Spacing, BorderRadius } from "../../src/theme";
import {
  TransactionItem,
  WalletSetupModal,
  WalletDepositModal,
  WalletWithdrawModal,
} from "../../src/components";
import { useBorrowerWalletViewModel } from "../../src/viewmodels";

export default function WalletScreen() {
  const {
    wallet,
    setupWallet,
    isSettingUp,
    depositMobileMoney,
    isDepositingMobileMoney,
    depositWithCard,
    isDepositingWithCard,
    withdrawMobileMoney,
    isWithdrawingMobileMoney,
    withdrawWithBank,
    isWithdrawingWithBank,
    banks,
    banksLoading,
  } = useBorrowerWalletViewModel();
  const [setupVisible, setSetupVisible] = useState(false);
  const [depositVisible, setDepositVisible] = useState(false);
  const [withdrawVisible, setWithdrawVisible] = useState(false);

  const handleSetup = async (pin: string) => {
    try {
      await setupWallet(pin);
      setSetupVisible(false);
    } catch (e) {
      Alert.alert(
        "Setup failed",
        e instanceof Error ? e.message : "Please try again.",
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <Text style={styles.title}>My Wallet</Text>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>WALLET BALANCE</Text>
          <Text style={styles.balanceAmount}>
            UGX {wallet?.balance.toLocaleString()}
          </Text>
          {wallet && !wallet.isWalletSetup ? (
            <>
              <Text style={styles.setupHint}>
                Set up your wallet to deposit or withdraw
              </Text>
              <View style={styles.balanceActions}>
                <TouchableOpacity
                  style={styles.topUpBtn}
                  onPress={() => setSetupVisible(true)}
                >
                  <Text style={styles.topUpText}>Set Up Wallet</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.balanceActions}>
              <TouchableOpacity
                style={styles.topUpBtn}
                onPress={() => setDepositVisible(true)}
              >
                <Text style={styles.topUpText}>+ Top Up</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.withdrawBtn}
                onPress={() => setWithdrawVisible(true)}
              >
                <Text style={styles.withdrawText}>Withdraw</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <WalletSetupModal
          visible={setupVisible}
          onClose={() => setSetupVisible(false)}
          onSubmit={handleSetup}
          loading={isSettingUp}
          accentColor={Colors.teal}
        />

        <WalletDepositModal
          visible={depositVisible}
          onClose={() => setDepositVisible(false)}
          onDepositMobileMoney={depositMobileMoney}
          onDepositCard={depositWithCard}
          isSubmittingMobileMoney={isDepositingMobileMoney}
          isSubmittingCard={isDepositingWithCard}
          accentColor={Colors.teal}
        />

        <WalletWithdrawModal
          visible={withdrawVisible}
          onClose={() => setWithdrawVisible(false)}
          onWithdrawMobileMoney={withdrawMobileMoney}
          onWithdrawBank={withdrawWithBank}
          banks={banks}
          banksLoading={banksLoading}
          isSubmittingMobileMoney={isWithdrawingMobileMoney}
          isSubmittingBank={isWithdrawingWithBank}
          accentColor={Colors.teal}
        />

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
  title: { ...Typography.h2, color: Colors.white, marginBottom: Spacing.lg },
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
  setupHint: {
    ...Typography.small,
    color: Colors.textMuted,
    marginTop: 6,
    textAlign: "center",
  },
  balanceActions: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  topUpBtn: {
    backgroundColor: Colors.teal,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  topUpText: { ...Typography.buttonSmall, color: Colors.white },
  withdrawBtn: {
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
  seeAll: { ...Typography.smallMedium, color: Colors.teal },
});
