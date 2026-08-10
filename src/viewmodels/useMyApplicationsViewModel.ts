import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchApplications,
  remindGuarantor,
  replaceGuarantor,
  searchGuarantorCandidate,
} from "../services";

export function useMyApplicationsViewModel() {
  const qc = useQueryClient();

  const { data: applications = [], isLoading, refetch } = useQuery({
    queryKey: ["borrower", "my-applications"],
    queryFn: fetchApplications,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["borrower", "my-applications"] });

  const remindMutation = useMutation({
    mutationFn: (guarantorId: string) => remindGuarantor(guarantorId),
  });

  const replaceMutation = useMutation({
    mutationFn: ({
      applicationId,
      guarantorId,
      newGuarantorUserId,
    }: {
      applicationId: string;
      guarantorId: string;
      newGuarantorUserId: string;
    }) => replaceGuarantor(applicationId, guarantorId, newGuarantorUserId),
    onSuccess: invalidate,
  });

  const replaceGuarantorByContact = async (
    applicationId: string,
    guarantorId: string,
    email: string,
    phone: string,
  ) => {
    const candidate = await searchGuarantorCandidate(email, `+256${phone}`);
    return replaceMutation.mutateAsync({ applicationId, guarantorId, newGuarantorUserId: candidate.id });
  };

  return {
    applications,
    isLoading,
    refetch,
    remindGuarantor: remindMutation.mutateAsync,
    isReminding: remindMutation.isPending,
    replaceGuarantorByContact,
    isReplacing: replaceMutation.isPending,
  };
}
