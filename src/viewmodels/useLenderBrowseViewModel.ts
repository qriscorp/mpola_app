import { useState } from "react";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchMarketplace, fetchApplicationDetail, fetchMyOffers, makeOffer } from "../services";
import { makeOfferSchema } from "../validation";
import type { LoanType } from "../models";

// A lender's own standing offer may have already auto-matched this
// application — while it's still pending and inside the 2-day cooldown
// (see AUTO_MATCH_MANUAL_OFFER_COOLDOWN in routers/loans.py), they can't
// also hand-craft a manual offer here. Purely informational/UX gating — the
// backend is the real enforcement.
function autoMatchCooldownHoursLeft(offer: { status: string; templateId: string | null; autoMatchCooldownEndsAt: string | null } | undefined): number | null {
  if (!offer || offer.status !== "pending" || !offer.templateId || !offer.autoMatchCooldownEndsAt) {
    return null;
  }
  const msLeft = new Date(offer.autoMatchCooldownEndsAt).getTime() - Date.now();
  return msLeft > 0 ? Math.ceil(msLeft / 3_600_000) : null;
}

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
  const { data: myOffers } = useQuery({
    queryKey: ["lender", "offers"],
    queryFn: fetchMyOffers,
  });
  const cooldownHoursLeft = autoMatchCooldownHoursLeft(
    myOffers?.find((o) => o.applicationId === applicationId),
  );
  const [amount, setAmount] = useState("8000000");
  const [rate, setRate] = useState("3");
  const [duration, setDuration] = useState("18");
  // Independent of whatever the application itself asked for — a lender can
  // freely counter with either term shape, same flexibility this form
  // already gives on amount/rate.
  const [isEmergency, setIsEmergency] = useState(false);
  const [requiredDocuments, setRequiredDocuments] = useState<string[]>([]);
  const [customDocInput, setCustomDocInput] = useState("");
  const [offerErrors, setOfferErrors] = useState<Record<string, string>>({});

  const toggleRequiredDocument = (label: string) => {
    setRequiredDocuments((prev) =>
      prev.includes(label) ? prev.filter((d) => d !== label) : [...prev, label],
    );
  };

  const addCustomDocument = () => {
    const label = customDocInput.trim();
    if (!label || requiredDocuments.includes(label)) return;
    setRequiredDocuments((prev) => [...prev, label]);
    setCustomDocInput("");
  };

  const numAmount = Number(amount) || 0;
  const numRate = Number(rate) || 0;
  const numDuration = Number(duration) || 1;

  const totalInterest = isEmergency
    ? numAmount * (numRate / 100) * (numDuration / 30)
    : numAmount * (numRate / 100) * numDuration;
  const totalRepayable = numAmount + totalInterest;
  const monthlyPayment = isEmergency
    ? Math.round(totalRepayable)
    : numDuration > 0
      ? Math.round(totalRepayable / numDuration)
      : 0;

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
    const result = isEmergency
      ? makeOfferSchema
          .omit({ duration: true })
          .extend({
            duration: z.string().refine(
              (v) => Number(v) >= 1 && Number(v) <= 29,
              "Duration: 1-29 days",
            ),
          })
          .safeParse({ amount, rate, duration })
      : makeOfferSchema.safeParse({ amount, rate, duration });
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
      duration: isEmergency ? null : numDuration,
      durationDays: isEmergency ? numDuration : null,
      requiredDocuments,
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
    isEmergency,
    setIsEmergency,
    requiredDocuments,
    toggleRequiredDocument,
    customDocInput,
    setCustomDocInput,
    addCustomDocument,
    cooldownHoursLeft,
    monthlyPayment,
    totalEarnings: Math.round(totalInterest),
    totalRepayable: Math.round(totalRepayable),
    offerErrors,
    loading: offerMutation.isPending,
    sendOffer,
  };
}
