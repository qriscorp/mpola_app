import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import * as DocumentPicker from "expo-document-picker";
import type { LoanType, ApplicationStep, Document } from "../models";
import { submitLoanApplication, searchGuarantorCandidate, attachGuarantors, uploadLoanDocument } from "../services";
import { loanDetailsSchema } from "../validation";

interface StagedGuarantor {
  userId: string;
  fullName: string | null;
  username: string;
}

interface PickedFile {
  uri: string;
  name: string;
  mimeType?: string;
}

// Matches mpola_api's default platform rate (routers/loans.py: rate = 3.0, % per month).
const PLATFORM_RATE_PER_MONTH = 3;

export function useApplyViewModel() {
  const [step, setStep] = useState<ApplicationStep>(1);
  const [amount, setAmount] = useState("2000000");
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

  // Documents — picked locally, uploaded once the application is created.
  const [pickedFiles, setPickedFiles] = useState<Record<string, PickedFile>>(
    {},
  );
  // Genuinely loan-specific documents — identity (national_id, passport,
  // profile_photo, proof_of_address) is handled entirely by
  // KYCUploadSection, reusing whatever's already verified on the account.
  const [documents, setDocuments] = useState<Document[]>([
    {
      id: "d1",
      type: "bank_statement",
      name: "Bank Statement (3 months)",
      status: "pending",
      required: false,
    },
    {
      id: "d2",
      type: "business_registration",
      name: "Business Registration",
      status: "pending",
      required: false,
    },
  ]);

  // Guarantors — found by email+phone search and staged locally, attached
  // to the application (as real Guarantor rows, which fire a real-time
  // request to each) once it's created.
  const [guarantors, setGuarantors] = useState<StagedGuarantor[]>([]);
  const [guarantorError, setGuarantorError] = useState<string | null>(null);
  const [searchingGuarantor, setSearchingGuarantor] = useState(false);

  const numAmount = Number(amount) || 0;
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

  const nextStep = () => {
    if (step === 1 && !validateDetails()) return;
    setStep((s) => Math.min(s + 1, 4) as ApplicationStep);
  };
  const prevStep = () => setStep((s) => Math.max(s - 1, 1) as ApplicationStep);

  const uploadDocument = async (docId: string) => {
    const doc = documents.find((d) => d.id === docId);
    if (!doc) return;

    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "image/*"],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    setPickedFiles((prev) => ({
      ...prev,
      [doc.type]: {
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType,
      },
    }));
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === docId ? { ...d, status: "uploaded" as const } : d,
      ),
    );
  };

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
      const res = await submitLoanApplication({
        amount: numAmount,
        duration,
        loanType,
        purpose: purpose || undefined,
        maxInterestRate: maxInterestRate ? Number(maxInterestRate) : undefined,
        validUntil: validUntil || undefined,
      });
      await Promise.all([
        attachGuarantors(res.applicationId, guarantors.map((g) => g.userId)),
        ...Object.entries(pickedFiles).map(([documentType, file]) =>
          uploadLoanDocument(res.applicationId, file, documentType),
        ),
      ]);
      return res;
    },
  });

  const submitApplication = async () => {
    return submitMutation.mutateAsync();
  };

  return {
    step,
    setStep,
    nextStep,
    prevStep,
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
    documents,
    uploadDocument,
    guarantors,
    addGuarantorByContact,
    removeGuarantor,
    guarantorError,
    searchingGuarantor,
    interestRate: PLATFORM_RATE_PER_MONTH,
    monthlyPayment,
    totalRepayable,
    detailsErrors,
    submitting: submitMutation.isPending,
    submitApplication,
  };
}
