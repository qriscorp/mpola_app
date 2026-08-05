import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchLenderWallet, fetchWalletTransactionsPage, setupWallet } from "../services";
import { useWalletTransactions } from "./useWalletTransactions";

const TX_PAGE_SIZE = 20;

export function useLenderWalletViewModel() {
  const queryClient = useQueryClient();
  const {
    data: wallet,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["lender", "wallet"],
    queryFn: fetchLenderWallet,
  });

  const [txPage, setTxPage] = useState(1);
  const { data: txPageData, isLoading: txPageLoading } = useQuery({
    queryKey: ["lender", "wallet", "transactions", txPage],
    queryFn: () => fetchWalletTransactionsPage(txPage, TX_PAGE_SIZE),
  });

  const setupMutation = useMutation({
    mutationFn: setupWallet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lender", "wallet"] });
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
