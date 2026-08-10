import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchApplications,
  remindGuarantor,
  replaceGuarantor,
  searchGuarantorCandidate,
  updateApplication,
  deleteApplication,
  freezeApplication,
  unfreezeApplication,
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

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<{
        amount: number;
        duration: number;
        loanType: string;
        purpose: string;
        maxInterestRate: number | null;
        validUntil: string | null;
      }>;
    }) => updateApplication(id, data),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteApplication(id),
    onSuccess: invalidate,
  });

  const freezeMutation = useMutation({
    mutationFn: (id: string) => freezeApplication(id),
    onSuccess: invalidate,
  });

  const unfreezeMutation = useMutation({
    mutationFn: (id: string) => unfreezeApplication(id),
    onSuccess: invalidate,
  });

  return {
    applications,
    isLoading,
    refetch,
    remindGuarantor: remindMutation.mutateAsync,
    isReminding: remindMutation.isPending,
    replaceGuarantorByContact,
    isReplacing: replaceMutation.isPending,
    updateApplication: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteApplication: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    freezeApplication: freezeMutation.mutateAsync,
    isFreezing: freezeMutation.isPending,
    unfreezeApplication: unfreezeMutation.mutateAsync,
    isUnfreezing: unfreezeMutation.isPending,
  };
}
