import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchDisbursementQueue,
  approveDisbursement,
  batchApproveDisbursement,
} from "../services";

export function useDisbursementViewModel() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const {
    data: queue,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["lender", "disbursement-queue"],
    queryFn: fetchDisbursementQueue,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["lender", "disbursement-queue"] });
    queryClient.invalidateQueries({ queryKey: ["lender", "portfolio"] });
    queryClient.invalidateQueries({ queryKey: ["lender", "earnings"] });
    queryClient.invalidateQueries({ queryKey: ["lender", "wallet"] });
  };

  const approveMutation = useMutation({
    mutationFn: approveDisbursement,
    onSuccess: invalidateAll,
  });

  const batchMutation = useMutation({
    mutationFn: batchApproveDisbursement,
    onSuccess: invalidateAll,
  });

  const pending = queue?.pending ?? [];
  const selected = pending.find((l) => l.id === selectedId) ?? pending[0];

  return {
    queue,
    pending,
    selected,
    selectedId: selected?.id ?? null,
    setSelectedId,
    isLoading,
    error,
    refetch,
    approve: approveMutation.mutateAsync,
    approving: approveMutation.isPending,
    approvingLoanId: approveMutation.variables,
    batchApprove: batchMutation.mutateAsync,
    batchApproving: batchMutation.isPending,
  };
}
