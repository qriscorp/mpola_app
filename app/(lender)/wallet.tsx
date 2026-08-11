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
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Typography, Spacing, BorderRadius } from "../../src/theme";
import {
  Card,
  TransactionItem,
  WalletSetupModal,
  WalletDepositModal,
  WalletWithdrawModal,
  SkeletonHero,
  SkeletonList,
} from "../../src/components";
import { useLenderWalletViewModel } from "../../src/viewmodels";

export default function LenderWalletScreen() {
  const router = useRouter();
  const {
    wallet,
    isLoading,
    error,
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
    txPage,
    setTxPage,
    pagedTransactions,
    pagedTransactionsTotal,
    pagedTransactionsLoading,
  } = useLenderWalletViewModel();
  const totalTxPages = Math.max(1, Math.ceil(pagedTransactionsTotal / 20));
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

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: Spacing.lg }}>
          <Text style={{ color: Colors.textMuted }}>
            Couldn't load your wallet. Please try again.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading || !wallet) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.xl }}>
          <SkeletonHero />
          <SkeletonList count={4} cardHeight={64} />
        </ScrollView>
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
          {!wallet.isWalletSetup ? (
            <>
              <Text style={styles.setupHint}>
                Set up your wallet to deposit or withdraw
              </Text>
              <View style={styles.balanceActions}>
                <TouchableOpacity
                  style={styles.depositBtn}
                  onPress={() => setSetupVisible(true)}
                >
                  <Text style={styles.depositText}>Set Up Wallet</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.balanceActions}>
              <TouchableOpacity
                style={styles.depositBtn}
                onPress={() => setDepositVisible(true)}
              >
                <Ionicons
                  name="add-circle-outline"
                  size={18}
                  color={Colors.white}
                />
                <Text style={styles.depositText}>Deposit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.withdrawBtn}
                onPress={() => setWithdrawVisible(true)}
              >
                <Ionicons
                  name="arrow-up-circle-outline"
                  size={18}
                  color={Colors.textMuted}
                />
                <Text style={styles.withdrawText}>Withdraw</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.withdrawBtn}
                onPress={() => router.push("/(lender)/portfolio")}
              >
                <Ionicons
                  name="cash-outline"
                  size={18}
                  color={Colors.textMuted}
                />
                <Text style={styles.withdrawText}>Fund Loan</Text>
              </TouchableOpacity>
            </View>
          )}
        </Card>

        <WalletSetupModal
          visible={setupVisible}
          onClose={() => setSetupVisible(false)}
          onSubmit={handleSetup}
          loading={isSettingUp}
          accentColor={Colors.gold}
        />

        <WalletDepositModal
          visible={depositVisible}
          onClose={() => setDepositVisible(false)}
          onDepositMobileMoney={depositMobileMoney}
          onDepositCard={depositWithCard}
          isSubmittingMobileMoney={isDepositingMobileMoney}
          isSubmittingCard={isDepositingWithCard}
          accentColor={Colors.gold}
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
          accentColor={Colors.gold}
        />

        {/* Transactions */}
        <View style={styles.txHeader}>
          <Text style={styles.txTitle}>Recent Transactions</Text>
        </View>

        {pagedTransactionsLoading ? (
          <SkeletonList count={4} cardHeight={64} />
        ) : (
          pagedTransactions.map((tx) => (
            <TransactionItem
              key={tx.id}
              amount={tx.amount}
              description={tx.description}
              date={tx.date}
              type={tx.amount > 0 ? "credit" : "debit"}
            />
          ))
        )}

        {pagedTransactionsTotal > 0 && (
          <View style={styles.paginationRow}>
            <TouchableOpacity
              style={[styles.pageBtn, txPage <= 1 && styles.pageBtnDisabled]}
              onPress={() => setTxPage(txPage - 1)}
              disabled={txPage <= 1}
            >
              <Text style={styles.pageBtnText}>Previous</Text>
            </TouchableOpacity>
            <Text style={styles.pageIndicator}>
              Page {txPage} of {totalTxPages}
            </Text>
            <TouchableOpacity
              style={[
                styles.pageBtn,
                txPage >= totalTxPages && styles.pageBtnDisabled,
              ]}
              onPress={() => setTxPage(txPage + 1)}
              disabled={txPage >= totalTxPages}
            >
              <Text style={styles.pageBtnText}>Next</Text>
            </TouchableOpacity>
          </View>
        )}
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
  setupHint: {
    ...Typography.small,
    color: Colors.textMuted,
    marginTop: 6,
    textAlign: "center",
  },
  balanceActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  depositBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: Colors.gold,
    paddingHorizontal: Spacing.lg,
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
    paddingHorizontal: Spacing.lg,
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
  paginationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.md,
  },
  pageBtn: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  pageBtnDisabled: { opacity: 0.4 },
  pageBtnText: { ...Typography.smallMedium, color: Colors.white },
  pageIndicator: { ...Typography.small, color: Colors.textSecondary },
});
