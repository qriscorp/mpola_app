import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchProfile, updateProfile, apiSignOut } from "../services";
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

  async function signOut() {
    await apiSignOut();
    router.replace("/sign-in");
  }

  return {
    profile,
    isLoading,
    error,
    refetch,
    updateProfile: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    signOut,
  };
}
