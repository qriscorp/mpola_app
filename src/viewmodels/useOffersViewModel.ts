import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as DocumentPicker from "expo-document-picker";
import {
  fetchApplicationDetail,
  fetchAllOffersReceived,
  respondToOffer,
  uploadBorrowerDocument,
  submitCustomDocumentResponse,
} from "../services";
import type { BorrowerDocumentType } from "../services";

/** One application's offers — guarantor readiness, document upload, and
 * accept/decline all scoped to that single request. For "every offer I've
 * ever received across all requests," see useAllOffersViewModel below
 * (mirrors mpola_website's split between /dashboard/offers-received?
 * applicationId=X and its no-param "all offers" default view). */
export function useOffersViewModel(applicationId: string) {
  const queryClient = useQueryClient();

  const {
    data: application,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["application", applicationId],
    queryFn: () => fetchApplicationDetail(applicationId),
    enabled: !!applicationId,
  });

  const respondMutation = useMutation({
    mutationFn: (vars: { offerId: string; status: "accepted" | "declined"; note?: string }) =>
      respondToOffer(vars.offerId, vars.status, vars.note),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["application", applicationId],
      });
      queryClient.invalidateQueries({ queryKey: ["borrower"] });
    },
  });

  const uploadDocMutation = useMutation({
    mutationFn: (vars: { documentType: BorrowerDocumentType; uri: string; name: string; mimeType?: string }) =>
      uploadBorrowerDocument(vars.documentType, vars),
    onSuccess: () => {
      // A newly-uploaded document can be exactly what this application's
      // offers were waiting on — refresh so each accept-gate re-evaluates.
      queryClient.invalidateQueries({ queryKey: ["application", applicationId] });
    },
  });

  const customDocMutation = useMutation({
    mutationFn: (vars: {
      label: string;
      textResponse?: string;
      file?: { uri: string; name: string; mimeType?: string };
    }) => submitCustomDocumentResponse(applicationId, vars.label, vars),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["application", applicationId] });
    },
  });

  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [uploadingCustomLabel, setUploadingCustomLabel] = useState<string | null>(null);

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

  const uploadCustomDocument = async (label: string) => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "image/*"],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setUploadingCustomLabel(label);
    try {
      await customDocMutation.mutateAsync({
        label,
        file: { uri: asset.uri, name: asset.name, mimeType: asset.mimeType },
      });
    } finally {
      setUploadingCustomLabel(null);
    }
  };

  const saveCustomDocumentText = (label: string, text: string) => {
    customDocMutation.mutate({ label, textResponse: text });
  };

  return {
    application,
    offers: application?.offers ?? [],
    isLoading,
    error,
    refetch,
    respondToOffer: (offerId: string, status: "accepted" | "declined", note?: string) =>
      respondMutation.mutateAsync({ offerId, status, note }),
    responding: respondMutation.isPending,
    uploadRequiredDocument,
    uploadingDocumentType: uploadingType,
    uploadCustomDocument,
    saveCustomDocumentText,
    uploadingCustomLabel,
  };
}

/** Every offer the borrower has ever received, across every application —
 * the "Browse Offers" screen's default view when opened with no specific
 * request selected. Read-only (no accept/decline here); each row links
 * into useOffersViewModel(applicationId) for the real accept/document flow. */
export function useAllOffersViewModel() {
  const { data: offers = [], isLoading, error } = useQuery({
    queryKey: ["borrower", "offers-received", "all"],
    queryFn: fetchAllOffersReceived,
  });

  const bestOfferId = offers.reduce<string | null>((bestId, o) => {
    if (o.status !== "pending") return bestId;
    if (!bestId) return o.id;
    const best = offers.find((x) => x.id === bestId);
    return best && o.interestRate < best.interestRate ? o.id : bestId;
  }, null);

  return { offers, isLoading, error, bestOfferId };
}
