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
  kycStatus: "pending" | "verified" | "rejected";
  // When kycStatus last became "verified" — each KYCDocument has its own
  // verified_at/locked_until now (see KYCUploadSection), this is just the
  // account-wide timestamp, not a lock driver on its own.
  kycVerifiedAt: string | null;
  isPhoneVerified?: boolean;
  twoFactorEnabled?: boolean;
  // Lender-facing — only ever gate notifications sent to loan.lender_id.
  notifNewApplication?: boolean;
  notifRepaymentReceived?: boolean;
  notifLoanOverdue?: boolean;
  notifPortfolioDigest?: boolean;
  // Borrower-facing counterparts — gate notifications sent to loan.borrower_id.
  notifOfferReceived?: boolean;
  notifPaymentReminder?: boolean;
  notifApplicationStatus?: boolean;
  // Role-agnostic.
  notifLoginAlerts?: boolean;
  profileImage?: string;
  createdAt: string;
  termsAcceptedAt: string | null;
  // Lender-only — null for borrowers. "not_issued" until KYC is verified
  // AND the agreement has been accepted; "active" while within
  // LENDER_LICENCE_VALIDITY_DAYS of termsAcceptedAt; "expired" after.
  licenceNumber: string | null;
  licenceStatus: "not_issued" | "active" | "expired" | null;
  licenceValidUntil: string | null;
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

export interface LoanGuarantor {
  id: string;
  fullName: string | null;
  username: string | null;
  relationshipType: string | null;
  status: "pending" | "accepted" | "declined";
}

export interface Loan {
  id: string;
  applicationId: string | null;
  borrowerId: string;
  lenderId?: string;
  borrowerName?: string | null;
  borrowerPhone?: string | null;
  borrowerEmail?: string | null;
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
  borrowerNote: string | null;
  requiredDocuments: string[];
  requiredDocumentsStatus: RequiredDocumentStatus[];
  guarantors: LoanGuarantor[];
  // Only present on disbursement-queue entries — true when this borrower
  // already went active with a different lender, so disbursing THIS loan
  // will be rejected until that one's repaid.
  borrowerHasActiveLoanElsewhere?: boolean;
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
  source: "kyc" | "borrower_doc" | "custom" | null;
  satisfied: boolean;
  fileUrl: string | null;
  fileName: string | null;
  verified: boolean;
  // Only set for source === "custom" — a lender-specified "Other: ..."
  // requirement fulfilled (fully or partly) by free text instead of/as
  // well as a file.
  textResponse: string | null;
}

export interface LoanOffer {
  id: string;
  applicationId: string;
  applicationReference: string | null;
  borrowerName: string | null;
  loanType: LoanType | null;
  applicationStatus: ApplicationStatus | null;
  lenderId: string;
  lenderName: string | null;
  lenderKycStatus: "pending" | "verified" | "rejected" | null;
  amount: number;
  interestRate: number;
  duration: number | null;
  durationDays: number | null;
  monthlyPayment: number | null;
  totalRepayable: number | null;
  status: OfferStatus;
  // Set only when this offer was auto-generated by a standing offer match —
  // null for a lender's manual, hand-made offer.
  templateId: string | null;
  // Only meaningful while status === "pending" and templateId is set — the
  // lender who owns this offer can't also make a competing manual offer on
  // the same application until this timestamp passes (see
  // AUTO_MATCH_MANUAL_OFFER_COOLDOWN in routers/loans.py). Null otherwise.
  autoMatchCooldownEndsAt: string | null;
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
  isFrozen: boolean;
  frozenReason: string | null;
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
  // Counts of every LoanOffer this standing offer has auto-generated, by
  // status — lets the lender see activity at a glance before fetching the
  // full matched-requests list.
  matchedCount: number;
  pendingCount: number;
  acceptedCount: number;
}

/** One card in the borrower-facing "Browse Lender Offers" list — sourced
 * from the same public marketplace-preview endpoint mpola_website's
 * homepage uses (GET /public/marketplace-preview?listing_type=offers),
 * filtered to offers. Distinct from OfferTemplate, which is a lender's own
 * management view of their template. */
export interface BrowseOffer {
  id: string;
  lenderName: string;
  city: string | null;
  description: string | null;
  minAmount: number;
  maxAmount: number;
  interestRate: number;
  loanTypes: string[];
  maxDuration: number | null;
  maxDurationDays: number | null;
  offerCount: number;
}

/** Full detail behind one lender's standing offer, for the "Offer Detail"
 * screen reached from Browse Lender Offers — richer than BrowseOffer (adds
 * required docs, lender KYC status, member-since) but deliberately omits
 * any licence number. Backed by
 * GET /loans/offer-templates/{id}/public-detail. */
export interface OfferTemplateDetail {
  id: string;
  lenderName: string | null;
  city: string | null;
  lenderMemberSince: string | null;
  lenderKycStatus: string | null;
  interestRate: number;
  minAmount: number;
  maxAmount: number;
  maxDuration: number | null;
  maxDurationDays: number | null;
  acceptedLoanTypes: string[];
  requiredDocuments: string[];
  requiredDocumentsStatus: RequiredDocumentStatus[];
  description: string | null;
  validUntil: string | null;
  applicationsCount: number;
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
