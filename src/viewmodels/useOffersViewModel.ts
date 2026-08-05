import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchApplications,
  fetchApplicationDetail,
  respondToOffer,
} from "../services";

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

  return {
    application,
    offers: application?.offers ?? [],
    isLoading,
    error,
    refetch,
    respondToOffer: (offerId: string, status: "accepted" | "declined") =>
      respondMutation.mutateAsync({ offerId, status }),
    responding: respondMutation.isPending,
  };
}
