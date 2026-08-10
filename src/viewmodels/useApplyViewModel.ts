import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { LoanType, ApplicationStep } from "../models";
import {
  submitLoanApplication,
  updateApplication,
  deleteApplication,
  fetchDraftApplication,
  searchGuarantorCandidate,
  attachGuarantors,
} from "../services";
import { loanDetailsSchema } from "../validation";

interface StagedGuarantor {
  userId: string;
  fullName: string | null;
  username: string;
}

// Matches mpola_api's default platform rate (routers/loans.py: rate = 3.0, % per month).
const PLATFORM_RATE_PER_MONTH = 3;

export function useApplyViewModel() {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<ApplicationStep>(1);

  // Once step 1 completes, this is a REAL application id — every step after
  // that saves directly against it, so leaving and coming back resumes from
  // real, persisted data instead of local-only state a reload would wipe.
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [referenceNumber, setReferenceNumber] = useState<string | null>(null);
  const [resumedFromDraft, setResumedFromDraft] = useState(false);
  // True until the resume check has actually run (not just until the query
  // resolves) — otherwise the wizard would paint a blank Step 1 for one
  // frame before the hydration effect fires and jumps to the real step.
  const [resuming, setResuming] = useState(true);
  const hydratedRef = useRef(false);

  const [amount, setAmount] = useState("");
  const [duration, setDuration] = useState(6);
  const [loanType, setLoanType] = useState<LoanType>("personal");
  const [purpose, setPurpose] = useState("");
  const [maxInterestRate, setMaxInterestRate] = useState("");
  // null = no deadline (default). Set via a preset picker (e.g. "3 days",
  // "1 week") rather than a native date picker — matches the pattern used
  // for lender offer template expiry.
  const [validUntil, setValidUntil] = useState<string | null>(null);
  const [detailsErrors, setDetailsErrors] = useState<Record<string, string>>(
    {},
  );

  // Guarantors — found by email+phone search and staged locally, attached
  // to the application (as real Guarantor rows, which fire a real-time
  // request to each) only at final submission, not before. There's no
  // documents step anymore — each lender's offer lists what it needs, and
  // the borrower provides those when accepting a specific offer.
  const [guarantors, setGuarantors] = useState<StagedGuarantor[]>([]);
  const [guarantorError, setGuarantorError] = useState<string | null>(null);
  const [searchingGuarantor, setSearchingGuarantor] = useState(false);

  const { data: draft, isLoading: draftLoading } = useQuery({
    queryKey: ["borrower", "apply-draft"],
    queryFn: fetchDraftApplication,
  });

  // Resume-where-you-left-off: runs once, the first time the draft check
  // resolves. An application that exists but has no guarantors attached
  // yet is, by definition, an unfinished draft — everything about it is
  // already real, persisted data, so resuming is just loading it in,
  // straight to Guarantors (there's no documents step to check anymore).
  useEffect(() => {
    if (draftLoading || hydratedRef.current) return;
    hydratedRef.current = true;
    if (draft) {
      setApplicationId(draft.id);
      setReferenceNumber(draft.referenceNumber);
      setResumedFromDraft(true);
      setAmount(String(draft.amount));
      setDuration(draft.duration);
      setLoanType(draft.loanType);
      setPurpose(draft.purpose ?? "");
      setMaxInterestRate(draft.maxInterestRate != null ? String(draft.maxInterestRate) : "");
      setValidUntil(draft.validUntil);
      setStep(2);
    }
    setResuming(false);
  }, [draft, draftLoading]);

  const numAmount = Number(amount) || 0;
  const step1Valid = amount.trim() !== "" && numAmount >= 1000 && numAmount <= 50000000;
  const totalInterest = numAmount * (PLATFORM_RATE_PER_MONTH / 100) * duration;
  const totalRepayable = numAmount + totalInterest;
  const monthlyPayment = duration > 0 ? Math.round(totalRepayable / duration) : 0;

  const durationOptions = [3, 6, 12, 18, 24];
  const loanTypes: LoanType[] = [
    "personal",
    "business",
    "education",
    "agricultural",
    "emergency",
  ];

  const validateDetails = () => {
    const result = loanDetailsSchema.safeParse({ amount, duration, loanType });
    if (!result.success) {
      const errs: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as string;
        if (!errs[key]) errs[key] = issue.message;
      }
      setDetailsErrors(errs);
      return false;
    }
    setDetailsErrors({});
    return true;
  };

  const saveStep1Mutation = useMutation({
    mutationFn: async () => {
      if (applicationId) {
        await updateApplication(applicationId, {
          amount: numAmount,
          duration,
          loanType,
          purpose,
          maxInterestRate: maxInterestRate ? Number(maxInterestRate) : null,
          validUntil,
        });
        return { applicationId, referenceNumber: referenceNumber! };
      }
      const res = await submitLoanApplication({
        amount: numAmount,
        duration,
        loanType,
        purpose: purpose || undefined,
        maxInterestRate: maxInterestRate ? Number(maxInterestRate) : undefined,
        validUntil: validUntil || undefined,
      });
      return res;
    },
  });

  const nextStep = async () => {
    if (step === 1) {
      if (!validateDetails()) return;
      const res = await saveStep1Mutation.mutateAsync();
      setApplicationId(res.applicationId);
      setReferenceNumber(res.referenceNumber);
      setStep(2);
      return;
    }
    setStep((s) => Math.min(s + 1, 3) as ApplicationStep);
  };
  const prevStep = () => setStep((s) => Math.max(s - 1, 1) as ApplicationStep);

  // Returns whether the add succeeded — the caller (the screen) uses this
  // return value to decide whether to clear its inputs, rather than reading
  // `guarantorError` state right after awaiting, which can still reflect
  // the previous render (React doesn't guarantee the state update from
  // inside this function is visible synchronously to the caller).
  const addGuarantorByContact = async (email: string, phone: string): Promise<boolean> => {
    setGuarantorError(null);
    if (guarantors.length >= 2) return false;
    setSearchingGuarantor(true);
    try {
      const candidate = await searchGuarantorCandidate(email, `+256${phone}`);
      if (guarantors.some((g) => g.userId === candidate.id)) {
        setGuarantorError("Already added as a guarantor.");
        return false;
      }
      setGuarantors((prev) => [
        ...prev,
        { userId: candidate.id, fullName: candidate.fullName, username: candidate.username },
      ]);
      return true;
    } catch (e) {
      setGuarantorError(e instanceof Error ? e.message : "No account found matching that email and phone");
      return false;
    } finally {
      setSearchingGuarantor(false);
    }
  };

  const removeGuarantor = (userId: string) => {
    setGuarantors((prev) => prev.filter((g) => g.userId !== userId));
  };

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!applicationId || !referenceNumber) {
        throw new Error("Something went wrong — please go back to step 1 and try again.");
      }
      await attachGuarantors(applicationId, guarantors.map((g) => g.userId));
      return { applicationId, referenceNumber };
    },
  });

  const submitApplication = async () => {
    return submitMutation.mutateAsync();
  };

  const discardMutation = useMutation({
    mutationFn: async () => {
      if (applicationId) await deleteApplication(applicationId);
    },
    onSuccess: () => {
      setApplicationId(null);
      setReferenceNumber(null);
      setResumedFromDraft(false);
      setAmount("");
      setDuration(6);
      setLoanType("personal");
      setPurpose("");
      setMaxInterestRate("");
      setValidUntil(null);
      setGuarantors([]);
      setStep(1);
      queryClient.invalidateQueries({ queryKey: ["borrower", "apply-draft"] });
    },
  });

  return {
    step,
    setStep,
    nextStep,
    prevStep,
    step1Valid,
    resuming,
    resumedFromDraft,
    applicationId,
    discardDraft: discardMutation.mutateAsync,
    discardingDraft: discardMutation.isPending,
    amount,
    setAmount,
    duration,
    setDuration,
    durationOptions,
    loanType,
    setLoanType,
    loanTypes,
    purpose,
    setPurpose,
    maxInterestRate,
    setMaxInterestRate,
    validUntil,
    setValidUntil,
    guarantors,
    addGuarantorByContact,
    removeGuarantor,
    guarantorError,
    searchingGuarantor,
    interestRate: PLATFORM_RATE_PER_MONTH,
    monthlyPayment,
    totalRepayable,
    detailsErrors,
    savingStep1: saveStep1Mutation.isPending,
    submitting: submitMutation.isPending,
    submitApplication,
  };
}
