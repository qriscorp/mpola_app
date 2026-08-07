import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchMyOfferTemplates,
  deleteOfferTemplate,
  freezeMyOfferTemplate,
  unfreezeMyOfferTemplate,
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

  return {
    templates,
    isLoading,
    error,
    refetch,
    deleteTemplate: deleteMutation.mutateAsync,
    freezeTemplate: freezeMutation.mutateAsync,
    unfreezeTemplate: unfreezeMutation.mutateAsync,
    isMutating:
      deleteMutation.isPending || freezeMutation.isPending || unfreezeMutation.isPending,
  };
}
