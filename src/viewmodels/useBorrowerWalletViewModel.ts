import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchBorrowerWallet, submitPayment, setupWallet } from "../services";
import type { PaymentMethod } from "../models";

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

  const setupMutation = useMutation({
    mutationFn: setupWallet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["borrower", "wallet"] });
    },
  });

  return {
    wallet,
    isLoading,
    error,
    refetch,
    setupWallet: setupMutation.mutateAsync,
    isSettingUp: setupMutation.isPending,
    setupError: setupMutation.error,
  };
}

export function usePaymentViewModel() {
  const [method, setMethod] = useState<PaymentMethod>("wallet");

  const amount = 354000;
  const instalmentNumber = 7;
  const totalInstalments = 12;
  const dueDate = "May 1";
  const walletBalance = 512000;
  const processingFee = 0;
  const totalDeducted = amount + processingFee;
  const sufficient = walletBalance >= totalDeducted;

  const paymentMutation = useMutation({
    mutationFn: submitPayment,
  });

  const confirmPayment = async () => {
    return paymentMutation.mutateAsync({ method, amount });
  };

  return {
    method,
    setMethod,
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
