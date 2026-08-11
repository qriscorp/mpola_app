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

// Mirrors the borrower apply wizard's durationOptions exactly
// (useApplyViewModel.ts) so a lender's max_duration can be set to any
// value a borrower could actually request.
export const DURATION_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24];
// Mirrors the borrower apply wizard's emergencyDayPresets exactly — a
// day-based standing offer's maxDurationDays should use the same range.
export const DAY_PRESET_OPTIONS = [1, 3, 7, 14];

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
  const [durationUnit, setDurationUnit] = useState<"months" | "days">("months");
  const [maxDuration, setMaxDuration] = useState(6);
  const [maxDurationDays, setMaxDurationDays] = useState<number | null>(DAY_PRESET_OPTIONS[0]);
  const [customDays, setCustomDays] = useState("");
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
    if (editingTemplate.maxDurationDays != null) {
      setDurationUnit("days");
      setMaxDurationDays(editingTemplate.maxDurationDays);
      if (!DAY_PRESET_OPTIONS.includes(editingTemplate.maxDurationDays)) {
        setCustomDays(String(editingTemplate.maxDurationDays));
      }
    } else if (editingTemplate.maxDuration != null) {
      setDurationUnit("months");
      setMaxDuration(editingTemplate.maxDuration);
    }
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

  const selectDayPreset = (d: number) => {
    setMaxDurationDays(d);
    setCustomDays("");
  };

  const setCustomDurationDays = (v: string) => {
    setCustomDays(v);
    if (v === "") {
      setMaxDurationDays(null);
      return;
    }
    const n = parseInt(v, 10);
    setMaxDurationDays(!Number.isNaN(n) && n >= 1 && n <= 29 ? n : null);
  };

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
  const rateInvalid = interestRate !== "" && (Number(interestRate) < 0.1 || Number(interestRate) > 25);
  const durationInvalid = durationUnit === "days" && maxDurationDays == null;

  const buildFields = () => ({
    maxAmount: Number(maxAmount),
    minAmount: Number(minAmount),
    interestRate: Number(interestRate),
    maxDuration: durationUnit === "months" ? maxDuration : null,
    maxDurationDays: durationUnit === "days" ? maxDurationDays : null,
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
      if (interestRate === "" || rateInvalid) {
        throw new Error("Interest rate must be between 0.1% and 25%");
      }
      if (durationInvalid) {
        throw new Error("Enter a valid custom duration between 1 and 29 days");
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
      if (interestRate === "" || rateInvalid) {
        throw new Error("Interest rate must be between 0.1% and 25%");
      }
      if (durationInvalid) {
        throw new Error("Enter a valid custom duration between 1 and 29 days");
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
    rateInvalid,
    durationUnit,
    setDurationUnit,
    maxDuration,
    setMaxDuration,
    maxDurationDays,
    selectDayPreset,
    customDays,
    setCustomDurationDays,
    durationInvalid,
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
