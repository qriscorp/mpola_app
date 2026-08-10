import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as DocumentPicker from "expo-document-picker";
import {
  fetchApplications,
  fetchApplicationDetail,
  respondToOffer,
  uploadBorrowerDocument,
} from "../services";
import type { BorrowerDocumentType } from "../services";

export function useOffersViewModel(applicationId?: string) {
  const queryClient = useQueryClient();

  const { data: applications } = useQuery({
    queryKey: ["borrower", "applications"],
    queryFn: fetchApplications,
    enabled: !applicationId,
  });

  // No specific application passed in (e.g. a generic "Browse Offers" quick
  // action) — default to the borrower's most recent pending application.
  const resolvedApplicationId =
    applicationId ??
    applications?.find((a) => a.status === "pending")?.id;

  const {
    data: application,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["application", resolvedApplicationId],
    queryFn: () => fetchApplicationDetail(resolvedApplicationId as string),
    enabled: !!resolvedApplicationId,
  });

  const respondMutation = useMutation({
    mutationFn: (vars: { offerId: string; status: "accepted" | "declined" }) =>
      respondToOffer(vars.offerId, vars.status),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["application", resolvedApplicationId],
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
      queryClient.invalidateQueries({ queryKey: ["application", resolvedApplicationId] });
    },
  });

  const [uploadingType, setUploadingType] = useState<string | null>(null);

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
    application,
    offers: application?.offers ?? [],
    isLoading,
    error,
    refetch,
    respondToOffer: (offerId: string, status: "accepted" | "declined") =>
      respondMutation.mutateAsync({ offerId, status }),
    responding: respondMutation.isPending,
    uploadRequiredDocument,
    uploadingDocumentType: uploadingType,
  };
}
