import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchLenderWallet, setupWallet } from "../services";

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

  const setupMutation = useMutation({
    mutationFn: setupWallet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lender", "wallet"] });
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
