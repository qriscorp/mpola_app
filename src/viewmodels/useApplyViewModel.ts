import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { LoanType, ApplicationStep, Document, Guarantor } from "../models";
import { fetchLenderProfiles, submitLoanApplication } from "../services";
import { loanDetailsSchema } from "../validation";

export function useApplyViewModel() {
  const [step, setStep] = useState<ApplicationStep>(1);
  const [amount, setAmount] = useState("2000000");
  const [duration, setDuration] = useState(6);
  const [loanType, setLoanType] = useState<LoanType>("personal");
  const [detailsErrors, setDetailsErrors] = useState<Record<string, string>>(
    {},
  );

  // Documents
  const [documents, setDocuments] = useState<Document[]>([
    {
      id: "d1",
      type: "national_id",
      name: "National ID",
      status: "uploaded",
      required: true,
    },
    {
      id: "d2",
      type: "payslip",
      name: "Payslip / Bank Statement",
      status: "uploaded",
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

  // Guarantors
  const [guarantors, setGuarantors] = useState<Guarantor[]>([
    {
      id: "g1",
      name: "Moses Ssekandi",
      phone: "+256 772 123 456",
      status: "accepted",
      order: 1,
    },
    {
      id: "g2",
      name: "Ruth Namaganda",
      phone: "+256 701 987 654",
      status: "pending",
      order: 2,
    },
  ]);

  // Selected lenders
  const [selectedLenders, setSelectedLenders] = useState<string[]>(["lend1"]);

  const { data: lenders = [], isLoading: loadingLenders } = useQuery({
    queryKey: ["lenderProfiles"],
    queryFn: fetchLenderProfiles,
  });

  const interestRate =
    lenders.find((l) => l.id === selectedLenders[0])?.interestRate ?? 2.5;
  const monthlyPayment = Math.round(
    (Number(amount) * (1 + (interestRate / 100) * duration)) / duration,
  );
  const totalRepayable = monthlyPayment * duration;

  const durationOptions = [3, 6, 12, 18, 24];
  const loanTypes: LoanType[] = [
    "personal",
    "business",
    "real_estate",
    "education",
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
    setStep((s) => Math.min(s + 1, 5) as ApplicationStep);
  };
  const prevStep = () => setStep((s) => Math.max(s - 1, 1) as ApplicationStep);

  const toggleLender = (id: string) => {
    setSelectedLenders((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id],
    );
  };

  const uploadDocument = (docId: string) => {
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === docId ? { ...d, status: "uploaded" as const } : d,
      ),
    );
  };

  const submitMutation = useMutation({
    mutationFn: submitLoanApplication,
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
    documents,
    uploadDocument,
    guarantors,
    lenders,
    selectedLenders,
    toggleLender,
    interestRate,
    monthlyPayment,
    totalRepayable,
    detailsErrors,
    loadingLenders,
    submitting: submitMutation.isPending,
    submitApplication,
  };
}
