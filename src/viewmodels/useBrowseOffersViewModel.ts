import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as DocumentPicker from "expo-document-picker";
import { fetchBrowseOfferTemplates, fetchOfferTemplateDetail, uploadBorrowerDocument } from "../services";
import type { BorrowerDocumentType } from "../services";

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
    queryFn: () => fetchBrowseOfferTemplates({ search: search || undefined, rate: rate || undefined }),
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
  const queryClient = useQueryClient();
  const { data: offer, isLoading, error, refetch } = useQuery({
    queryKey: ["offer-template-detail", templateId],
    queryFn: () => fetchOfferTemplateDetail(templateId),
    enabled: !!templateId,
  });

  // Lets a borrower get their documents ready straight from the Offer
  // Detail screen, before they've even applied — uploadBorrowerDocument is
  // a reusable, account-level upload (no applicationId involved), the same
  // one offer-detail.tsx uses at accept-time, so whatever's uploaded here
  // counts there too.
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const uploadDocMutation = useMutation({
    mutationFn: (vars: { documentType: BorrowerDocumentType; uri: string; name: string; mimeType?: string }) =>
      uploadBorrowerDocument(vars.documentType, vars),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offer-template-detail", templateId] });
    },
  });

  const uploadRequiredDocument = async (documentType: BorrowerDocumentType) => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "image/*"],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setUploadingType(documentType);
    try {
      await uploadDocMutation.mutateAsync({
        documentType,
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType,
      });
    } finally {
      setUploadingType(null);
    }
  };

  return {
    offer,
    isLoading,
    error,
    refetch,
    uploadRequiredDocument,
    uploadingDocumentType: uploadingType,
  };
}
