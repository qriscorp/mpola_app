import { useQuery } from "@tanstack/react-query";
import { fetchLenderEarnings } from "../services";

export function useEarningsViewModel() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["lender", "earnings"],
    queryFn: fetchLenderEarnings,
  });

  return {
    earnings: data,
    monthly: data?.monthlyEarnings ?? [],
    isLoading,
    error,
    refetch,
  };
}
