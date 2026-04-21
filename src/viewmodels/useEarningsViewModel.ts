import { useQuery } from "@tanstack/react-query";
import { fetchEarnings } from "../services";

export function useEarningsViewModel() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["lender", "earnings"],
    queryFn: fetchEarnings,
  });

  return {
    stats: data?.stats,
    breakdown: data?.breakdown ?? [],
    monthly: data?.monthly ?? [],
    isLoading,
    error,
    refetch,
  };
}
