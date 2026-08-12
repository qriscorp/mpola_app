import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchMyOfferTemplates,
  fetchOfferTemplateMatches,
  deleteOfferTemplate,
  freezeMyOfferTemplate,
  unfreezeMyOfferTemplate,
  extendOfferTemplateExpiry,
} from "../services";

export function useMyOfferTemplatesViewModel() {
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading, error, refetch } = useQuery({
    queryKey: ["lender", "offer-templates"],
    queryFn: fetchMyOfferTemplates,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["lender", "offer-templates"] });

  const deleteMutation = useMutation({
    mutationFn: deleteOfferTemplate,
    onSuccess: invalidate,
  });
  const freezeMutation = useMutation({
    mutationFn: freezeMyOfferTemplate,
    onSuccess: invalidate,
  });
  const unfreezeMutation = useMutation({
    mutationFn: unfreezeMyOfferTemplate,
    onSuccess: invalidate,
  });
  const extendExpiryMutation = useMutation({
    mutationFn: ({ id, validUntil }: { id: string; validUntil: string | null }) =>
      extendOfferTemplateExpiry(id, validUntil),
    onSuccess: invalidate,
  });

  return {
    templates,
    isLoading,
    error,
    refetch,
    deleteTemplate: deleteMutation.mutateAsync,
    freezeTemplate: freezeMutation.mutateAsync,
    unfreezeTemplate: unfreezeMutation.mutateAsync,
    extendExpiry: extendExpiryMutation.mutateAsync,
    isMutating:
      deleteMutation.isPending ||
      freezeMutation.isPending ||
      unfreezeMutation.isPending ||
      extendExpiryMutation.isPending,
    isExtendingExpiry: extendExpiryMutation.isPending,
  };
}

export function useOfferTemplateMatchesViewModel(templateId: string, enabled: boolean) {
  const { data: matches = [], isLoading } = useQuery({
    queryKey: ["lender", "offer-templates", templateId, "matches"],
    queryFn: () => fetchOfferTemplateMatches(templateId),
    enabled,
  });

  return { matches, isLoading };
}
