import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { fetchBorrowerProfiles, sendLendingOffer } from "../services";
import { makeOfferSchema } from "../validation";
import type { LoanType } from "../models";

export function useBrowseBorrowersViewModel() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | LoanType>("all");

  const {
    data: allBorrowers = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["lender", "borrowerProfiles"],
    queryFn: fetchBorrowerProfiles,
  });

  const borrowers = allBorrowers.filter((b) => {
    const matchSearch = b.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || b.loanType === filter;
    return matchSearch && matchFilter;
  });

  const totalCount = allBorrowers.length;
  const filters = ["all", "personal", "business"] as const;

  return {
    search,
    setSearch,
    filter,
    setFilter,
    borrowers,
    totalCount,
    filters,
    isLoading,
    error,
    refetch,
  };
}

export function useMakeOfferViewModel() {
  const [amount, setAmount] = useState("8000000");
  const [rate, setRate] = useState("3.5");
  const [duration, setDuration] = useState("18");
  const [offerErrors, setOfferErrors] = useState<Record<string, string>>({});

  const numAmount = Number(amount) || 0;
  const numRate = Number(rate) || 0;
  const numDuration = Number(duration) || 1;

  const monthlyPayment = Math.round(
    (numAmount * (1 + (numRate / 100) * numDuration)) / numDuration,
  );
  const totalEarnings = Math.round(numAmount * (numRate / 100) * numDuration);
  const totalRepayable = numAmount + totalEarnings;

  const offerMutation = useMutation({
    mutationFn: sendLendingOffer,
  });

  const sendOffer = async () => {
    const result = makeOfferSchema.safeParse({
      amount: numAmount,
      interestRate: numRate,
      duration: numDuration,
    });
    if (!result.success) {
      const errs: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as string;
        if (!errs[key]) errs[key] = issue.message;
      }
      setOfferErrors(errs);
      return false;
    }
    setOfferErrors({});
    await offerMutation.mutateAsync(result.data);
    return true;
  };

  return {
    amount,
    setAmount,
    rate,
    setRate,
    duration,
    setDuration,
    monthlyPayment,
    totalEarnings,
    totalRepayable,
    offerErrors,
    loading: offerMutation.isPending,
    sendOffer,
  };
}
