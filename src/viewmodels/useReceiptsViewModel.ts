import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchMyRepayments, downloadRepaymentReceipt } from "../services";

const PAGE_SIZE = 20;

export function useReceiptsViewModel() {
  const [page, setPage] = useState(0);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["borrower", "repayments", page],
    queryFn: () => fetchMyRepayments(page * PAGE_SIZE, PAGE_SIZE),
  });

  const repayments = data?.repayments ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const download = async (repaymentId: string) => {
    setDownloadingId(repaymentId);
    try {
      await downloadRepaymentReceipt(repaymentId);
    } finally {
      setDownloadingId(null);
    }
  };

  return {
    repayments,
    isLoading,
    page,
    setPage,
    totalPages,
    download,
    downloadingId,
  };
}
