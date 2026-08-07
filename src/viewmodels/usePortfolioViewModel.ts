import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchPortfolio, fetchLenderEarnings, approveDisbursement } from "../services";
import type { LoanStatus } from "../models";

export function usePortfolioViewModel() {
  const [filter, setFilter] = useState<"all" | LoanStatus>("all");
  const queryClient = useQueryClient();

  const {
    data: allLoans = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["lender", "portfolio"],
    queryFn: fetchPortfolio,
  });

  const approveDisbursementMutation = useMutation({
    mutationFn: approveDisbursement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lender", "portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["lender", "earnings"] });
      queryClient.invalidateQueries({ queryKey: ["lender", "wallet"] });
    },
  });

  const { data: earnings } = useQuery({
    queryKey: ["lender", "earnings"],
    queryFn: fetchLenderEarnings,
  });

  const loans = allLoans.filter((l) => filter === "all" || l.status === filter);

  // Excludes pending_disbursement — that money hasn't actually left the
  // lender's wallet yet, so it isn't "lent" or earning anything.
  const disbursedLoans = allLoans.filter((l) => l.status !== "pending_disbursement");
  const totalLent = disbursedLoans.reduce((sum, l) => sum + l.amount, 0);
  const totalEarned = earnings?.totalEarned ?? 0;
  const totalPaid = disbursedLoans.reduce((sum, l) => sum + (l.totalPaid ?? 0), 0);
  const totalOwed = disbursedLoans.reduce((sum, l) => sum + l.totalRepayable, 0);
  const repaymentRate = totalOwed ? Math.round((totalPaid / totalOwed) * 100) : 0;
  const totalActive = allLoans.filter(
    (l) => l.status === "active" || l.status === "overdue",
  ).length;

  const filters = ["all", "pending_disbursement", "active", "completed", "overdue"] as const;

  return {
    filter,
    setFilter,
    loans,
    totalLent,
    totalEarned,
    repaymentRate,
    totalActive,
    filters,
    isLoading,
    error,
    refetch,
    approveDisbursement: approveDisbursementMutation.mutateAsync,
    approvingDisbursement: approveDisbursementMutation.isPending,
  };
}
