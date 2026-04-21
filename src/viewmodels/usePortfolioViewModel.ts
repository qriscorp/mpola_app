import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchPortfolio } from "../services";
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

  const loans = allLoans.filter((l) => filter === "all" || l.status === filter);

  const totalLent = 12400000;
  const totalEarned = 1860000;
  const repaymentRate = 94;
  const totalActive = allLoans.filter((l) => l.status === "active").length;

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
