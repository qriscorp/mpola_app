import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createOfferTemplate,
  updateOfferTemplate,
  fetchMyOfferTemplates,
} from "../services";

export const LOAN_TYPE_OPTIONS = [
  "business",
  "personal",
  "agricultural",
  "emergency",
  "education",
  "asset finance",
  "salary advance",
];

export const DOCUMENT_OPTIONS = [
  "National ID",
  "Bank Statement (3mo)",
  "Payslip / Business Proof",
  "Land Title",
  "URA TIN",
];

export const DURATION_OPTIONS = [1, 2, 3, 6, 12, 18, 24];

/** Shared create/edit form for a lender's standing offer. Pass an
 * `editId` to load and prefill an existing template (only editable while
 * it's still pending_review — see routers/loans.py's update_offer_template). */
export function usePostOfferViewModel(editId?: string) {
  const queryClient = useQueryClient();
  const { data: templates } = useQuery({
    queryKey: ["lender", "offer-templates"],
    queryFn: fetchMyOfferTemplates,
    enabled: !!editId,
  });
  const editingTemplate = editId ? templates?.find((t) => t.id === editId) : undefined;
  const isEditing = !!editId;
  // True while editing an existing offer whose data (and therefore the
  // prefilled form) hasn't loaded yet — block submission during this window,
  // since submitting now would overwrite the template with the form's
  // still-default values instead of the user's real edits.
  const editDataLoading = isEditing && !editingTemplate;

  const [maxAmount, setMaxAmount] = useState("50000000");
  const [minAmount, setMinAmount] = useState("1000");
  const [interestRate, setInterestRate] = useState("2");
  const [maxDuration, setMaxDuration] = useState(6);
  const [acceptedLoanTypes, setAcceptedLoanTypes] = useState<string[]>([
    "business",
    "personal",
    "emergency",
  ]);
  const [requiredDocuments, setRequiredDocuments] = useState<string[]>([
    "National ID",
    "Bank Statement (3mo)",
  ]);
  const [description, setDescription] = useState("");
  const [maxConcurrentLoans, setMaxConcurrentLoans] = useState("10");
  const [prefilled, setPrefilled] = useState(false);

  useEffect(() => {
    if (!editingTemplate || prefilled) return;
    setMaxAmount(String(editingTemplate.maxAmount));
    setMinAmount(String(editingTemplate.minAmount));
    setInterestRate(String(editingTemplate.interestRate));
    setMaxDuration(editingTemplate.maxDuration);
    setAcceptedLoanTypes(editingTemplate.acceptedLoanTypes);
    setRequiredDocuments(editingTemplate.requiredDocuments);
    setDescription(editingTemplate.description ?? "");
    setMaxConcurrentLoans(
      editingTemplate.maxConcurrentLoans != null
        ? String(editingTemplate.maxConcurrentLoans)
        : "",
    );
    setPrefilled(true);
  }, [editingTemplate, prefilled]);

  const toggleLoanType = (t: string) => {
    setAcceptedLoanTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    );
  };

  const toggleDocument = (d: string) => {
    setRequiredDocuments((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d],
    );
  };

  const amountRangeInvalid =
    minAmount !== "" && maxAmount !== "" && Number(minAmount) >= Number(maxAmount);

  const buildFields = () => ({
    maxAmount: Number(maxAmount),
    minAmount: Number(minAmount),
    interestRate: Number(interestRate),
    maxDuration,
    acceptedLoanTypes,
    requiredDocuments,
    description: description || undefined,
    maxConcurrentLoans: maxConcurrentLoans ? Number(maxConcurrentLoans) : undefined,
  });

  const createMutation = useMutation({
    mutationFn: (isDraft: boolean) => {
      if (amountRangeInvalid) {
        throw new Error("Min loan amount must be less than max loan amount");
      }
      return createOfferTemplate({ ...buildFields(), isDraft });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["lender", "offer-templates"] }),
  });

  const updateMutation = useMutation({
    mutationFn: () => {
      if (amountRangeInvalid) {
        throw new Error("Min loan amount must be less than max loan amount");
      }
      return updateOfferTemplate(editId!, buildFields());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["lender", "offer-templates"] }),
  });

  return {
    isEditing,
    editDataLoading,
    maxAmount,
    setMaxAmount,
    minAmount,
    setMinAmount,
    amountRangeInvalid,
    interestRate,
    setInterestRate,
    maxDuration,
    setMaxDuration,
    acceptedLoanTypes,
    toggleLoanType,
    requiredDocuments,
    toggleDocument,
    description,
    setDescription,
    maxConcurrentLoans,
    setMaxConcurrentLoans,
    submitCreate: createMutation.mutateAsync,
    submitUpdate: updateMutation.mutateAsync,
    submitting: createMutation.isPending || updateMutation.isPending,
  };
}
