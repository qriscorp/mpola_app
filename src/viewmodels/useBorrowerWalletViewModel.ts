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
import type { PaymentMethod } from "../models";

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
  const [method, setMethod] = useState<PaymentMethod>("wallet");
  const [phone, setPhone] = useState("");

  const { data: loan, isLoading: loanLoading } = useQuery({
    queryKey: ["borrower", "activeLoan"],
    queryFn: fetchActiveLoan,
  });
  const { data: wallet } = useQuery({
    queryKey: ["borrower", "wallet"],
    queryFn: fetchBorrowerWallet,
  });

  const amount = loan?.nextPaymentAmount ?? loan?.monthlyPayment ?? 0;
  const instalmentNumber = (loan?.paidInstalments ?? 0) + 1;
  const totalInstalments = loan?.totalInstalments ?? 0;
  const dueDate = loan?.nextPaymentDate ?? "";
  const walletBalance = wallet?.balance ?? 0;
  const processingFee = 0;
  const totalDeducted = amount + processingFee;
  const sufficient = walletBalance >= totalDeducted;

  const paymentMutation = useMutation({
    mutationFn: makeRepayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["borrower", "activeLoan"] });
      queryClient.invalidateQueries({ queryKey: ["borrower", "wallet"] });
    },
  });

  const confirmPayment = async () => {
    if (!loan) throw new Error("No active loan to pay");
    const carrier =
      method === "momo" ? "MTN" : method === "airtel" ? "AIRTEL" : undefined;
    return paymentMutation.mutateAsync({
      loanId: loan.id,
      amount,
      paymentMethod: method === "wallet" ? "wallet" : "mobile_money",
      phoneNumber: method === "wallet" ? undefined : phone,
      carrier,
    });
  };

  return {
    loan,
    loanLoading,
    method,
    setMethod,
    phone,
    setPhone,
    amount,
    instalmentNumber,
    totalInstalments,
    dueDate,
    walletBalance,
    processingFee,
    totalDeducted,
    sufficient,
    loading: paymentMutation.isPending,
    confirmPayment,
  };
}
