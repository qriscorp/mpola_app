import { useQuery } from "@tanstack/react-query";
import { fetchBorrowerDashboard } from "../services";

export function useBorrowerDashboardViewModel() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["borrower", "dashboard"],
    queryFn: fetchBorrowerDashboard,
  });

  const loan = data?.loan;
  const paymentProgress = loan
    ? loan.paidInstalments / loan.totalInstalments
    : 0;
  const remainingPayments = loan
    ? loan.totalInstalments - loan.paidInstalments
    : 0;

  return {
    user: data?.user ?? { firstName: "", lastName: "" },
    stats: data?.stats ?? {
      loansTaken: 0,
      paymentsRepaid: 0,
      totalPayments: 0,
      creditScore: 0,
    },
    loan: data?.loan,
    walletBalance: data?.walletBalance ?? 0,
    paymentProgress,
    remainingPayments,
    isLoading,
    error,
    refetch,
  };
}
