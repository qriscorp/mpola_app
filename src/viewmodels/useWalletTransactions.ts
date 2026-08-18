import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as WebBrowser from "expo-web-browser";
import {
  depositMobileMoney,
  withdrawMobileMoney,
  initiateCardDeposit,
  getCardDepositStatus,
  getBanks,
  initiateBankWithdraw,
  getBankWithdrawStatus,
  sendWithdrawOtp,
} from "../services";
import { pollUntilResolved } from "../services/poll";

const WALLET_KEYS = [
  ["borrower", "wallet"],
  ["lender", "wallet"],
];

/** Shared by both borrower and lender viewmodels — one wallet per user. */
export function useWalletTransactions() {
  const qc = useQueryClient();
  const invalidateWallets = () =>
    WALLET_KEYS.forEach((key) => qc.invalidateQueries({ queryKey: key }));

  const depositMobileMoneyMutation = useMutation({
    mutationFn: depositMobileMoney,
    onSuccess: invalidateWallets,
  });

  const withdrawMobileMoneyMutation = useMutation({
    mutationFn: withdrawMobileMoney,
    onSuccess: invalidateWallets,
  });

  const sendWithdrawOtpMutation = useMutation({
    mutationFn: sendWithdrawOtp,
  });

  const cardDepositMutation = useMutation({
    mutationFn: async (data: { amount: number }) => {
      const { checkoutUrl, reference } = await initiateCardDeposit({
        amount: data.amount,
        redirectUrl: "https://mpola.co/dashboard/wallet",
      });
      await WebBrowser.openBrowserAsync(checkoutUrl);
      return pollUntilResolved(() => getCardDepositStatus(reference));
    },
    onSuccess: invalidateWallets,
  });

  const banksQuery = useQuery({
    queryKey: ["wallet", "banks", "UG"],
    queryFn: () => getBanks("UG"),
  });

  const bankWithdrawMutation = useMutation({
    mutationFn: async (data: {
      amount: number;
      accountBank: string;
      accountNumber: string;
      beneficiaryName: string;
      narration?: string;
      otpCode: string;
    }) => {
      const { reference } = await initiateBankWithdraw(data);
      return pollUntilResolved(() => getBankWithdrawStatus(reference));
    },
    onSuccess: invalidateWallets,
  });

  return {
    depositMobileMoney: depositMobileMoneyMutation.mutateAsync,
    isDepositingMobileMoney: depositMobileMoneyMutation.isPending,
    withdrawMobileMoney: withdrawMobileMoneyMutation.mutateAsync,
    isWithdrawingMobileMoney: withdrawMobileMoneyMutation.isPending,
    sendWithdrawOtp: sendWithdrawOtpMutation.mutateAsync,
    isSendingWithdrawOtp: sendWithdrawOtpMutation.isPending,
    depositWithCard: cardDepositMutation.mutateAsync,
    isDepositingWithCard: cardDepositMutation.isPending,
    banks: banksQuery.data ?? [],
    banksLoading: banksQuery.isLoading,
    withdrawWithBank: bankWithdrawMutation.mutateAsync,
    isWithdrawingWithBank: bankWithdrawMutation.isPending,
  };
}
