import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { LoanType, ApplicationStep } from "../models";
import {
  submitLoanApplication,
  updateApplication,
  deleteApplication,
  fetchDraftApplication,
  fetchApplicationEligibility,
  searchGuarantorCandidate,
  attachGuarantors,
} from "../services";
import { makeLoanDetailsSchema } from "../validation";

interface StagedGuarantor {
  userId: string;
  fullName: string | null;
  username: string;
}

interface ApplyPrefill {
  loanType?: string;
  maxInterestRate?: string;
  duration?: string;
  durationDays?: string;
}

export function useApplyViewModel(prefill?: ApplyPrefill) {
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
  const [durationDays, setDurationDays] = useState<number | null>(null);
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

  const { data: eligibility, isLoading: eligibilityLoading } = useQuery({
    queryKey: ["borrower", "apply-eligibility"],
    queryFn: fetchApplicationEligibility,
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
      if (draft.durationDays != null) {
        setDurationDays(draft.durationDays);
      } else if (draft.duration != null) {
        setDuration(draft.duration);
      }
      setLoanType(draft.loanType);
      setPurpose(draft.purpose ?? "");
      setMaxInterestRate(draft.maxInterestRate != null ? String(draft.maxInterestRate) : "");
      setValidUntil(draft.validUntil);
      setStep(2);
    } else if (prefill) {
      // No draft to resume — if we arrived from "Apply to This Offer" on a
      // browsed lender's standing offer (browse-offer-detail.tsx), pre-fill
      // Step 1 with that offer's terms. Purely a convenience default: this
      // still submits through the normal broadcast auto-match flow, not a
      // targeted application to that one lender.
      const validLoanTypes: LoanType[] = ["personal", "business", "education", "agricultural", "emergency"];
      if (prefill.loanType && validLoanTypes.includes(prefill.loanType as LoanType)) {
        setLoanType(prefill.loanType as LoanType);
      }
      if (prefill.maxInterestRate) setMaxInterestRate(prefill.maxInterestRate);
      // durationDays only means anything once loanType is "emergency" (see
      // isEmergency below, which gates the day-picker UI and the submit
      // payload) — a lender can independently set day-based duration on a
      // non-emergency-typed offer, so only trust it here when the browsed
      // offer's own loan type was itself "emergency".
      if (prefill.loanType === "emergency" && prefill.durationDays) {
        setDurationDays(Number(prefill.durationDays));
      } else if (prefill.duration) {
        setDuration(Number(prefill.duration));
      }
    }
    setResuming(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, draftLoading]);

  const isEmergency = loanType === "emergency";
  const emergencyDayPresets = [1, 3, 7, 14];
  const numAmount = Number(amount) || 0;
  // Live, admin-configured bounds (Settings > Min/Max Loan Amount) — the
  // fallback only covers the moment before eligibility resolves; the wizard
  // gates on eligibilityLoading before rendering Step 1, so real form
  // interaction always happens against real numbers.
  const minAmount = eligibility?.minAmount ?? 1000;
  const maxAmount = eligibility?.maxAmount ?? 50000000;
  const maxRateInvalid =
    maxInterestRate.trim() !== "" &&
    (Number(maxInterestRate) < 0.1 || Number(maxInterestRate) > 25);
  const hasRateCap = maxInterestRate.trim() !== "";
  // Zero, not the platform-average placeholder — until the borrower actually
  // types a rate cap, there's nothing real to estimate against, and showing
  // a fabricated number here reads as "the app already decided my rate."
  const displayRate = hasRateCap ? Number(maxInterestRate) : 0;
  const step1Valid =
    amount.trim() !== "" &&
    numAmount >= minAmount &&
    numAmount <= maxAmount &&
    !maxRateInvalid &&
    (isEmergency ? durationDays != null : duration > 0);
  const totalInterest = isEmergency
    ? numAmount * (displayRate / 100) * ((durationDays ?? 0) / 30)
    : numAmount * (displayRate / 100) * duration;
  const totalRepayable = numAmount + totalInterest;
  const monthlyPayment = isEmergency
    ? Math.round(totalRepayable)
    : duration > 0
      ? Math.round(totalRepayable / duration)
      : 0;

  const durationOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24];
  const loanTypes: LoanType[] = [
    "personal",
    "business",
    "education",
    "agricultural",
    "emergency",
  ];

  // Switching loan type resets duration to that mode's default rather than
  // leaving a stale value from the other mode — mirrors the website wizard.
  const selectLoanType = (t: LoanType) => {
    setLoanType(t);
    if (t === "emergency") {
      setDurationDays((d) => d ?? emergencyDayPresets[0]);
    } else {
      setDurationDays(null);
      setDuration((d) => d || 6);
    }
  };

  const validateDetails = () => {
    const result = makeLoanDetailsSchema(minAmount, maxAmount).safeParse({
      amount,
      duration: isEmergency ? null : duration,
      durationDays: isEmergency ? durationDays : null,
      loanType,
    });
    const errs: Record<string, string> = {};
    if (!result.success) {
      for (const issue of result.error.issues) {
        const key = issue.path[0] as string;
        if (!errs[key]) errs[key] = issue.message;
      }
    }
    if (maxRateInvalid) {
      errs.maxInterestRate = "Must be between 0.1% and 25%, or left blank";
    }
    setDetailsErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const saveStep1Mutation = useMutation({
    mutationFn: async () => {
      if (applicationId) {
        await updateApplication(applicationId, {
          amount: numAmount,
          duration: isEmergency ? null : duration,
          durationDays: isEmergency ? durationDays : null,
          loanType,
          purpose,
          maxInterestRate: maxInterestRate ? Number(maxInterestRate) : null,
          validUntil,
        });
        return { applicationId, referenceNumber: referenceNumber! };
      }
      const res = await submitLoanApplication({
        amount: numAmount,
        duration: isEmergency ? undefined : duration,
        durationDays: isEmergency ? durationDays ?? undefined : undefined,
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
      setDurationDays(null);
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
    eligibility,
    eligibilityLoading,
    minAmount,
    maxAmount,
    applicationId,
    discardDraft: discardMutation.mutateAsync,
    discardingDraft: discardMutation.isPending,
    amount,
    setAmount,
    duration,
    setDuration,
    durationDays,
    setDurationDays,
    durationOptions,
    emergencyDayPresets,
    isEmergency,
    loanType,
    setLoanType: selectLoanType,
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
    interestRate: displayRate,
    hasRateCap,
    monthlyPayment,
    totalRepayable,
    detailsErrors,
    savingStep1: saveStep1Mutation.isPending,
    submitting: submitMutation.isPending,
    submitApplication,
  };
}
