import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchPortfolio, fetchLenderEarnings } from "../services";
import type { LoanStatus } from "../models";

export function usePortfolioViewModel() {
  const [filter, setFilter] = useState<"all" | LoanStatus>("all");

  const {
    data: allLoans = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["lender", "portfolio"],
    queryFn: fetchPortfolio,
  });

  const { data: earnings } = useQuery({
    queryKey: ["lender", "earnings"],
    queryFn: fetchLenderEarnings,
  });

  const loans = allLoans.filter((l) => filter === "all" || l.status === filter);

  const totalLent = allLoans.reduce((sum, l) => sum + l.amount, 0);
  const totalEarned = earnings?.totalEarned ?? 0;
  const totalPaid = allLoans.reduce((sum, l) => sum + (l.totalPaid ?? 0), 0);
  const totalOwed = allLoans.reduce((sum, l) => sum + l.totalRepayable, 0);
  const repaymentRate = totalOwed ? Math.round((totalPaid / totalOwed) * 100) : 0;
  const totalActive = allLoans.filter(
    (l) => l.status === "active" || l.status === "overdue",
  ).length;

  const filters = ["all", "active", "completed", "overdue"] as const;

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
  };
}
