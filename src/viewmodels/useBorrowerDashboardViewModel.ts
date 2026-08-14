import { useQuery } from "@tanstack/react-query";
import { fetchBorrowerDashboard } from "../services";

export function useBorrowerDashboardViewModel() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["borrower", "dashboard"],
    queryFn: fetchBorrowerDashboard,
  });

  const loan = data?.loan;
  // Amount-based, not instalment-count-based — paidInstalments only
  // advances once a full instalment clears (see make_repayment in
  // routers/loans.py), so a partial payment the borrower already made
  // would otherwise show as 0% progress here even though totalPaid
  // reflects it.
  const paymentProgress = loan && loan.totalRepayable
    ? Math.min(1, (loan.totalPaid ?? 0) / loan.totalRepayable)
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
