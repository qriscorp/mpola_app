import { useQuery } from "@tanstack/react-query";
import { fetchActiveLoan, fetchLoanDetail } from "../services";

export interface ScheduleRow {
  key: string;
  num: number;
  date: string | null;
  amount: number;
  status: "paid" | "due";
}

/** The borrower's current loan, broken down instalment by instalment —
 * mirrors mpola_website's /dashboard/repayments exactly, including what it
 * deliberately does NOT show: speculative "upcoming" rows beyond the next
 * due instalment. Future instalment amounts/dates can shift (partial
 * payments, late fees), so only real past repayments plus the one
 * currently-due instalment are ever displayed — never a fabricated
 * schedule. */
export function useRepaymentScheduleViewModel() {
  const { data: activeLoan, isLoading: loanLoading } = useQuery({
    queryKey: ["borrower", "activeLoan"],
    queryFn: fetchActiveLoan,
  });

  const { data: loan, isLoading: detailLoading } = useQuery({
    queryKey: ["borrower", "loan-detail", activeLoan?.id],
    queryFn: () => fetchLoanDetail(activeLoan!.id),
    enabled: !!activeLoan?.id,
  });

  const rows: ScheduleRow[] = loan
    ? [
        ...loan.repayments.map((r) => ({
          key: r.id,
          num: r.instalmentNumber,
          date: r.createdAt,
          amount: r.amount,
          status: "paid" as const,
        })),
        ...(loan.status === "active" && loan.nextPaymentAmount
          ? [
              {
                key: "due",
                num: loan.paidInstalments + 1,
                date: loan.nextPaymentDate ?? null,
                amount: loan.nextPaymentAmount,
                status: "due" as const,
              },
            ]
          : []),
      ]
    : [];

  const outstanding = loan ? Math.max(loan.totalRepayable - (loan.totalPaid ?? 0), 0) : 0;
  const progressPct =
    loan && loan.totalRepayable > 0
      ? Math.round(((loan.totalPaid ?? 0) / loan.totalRepayable) * 100)
      : 0;
  const remaining = loan ? loan.totalInstalments - loan.paidInstalments : 0;

  return {
    loan,
    rows,
    outstanding,
    progressPct,
    remaining,
    isLoading: loanLoading || detailLoading,
  };
}
