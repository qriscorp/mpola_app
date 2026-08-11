export type UserRole = "borrower" | "lender";
export type AccountType = "individual" | "business" | "company";

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  nin: string;
  role: UserRole;
  accountType: AccountType;
  kycVerified: boolean;
  isPhoneVerified?: boolean;
  twoFactorEnabled?: boolean;
  profileImage?: string;
  createdAt: string;
}

export type LoanType =
  | "personal"
  | "business"
  | "education"
  | "agricultural"
  | "emergency";
export type LoanStatus =
  | "pending"
  | "pending_disbursement"
  | "active"
  | "approved"
  | "overdue"
  | "completed"
  | "rejected";
export type ApplicationStep = 1 | 2 | 3;

export interface Loan {
  id: string;
  borrowerId: string;
  lenderId?: string;
  borrowerName?: string | null;
  lenderName?: string | null;
  amount: number;
  duration: number | null; // months — exactly one of duration/durationDays is set
  durationDays: number | null; // short-term "emergency" loan (1-29 days), single bullet repayment
  type: LoanType;
  interestRate: number;
  monthlyPayment: number;
  totalRepayable: number;
  totalPaid?: number;
  status: LoanStatus;
  paidInstalments: number;
  totalInstalments: number;
  nextPaymentDate?: string;
  nextPaymentAmount?: number;
  disbursedAt: string | null;
  createdAt: string;
  requiredDocuments: string[];
  requiredDocumentsStatus: RequiredDocumentStatus[];
}

export interface LoanRepaymentRecord {
  id: string;
  amount: number;
  instalmentNumber: number;
  status: string;
  paymentMethod: string | null;
  transactionId: string | null;
  createdAt: string;
}

export type ApplicationStatus =
  | "awaiting_guarantors"
  | "pending"
  | "approved"
  | "rejected"
  | "funded"
  | "completed"
  | "defaulted"
  | "expired";

export interface ApplicationBorrower {
  id: string;
  fullName: string | null;
  kycStatus: "pending" | "verified" | "rejected";
  creditScore: number;
}

export interface LoanApplication {
  id: string;
  referenceNumber: string;
  amount: number;
  duration: number | null;
  durationDays: number | null;
  loanType: LoanType;
  purpose: string | null;
  status: ApplicationStatus;
  interestRate: number | null;
  monthlyPayment: number | null;
  totalRepayable: number | null;
  maxInterestRate: number | null;
  createdAt: string;
  validUntil: string | null;
  isFrozen: boolean;
  frozenBy: "borrower" | "admin" | null;
  borrower: ApplicationBorrower | null;
  offersCount: number;
  pendingOffersCount: number;
  // Once status is "funded", check these to tell "accepted, waiting on the
  // lender to disburse" apart from "actually disbursed" — see mpola_api's
  // _app_response.
  loanId: string | null;
  loanStatus: LoanStatus | null;
  loanDisbursedAt: string | null;
  offers?: LoanOffer[];
  guarantors?: Guarantor[];
}

export interface Guarantor {
  id: string;
  guarantorUserId: string;
  fullName: string | null;
  username: string;
  relationshipType: string | null;
  status: "pending" | "accepted" | "declined";
}

export interface GuarantorRequest {
  id: string;
  applicationId: string;
  status: "pending" | "accepted" | "declined";
  amount: number | null;
  loanType: string | null;
  duration: number | null;
  durationDays: number | null;
  purpose: string | null;
  borrowerName: string | null;
  createdAt: string;
}

export type OfferStatus = "pending" | "accepted" | "declined" | "expired";

export interface RequiredDocumentStatus {
  label: string;
  type: string | null;
  source: "kyc" | "borrower_doc" | null;
  satisfied: boolean;
  fileUrl: string | null;
  fileName: string | null;
  verified: boolean;
}

export interface LoanOffer {
  id: string;
  applicationId: string;
  applicationReference: string | null;
  loanType: LoanType | null;
  applicationStatus: ApplicationStatus | null;
  lenderId: string;
  lenderName: string | null;
  amount: number;
  interestRate: number;
  duration: number | null;
  durationDays: number | null;
  monthlyPayment: number | null;
  totalRepayable: number | null;
  status: OfferStatus;
  requiredDocuments: string[];
  requiredDocumentsStatus: RequiredDocumentStatus[];
  createdAt: string;
}

export type TransactionType =
  | "disbursement"
  | "repayment"
  | "top_up"
  | "withdrawal"
  | "deposit";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  // "repayment"/"disbursement" share the same `type` on both the sender's
  // and receiver's row (wallet-to-wallet) — this is the explicit signal for
  // +/- and color, not `type` or `amount` (always stored positive).
  direction: "credit" | "debit";
  description: string;
  date: string;
  counterparty?: string;
  status: "pending" | "completed" | "failed";
  reference: string | null;
  createdAt: string;
}

export interface TransactionLoanSummary {
  id: string;
  amount: number;
  interestRate: number;
  duration: number | null;
  durationDays: number | null;
  status: string;
  borrowerName: string | null;
  lenderName: string | null;
  totalRepayable: number;
  totalPaid: number;
  paidInstalments: number;
  totalInstalments: number;
}

export interface TransactionRepaymentSummary {
  id: string;
  instalmentNumber: number;
  paymentMethod: string | null;
}

export interface TransactionDetail extends Transaction {
  platformFee: number | null;
  providerFee: number | null;
  totalFee: number | null;
  feeCategory: string | null;
  loan: TransactionLoanSummary | null;
  repayment: TransactionRepaymentSummary | null;
}

export interface Wallet {
  balance: number;
  isWalletSetup: boolean;
  transactions: Transaction[];
}

export interface BankOption {
  code: string;
  name: string;
}

export interface CardDepositInitiateResult {
  checkoutUrl: string;
  reference: string;
}

export interface TransferStatusResult {
  status: "pending" | "completed" | "failed";
  balance: number;
  fee?: number | null;
}

export interface WithdrawalCharges {
  platform_fee: number;
  provider_fee: number;
  total_fee: number;
}

export interface BorrowerStats {
  loansTaken: number;
  paymentsRepaid: number;
  totalPayments: number;
  creditScore: number;
}

export interface LenderStats {
  totalDeployed: number;
  activeLoans: number;
  monthlyReturn: number;
  repaymentRate: number;
  totalEarned: number;
  thisMonthEarned: number;
  pendingAmount: number;
  projectedAmount: number;
}

/** A pending loan application as seen by lenders browsing the open marketplace. */
export type MarketplaceApplication = LoanApplication;

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string | null;
  data: Record<string, unknown> | null;
  read: boolean;
  timestamp: string;
}

export interface EarningsBreakdown {
  borrowerName: string;
  totalEarnings: number;
}

export interface MonthlyEarning {
  month: string;
  amount: number;
}

export interface LenderEarnings {
  totalDeployed: number;
  activeLoans: number;
  totalRepaid: number;
  totalEarned: number;
  thisMonthEarned: number;
  avgYield: number;
  monthlyEarnings: MonthlyEarning[];
  concentrationWarning: { type: "borrower" | "loan_type"; label: string; pct: number } | null;
}

export type OfferTemplateStatus = "pending_review" | "draft" | "approved" | "rejected";

export interface OfferTemplate {
  id: string;
  lenderId: string;
  maxAmount: number;
  minAmount: number;
  interestRate: number;
  maxDuration: number | null;
  // A standing offer is either month-based (maxDuration) or a day-based
  // "emergency" offer (maxDurationDays) — exactly one is ever set, same
  // split as LoanApplication/LoanOffer.
  maxDurationDays: number | null;
  acceptedLoanTypes: string[];
  requiredDocuments: string[];
  description: string | null;
  validUntil: string | null;
  maxConcurrentLoans: number | null;
  status: OfferTemplateStatus;
  isFrozen: boolean;
  frozenBy: "lender" | "admin" | null;
  createdAt: string;
}

export interface OfferTemplateInput {
  maxAmount: number;
  minAmount: number;
  interestRate: number;
  maxDuration?: number | null;
  maxDurationDays?: number | null;
  acceptedLoanTypes: string[];
  requiredDocuments: string[];
  description?: string;
  validUntil?: string;
  maxConcurrentLoans?: number;
}
