import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchBrowseOffers, fetchOfferTemplateDetail } from "../services";

const RATE_BANDS = [
  { key: "", label: "All Rates" },
  { key: "under5", label: "Under 5%/mo" },
  { key: "5to7", label: "5%–7%/mo" },
  { key: "7to10", label: "7%–10%/mo" },
  { key: "above10", label: "Above 10%" },
];

/** Borrower browsing individual lenders' standing offers before applying —
 * a discovery screen, not a bypass of auto-matching. See offer-detail's
 * "Apply to This Offer", which pre-fills the Apply tab with the browsed
 * offer's terms but still submits through the normal broadcast flow. */
export function useBrowseOffersViewModel() {
  const [search, setSearch] = useState("");
  const [rate, setRate] = useState("");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["browse-offers", search, rate],
    queryFn: () => fetchBrowseOffers({ search: search || undefined, rate: rate || undefined }),
  });

  return {
    search,
    setSearch,
    rate,
    setRate,
    rateBands: RATE_BANDS,
    offers: data?.offers ?? [],
    total: data?.total ?? 0,
    isLoading,
    error,
    refetch,
  };
}

export function useOfferTemplateDetailViewModel(templateId: string) {
  const { data: offer, isLoading, error, refetch } = useQuery({
    queryKey: ["offer-template-detail", templateId],
    queryFn: () => fetchOfferTemplateDetail(templateId),
    enabled: !!templateId,
  });

  return { offer, isLoading, error, refetch };
}
