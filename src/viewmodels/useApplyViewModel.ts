import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import * as DocumentPicker from "expo-document-picker";
import type { LoanType, ApplicationStep, Document, Guarantor } from "../models";
import { submitLoanApplication, addGuarantor, uploadLoanDocument } from "../services";
import { loanDetailsSchema } from "../validation";

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
  const [detailsErrors, setDetailsErrors] = useState<Record<string, string>>(
    {},
  );

  // Documents — picked locally, uploaded once the application is created.
  const [pickedFiles, setPickedFiles] = useState<Record<string, PickedFile>>(
    {},
  );
  const [documents, setDocuments] = useState<Document[]>([
    {
      id: "d1",
      type: "national_id",
      name: "National ID",
      status: "pending",
      required: true,
    },
    {
      id: "d2",
      type: "payslip",
      name: "Payslip / Bank Statement",
      status: "pending",
      required: true,
    },
    {
      id: "d3",
      type: "proof_of_residence",
      name: "Proof of Residence",
      status: "pending",
      required: true,
    },
    {
      id: "d4",
      type: "business_registration",
      name: "Business Registration",
      status: "pending",
      required: false,
    },
  ]);

  // Guarantors — collected locally, attached to the application once it's created.
  const [guarantors, setGuarantors] = useState<Guarantor[]>([]);

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

  const addGuarantorLocal = (data: { name: string; phone: string; relationshipType: string }) => {
    setGuarantors((prev) => [
      ...prev,
      {
        id: `local-${prev.length}`,
        name: data.name,
        phone: data.phone,
        relationshipType: data.relationshipType,
        status: "pending",
      },
    ]);
  };

  const removeGuarantor = (id: string) => {
    setGuarantors((prev) => prev.filter((g) => g.id !== id));
  };

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await submitLoanApplication({
        amount: numAmount,
        duration,
        loanType,
        purpose: purpose || undefined,
      });
      await Promise.all([
        ...guarantors.map((g) =>
          addGuarantor(res.applicationId, {
            name: g.name,
            phone: g.phone,
            relationshipType: g.relationshipType ?? undefined,
          }),
        ),
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
    documents,
    uploadDocument,
    guarantors,
    addGuarantor: addGuarantorLocal,
    removeGuarantor,
    interestRate: PLATFORM_RATE_PER_MONTH,
    monthlyPayment,
    totalRepayable,
    detailsErrors,
    submitting: submitMutation.isPending,
    submitApplication,
  };
}
