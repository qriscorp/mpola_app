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

export type LoanType =
  | "personal"
  | "business"
  | "education"
  | "agricultural"
  | "emergency";
export type LoanStatus =
  | "pending"
  | "active"
  | "approved"
  | "overdue"
  | "completed"
  | "rejected";
export type ApplicationStep = 1 | 2 | 3 | 4;

export interface Loan {
  id: string;
  borrowerId: string;
  lenderId?: string;
  borrowerName?: string | null;
  lenderName?: string | null;
  amount: number;
  duration: number; // months
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
  createdAt: string;
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
  | "pending"
  | "approved"
  | "rejected"
  | "funded"
  | "completed"
  | "defaulted";

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
  duration: number;
  loanType: LoanType;
  purpose: string | null;
  status: ApplicationStatus;
  interestRate: number | null;
  monthlyPayment: number | null;
  totalRepayable: number | null;
  createdAt: string;
  borrower: ApplicationBorrower | null;
  offersCount: number;
  pendingOffersCount: number;
  offers?: LoanOffer[];
  guarantors?: Guarantor[];
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

export interface Guarantor {
  id: string;
  name: string;
  phone: string;
  relationshipType: string | null;
  status: "pending" | "accepted" | "declined";
}

export type OfferStatus = "pending" | "accepted" | "declined" | "expired";

export interface LoanOffer {
  id: string;
  applicationId: string;
  lenderId: string;
  lenderName: string | null;
  amount: number;
  interestRate: number;
  duration: number;
  monthlyPayment: number | null;
  totalRepayable: number | null;
  status: OfferStatus;
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

/** A pending loan application as seen by lenders browsing the open marketplace. */
export type MarketplaceApplication = LoanApplication;

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string | null;
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
}
