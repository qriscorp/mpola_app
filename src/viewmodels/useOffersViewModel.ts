import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchBorrowerOffers,
  acceptOffer as apiAcceptOffer,
} from "../services";

export function useOffersViewModel() {
  const queryClient = useQueryClient();

  const {
    data: offers = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["borrower", "offers"],
    queryFn: fetchBorrowerOffers,
  });

  const acceptMutation = useMutation({
    mutationFn: apiAcceptOffer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["borrower"] });
    },
  });

  const acceptOffer = (offerId: string) => acceptMutation.mutateAsync(offerId);

  return {
    offers,
    isLoading,
    error,
    refetch,
    acceptOffer,
    accepting: acceptMutation.isPending,
  };
}
