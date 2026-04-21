import { useQuery } from "@tanstack/react-query";
import { fetchLenderWallet } from "../services";

export function useLenderWalletViewModel() {
  const {
    data: wallet,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["lender", "wallet"],
    queryFn: fetchLenderWallet,
  });

  return { wallet, isLoading, error, refetch };
}
