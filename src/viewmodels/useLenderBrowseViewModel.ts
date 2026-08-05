import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchMarketplace, fetchApplicationDetail, makeOffer } from "../services";
import { makeOfferSchema } from "../validation";
import type { LoanType } from "../models";

export function useApplicationDetailViewModel(applicationId: string) {
  const { data: application, isLoading, error, refetch } = useQuery({
    queryKey: ["application", applicationId],
    queryFn: () => fetchApplicationDetail(applicationId),
    enabled: !!applicationId,
  });

  return { application, isLoading, error, refetch };
}

const PAGE_SIZE = 20;

export function useBrowseBorrowersViewModel() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | LoanType>("all");
  const [page, setPage] = useState(1);

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["lender", "marketplace", page, filter],
    queryFn: () =>
      fetchMarketplace(page, PAGE_SIZE, {
        loanType: filter === "all" ? undefined : filter,
      }),
  });

  const applications = data?.applications ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Search is client-side over the current page only — the marketplace
  // endpoint doesn't support a text search filter server-side.
  const borrowers = applications.filter((a) => {
    const name = a.borrower?.fullName ?? "";
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const filters = ["all", "personal", "business"] as const;

  return {
    search,
    setSearch,
    filter,
    setFilter: (f: "all" | LoanType) => {
      setFilter(f);
      setPage(1);
    },
    borrowers,
    totalCount: total,
    filters,
    page,
    totalPages,
    setPage,
    isLoading,
    error,
    refetch,
  };
}

export function useMakeOfferViewModel(applicationId: string) {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("8000000");
  const [rate, setRate] = useState("15");
  const [duration, setDuration] = useState("18");
  const [offerErrors, setOfferErrors] = useState<Record<string, string>>({});

  const numAmount = Number(amount) || 0;
  const numRate = Number(rate) || 0;
  const numDuration = Number(duration) || 1;

  const totalInterest = numAmount * (numRate / 100) * (numDuration / 12);
  const totalRepayable = numAmount + totalInterest;
  const monthlyPayment =
    numDuration > 0 ? Math.round(totalRepayable / numDuration) : 0;

  const offerMutation = useMutation({
    mutationFn: makeOffer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lender", "marketplace"] });
      queryClient.invalidateQueries({
        queryKey: ["application", applicationId],
      });
    },
  });

  const sendOffer = async () => {
    const result = makeOfferSchema.safeParse({ amount, rate, duration });
    if (!result.success) {
      const errs: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as string;
        if (!errs[key]) errs[key] = issue.message;
      }
      setOfferErrors(errs);
      return null;
    }
    setOfferErrors({});
    const offer = await offerMutation.mutateAsync({
      applicationId,
      amount: numAmount,
      interestRate: numRate,
      duration: numDuration,
    });
    return offer;
  };

  return {
    amount,
    setAmount,
    rate,
    setRate,
    duration,
    setDuration,
    monthlyPayment,
    totalEarnings: Math.round(totalInterest),
    totalRepayable: Math.round(totalRepayable),
    offerErrors,
    loading: offerMutation.isPending,
    sendOffer,
  };
}
