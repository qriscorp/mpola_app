import { useQuery } from "@tanstack/react-query";
import { fetchLenderDashboard } from "../services";

export function useLenderDashboardViewModel() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["lender", "dashboard"],
    queryFn: fetchLenderDashboard,
  });

  return {
    user: data?.user ?? { firstName: "", lastName: "" },
    stats: data?.stats ?? {
      totalDeployed: 0,
      activeLoans: 0,
      monthlyReturn: 0,
      repaymentRate: 0,
      totalEarned: 0,
      thisMonthEarned: 0,
      pendingAmount: 0,
      projectedAmount: 0,
    },
    recentActivity: data?.recentActivity ?? [],
    newMatches: data?.newMatches ?? 0,
    isLoading,
    error,
    refetch,
  };
}
