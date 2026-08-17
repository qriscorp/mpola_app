import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchProfile, updateProfile, apiSignOut, signLenderAgreement } from "../services";
import { router } from "expo-router";

export function useProfileViewModel() {
  const queryClient = useQueryClient();

  const { data: profile, isLoading, error, refetch } = useQuery({
    queryKey: ["profile"],
    queryFn: fetchProfile,
  });

  const updateMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile"] }),
  });

  const signAgreementMutation = useMutation({
    mutationFn: signLenderAgreement,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile"] }),
  });

  async function signOut() {
    await apiSignOut();
    // Every query (profile, wallet, dashboard stats, active loan, etc.) is
    // still sitting in the cache at this point — React Query's 5-minute
    // staleTime (see app/_layout.tsx) means it'd be shown as-is to whoever
    // logs in next, borrower or lender, real account or not, until it
    // happened to refetch. Clearing it here guarantees the next session
    // starts from nothing cached, not the previous user's data.
    queryClient.clear();
    router.replace("/sign-in");
  }

  return {
    profile,
    isLoading,
    error,
    refetch,
    updateProfile: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    signAgreement: signAgreementMutation.mutate,
    isSigningAgreement: signAgreementMutation.isPending,
    signOut,
  };
}
