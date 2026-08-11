import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchBorrowerWallet,
  fetchActiveLoan,
  fetchWalletTransactionsPage,
  makeRepayment,
  setupWallet,
} from "../services";
import { useWalletTransactions } from "./useWalletTransactions";
import { calcPlatformFee } from "../services/fees";

const TX_PAGE_SIZE = 20;

export function useBorrowerWalletViewModel() {
  const queryClient = useQueryClient();
  const {
    data: wallet,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["borrower", "wallet"],
    queryFn: fetchBorrowerWallet,
  });

  const [txPage, setTxPage] = useState(1);
  const { data: txPageData, isLoading: txPageLoading } = useQuery({
    queryKey: ["borrower", "wallet", "transactions", txPage],
    queryFn: () => fetchWalletTransactionsPage(txPage, TX_PAGE_SIZE),
  });

  const setupMutation = useMutation({
    mutationFn: setupWallet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["borrower", "wallet"] });
    },
  });

  const transactions = useWalletTransactions();

  return {
    wallet,
    isLoading,
    error,
    refetch,
    setupWallet: setupMutation.mutateAsync,
    isSettingUp: setupMutation.isPending,
    setupError: setupMutation.error,
    txPage,
    setTxPage,
    txPageSize: TX_PAGE_SIZE,
    pagedTransactions: txPageData?.transactions ?? [],
    pagedTransactionsTotal: txPageData?.total ?? 0,
    pagedTransactionsLoading: txPageLoading,
    ...transactions,
  };
}

export function useActiveLoanViewModel() {
  const { data: loan, isLoading, error, refetch } = useQuery({
    queryKey: ["borrower", "activeLoan"],
    queryFn: fetchActiveLoan,
  });

  return { loan, isLoading, error, refetch };
}

export function usePaymentViewModel() {
  const queryClient = useQueryClient();
  const [amountInput, setAmountInput] = useState("");
  const [depositModalVisible, setDepositModalVisible] = useState(false);

  const { data: loan, isLoading: loanLoading } = useQuery({
    queryKey: ["borrower", "activeLoan"],
    queryFn: fetchActiveLoan,
  });
  const { data: wallet } = useQuery({
    queryKey: ["borrower", "wallet"],
    queryFn: fetchBorrowerWallet,
  });
  const deposit = useWalletTransactions();

  const dueAmount = loan?.nextPaymentAmount ?? loan?.monthlyPayment ?? 0;
  const remainingBalance = Math.max(
    0,
    (loan?.totalRepayable ?? 0) - (loan?.totalPaid ?? 0),
  );
  const showPayoffOption = remainingBalance > dueAmount;
  const amount = amountInput ? Number(amountInput) : dueAmount;
  const payMode: "instalment" | "full" | "custom" =
    amount === dueAmount ? "instalment" : amount === remainingBalance ? "full" : "custom";
  const instalmentNumber = (loan?.paidInstalments ?? 0) + 1;
  const totalInstalments = loan?.totalInstalments ?? 0;
  const dueDate = loan?.nextPaymentDate ?? "";
  const walletBalance = wallet?.balance ?? 0;
  const processingFee = calcPlatformFee(amount);
  const totalDeducted = amount + processingFee;
  const shortfall = totalDeducted - walletBalance;
  const sufficient = shortfall <= 0;

  const paymentMutation = useMutation({
    mutationFn: makeRepayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["borrower", "activeLoan"] });
      queryClient.invalidateQueries({ queryKey: ["borrower", "wallet"] });
    },
  });

  const confirmPayment = async () => {
    if (!loan) throw new Error("No active loan to pay");
    return paymentMutation.mutateAsync({
      loanId: loan.id,
      amount,
      paymentMethod: "wallet",
    });
  };

  return {
    loan,
    loanLoading,
    amountInput,
    setAmountInput,
    amount,
    dueAmount,
    remainingBalance,
    showPayoffOption,
    payMode,
    instalmentNumber,
    totalInstalments,
    dueDate,
    walletBalance,
    processingFee,
    totalDeducted,
    shortfall,
    sufficient,
    loading: paymentMutation.isPending,
    confirmPayment,
    depositModalVisible,
    setDepositModalVisible,
    depositMobileMoney: deposit.depositMobileMoney,
    isDepositingMobileMoney: deposit.isDepositingMobileMoney,
    depositWithCard: deposit.depositWithCard,
    isDepositingWithCard: deposit.isDepositingWithCard,
  };
}
