import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Colors, Spacing, BorderRadius, useScaledTypography } from "../../../src/theme";
import { showAlert } from "../../../src/services/alerts";
import {
  TransactionItem,
  TransactionDetailModal,
  WalletSetupModal,
  WalletDepositModal,
  WalletWithdrawModal,
  SkeletonHero,
  SkeletonList,
} from "../../../src/components";
import { useBorrowerWalletViewModel } from "../../../src/viewmodels";

export default function WalletScreen() {
  const router = useRouter();
  const typography = useScaledTypography();
  const styles = useMemo(() => makeStyles(typography), [typography]);
  const {
    wallet,
    isLoading,
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
    sendWithdrawOtp,
    isSendingWithdrawOtp,
    banks,
    banksLoading,
    txPage,
    setTxPage,
    pagedTransactions,
    pagedTransactionsTotal,
    pagedTransactionsLoading,
  } = useBorrowerWalletViewModel();
  const totalTxPages = Math.max(1, Math.ceil(pagedTransactionsTotal / 20));
  const [setupVisible, setSetupVisible] = useState(false);
  const [depositVisible, setDepositVisible] = useState(false);
  const [withdrawVisible, setWithdrawVisible] = useState(false);
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);

  const handleSetup = async (pin: string) => {
    try {
      await setupWallet(pin);
      setSetupVisible(false);
    } catch (e) {
      showAlert(
        "Setup failed",
        e instanceof Error ? e.message : "Please try again.",
      );
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          <Text style={styles.title}>My Wallet</Text>
          <View style={{ marginBottom: Spacing.xxl }}>
            <SkeletonHero />
          </View>
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
        <Text style={styles.title}>My Wallet</Text>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>WALLET BALANCE</Text>
          <Text style={styles.balanceAmount}>
            UGX {wallet?.balance.toLocaleString()}
          </Text>
          {wallet?.isFrozen && (
            <View style={styles.frozenBanner}>
              <Text style={styles.frozenTitle}>Wallet frozen</Text>
              <Text style={styles.frozenText}>
                {wallet.frozenReason || "Contact support for details."} You can't deposit,
                withdraw, or make transactions until it's unfrozen.
              </Text>
            </View>
          )}

          {wallet?.isFrozen ? null : wallet && !wallet.isWalletSetup ? (
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
              <TouchableOpacity
                style={styles.withdrawBtn}
                onPress={() => router.push("/(borrower)/payment")}
              >
                <Text style={styles.withdrawText}>Pay Loan</Text>
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
          onSendOtp={sendWithdrawOtp}
          isSendingOtp={isSendingWithdrawOtp}
          banks={banks}
          banksLoading={banksLoading}
          isSubmittingMobileMoney={isWithdrawingMobileMoney}
          isSubmittingBank={isWithdrawingWithBank}
          accentColor={Colors.teal}
        />

        {/* Transactions */}
        <View style={styles.txHeader}>
          <Text style={styles.txTitle}>Transaction History</Text>
        </View>

        {pagedTransactionsLoading ? (
          <SkeletonList count={4} cardHeight={64} />
        ) : (
          pagedTransactions.map((tx) => (
            <TransactionItem
              key={tx.id}
              id={tx.id}
              amount={tx.amount}
              description={tx.description}
              date={tx.date}
              type={tx.direction}
              onPress={() => setSelectedTxId(tx.id)}
            />
          ))
        )}

        <TransactionDetailModal
          transactionId={selectedTxId}
          onClose={() => setSelectedTxId(null)}
        />

        {pagedTransactionsTotal > 0 && (
          <View style={styles.paginationRow}>
            <TouchableOpacity
              style={[
                styles.pageBtn,
                txPage <= 1 && styles.pageBtnDisabled,
              ]}
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

function makeStyles(typography: ReturnType<typeof useScaledTypography>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    scroll: { padding: Spacing.lg, paddingBottom: 136 },
    title: { ...typography.h2, color: Colors.white, marginBottom: Spacing.lg },
    balanceCard: {
      backgroundColor: Colors.surface,
      borderRadius: BorderRadius.xl,
      padding: Spacing.xl,
      alignItems: "center",
      marginBottom: Spacing.xxl,
    },
    balanceLabel: {
      ...typography.caption,
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
      ...typography.small,
      color: Colors.textMuted,
      marginTop: 6,
      textAlign: "center",
    },
    frozenBanner: {
      backgroundColor: Colors.dangerBg,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      marginTop: Spacing.md,
      width: "100%",
    },
    frozenTitle: { ...typography.smallMedium, color: Colors.danger, fontWeight: "700" },
    frozenText: { ...typography.small, color: Colors.danger, marginTop: 4 },
    balanceActions: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: Spacing.md,
      marginTop: Spacing.lg,
    },
    topUpBtn: {
      backgroundColor: Colors.teal,
      paddingHorizontal: Spacing.xxl,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.full,
    },
    topUpText: { ...typography.buttonSmall, color: Colors.white },
    withdrawBtn: {
      borderWidth: 1,
      borderColor: Colors.border,
      paddingHorizontal: Spacing.xxl,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.full,
    },
    withdrawText: { ...typography.buttonSmall, color: Colors.textSecondary },
    txHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: Spacing.md,
    },
    txTitle: { ...typography.h4, color: Colors.textPrimary },
    seeAll: { ...typography.smallMedium, color: Colors.teal },
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
    pageBtnText: { ...typography.smallMedium, color: Colors.white },
    pageIndicator: { ...typography.small, color: Colors.textSecondary },
  });
}
