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
  profileImage?: string;
  createdAt: string;
}

export type LoanType = "personal" | "business" | "real_estate" | "education";
export type LoanStatus =
  | "pending"
  | "active"
  | "approved"
  | "overdue"
  | "completed"
  | "rejected";
export type ApplicationStep = 1 | 2 | 3 | 4 | 5;

export interface Loan {
  id: string;
  borrowerId: string;
  lenderId?: string;
  amount: number;
  duration: number; // months
  type: LoanType;
  interestRate: number;
  monthlyPayment: number;
  totalRepayable: number;
  status: LoanStatus;
  paidInstalments: number;
  totalInstalments: number;
  nextPaymentDate?: string;
  nextPaymentAmount?: number;
  createdAt: string;
}

export interface LoanApplication {
  id: string;
  referenceNumber: string;
  borrowerId: string;
  amount: number;
  duration: number;
  type: LoanType;
  step: ApplicationStep;
  documents: Document[];
  guarantors: Guarantor[];
  selectedLenders: string[];
  status:
    | "draft"
    | "submitted"
    | "under_review"
    | "offers_received"
    | "accepted"
    | "funded";
  createdAt: string;
}

export type DocumentType =
  | "national_id"
  | "payslip"
  | "proof_of_residence"
  | "business_registration";
export type DocumentStatus = "pending" | "uploaded" | "verified";

export interface Document {
  id: string;
  type: DocumentType;
  name: string;
  status: DocumentStatus;
  uri?: string;
  required: boolean;
}

export type GuarantorStatus = "pending" | "accepted" | "declined";

export interface Guarantor {
  id: string;
  name: string;
  phone: string;
  status: GuarantorStatus;
  order: number;
}

export interface LenderProfile {
  id: string;
  name: string;
  interestRate: number;
  maxAmount: number;
  repaymentRate: number;
  recommended?: boolean;
  avatar?: string;
}

export type OfferStatus = "pending" | "accepted" | "declined" | "expired";

export interface LoanOffer {
  id: string;
  lenderId: string;
  lenderName: string;
  borrowerId: string;
  borrowerName: string;
  amount: number;
  interestRate: number;
  duration: number;
  monthlyPayment: number;
  totalEarnings: number;
  totalRepayable: number;
  status: OfferStatus;
  expiresIn?: string;
  recommended?: boolean;
  bestRate?: boolean;
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
  description: string;
  date: string;
  counterparty?: string;
}

export interface Wallet {
  balance: number;
  isWalletSetup: boolean;
  transactions: Transaction[];
}

export type PaymentMethod = "wallet" | "momo" | "airtel";

export interface PaymentDetails {
  amount: number;
  method: PaymentMethod;
  processingFee: number;
  totalDeducted: number;
  instalmentNumber: number;
  totalInstalments: number;
  dueDate: string;
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

export interface BorrowerProfile {
  id: string;
  name: string;
  initials: string;
  location: string;
  memberSince: string;
  kycVerified: boolean;
  loanType: LoanType;
  amount: number;
  duration: number;
  purpose: string;
  occupation: string;
  businessAge?: string;
  previousLoans: number;
  documentsCount: number;
  guarantorsCount: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "offer_accepted" | "repayment" | "overdue" | "new_matches" | "general";
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
