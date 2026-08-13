/**
 * API service layer — talks to the real Mpola backend via the
 * apiAuth/apiPublic helpers in ./auth.
 */
import type {
  User,
  Loan,
  LoanType,
  LoanStatus,
  LoanApplication,
  ApplicationStatus,
  ApplicationBorrower,
  MarketplaceApplication,
  LoanOffer,
  OfferStatus,
  RequiredDocumentStatus,
  Guarantor,
  GuarantorRequest,
  Wallet,
  Transaction,
  TransactionType,
  TransactionDetail,
  BankOption,
  CardDepositInitiateResult,
  TransferStatusResult,
  BorrowerStats,
  LenderStats,
  Notification,
  MonthlyEarning,
  LenderEarnings,
  OfferTemplate,
  OfferTemplateInput,
  OfferTemplateStatus,
} from "../models";
import {
  apiAuthGet,
  apiAuthPost,
  apiAuthPut,
  apiAuthDelete,
  apiAuthUpload,
} from "./auth";

const delay = (ms = 800) => new Promise((r) => setTimeout(r, ms));

// ─── Wallet (shared) ─────────────────────────────────────
// One wallet per user — borrower and lender portals hit the same endpoints.

interface RawWalletTransaction {
  id: string;
  amount: number;
  type: TransactionType;
  direction: "credit" | "debit";
  status: "pending" | "completed" | "failed";
  description: string | null;
  reference: string | null;
  counterparty: string | null;
  created_at: string;
}

const TYPE_LABELS: Record<TransactionType, string> = {
  deposit: "Deposit",
  withdrawal: "Withdrawal",
  repayment: "Repayment",
  disbursement: "Disbursement",
  top_up: "Top Up",
};

function formatTxDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-UG", { day: "numeric", month: "short" });
}

function mapWalletTransaction(tx: RawWalletTransaction): Transaction {
  const signedAmount = tx.direction === "debit"
    ? -Math.abs(tx.amount)
    : Math.abs(tx.amount);
  return {
    id: tx.id,
    type: tx.type,
    amount: signedAmount,
    direction: tx.direction,
    description: tx.description || TYPE_LABELS[tx.type],
    date: formatTxDate(tx.created_at),
    counterparty: tx.counterparty ?? undefined,
    status: tx.status,
    reference: tx.reference,
    createdAt: tx.created_at,
  };
}

export async function setupWallet(
  pin: string,
): Promise<{ status: number; message: string }> {
  return apiAuthPost("/wallet/setup", { pin });
}

// Mobile money — synchronous, backed by UPG collect/disburse.
export async function depositMobileMoney(data: {
  amount: number;
  phone: string;
  carrier?: string;
}): Promise<{ status: number; message: string; balance: number }> {
  return apiAuthPost("/wallet/deposit", data);
}

export async function withdrawMobileMoney(data: {
  amount: number;
  phone: string;
  carrier?: string;
}): Promise<{
  status: number;
  message: string;
  balance: number;
  fee: number;
  total_debited: number;
}> {
  return apiAuthPost("/wallet/withdraw", data);
}

// Card — Flutterwave hosted checkout, async: initiate then poll status.
export async function initiateCardDeposit(data: {
  amount: number;
  redirectUrl: string;
}): Promise<CardDepositInitiateResult> {
  const res = await apiAuthPost<{ checkout_url: string; reference: string }>(
    "/wallet/deposit/card/initiate",
    { amount: data.amount, redirect_url: data.redirectUrl },
  );
  return { checkoutUrl: res.checkout_url, reference: res.reference };
}

export async function getCardDepositStatus(
  reference: string,
): Promise<TransferStatusResult> {
  return apiAuthGet(`/wallet/deposit/card/status/${reference}`);
}

// Bank transfer — Flutterwave payout, async: initiate then poll status.
export async function getBanks(
  countryCode: string = "UG",
): Promise<BankOption[]> {
  const res = await apiAuthGet<{ country_code: string; banks: BankOption[] }>(
    `/wallet/banks/${countryCode}`,
  );
  return res.banks;
}

export async function initiateBankWithdraw(data: {
  amount: number;
  accountBank: string;
  accountNumber: string;
  beneficiaryName: string;
  narration?: string;
}): Promise<{ reference: string; status: string }> {
  return apiAuthPost("/wallet/withdraw/bank/initiate", {
    amount: data.amount,
    account_bank: data.accountBank,
    account_number: data.accountNumber,
    beneficiary_name: data.beneficiaryName,
    narration: data.narration,
  });
}

export async function getBankWithdrawStatus(
  reference: string,
): Promise<TransferStatusResult> {
  return apiAuthGet(`/wallet/withdraw/bank/status/${reference}`);
}

export async function fetchWalletTransactionsPage(
  page: number = 1,
  pageSize: number = 20,
): Promise<{ transactions: Transaction[]; total: number }> {
  const params = new URLSearchParams({
    skip: String((page - 1) * pageSize),
    limit: String(pageSize),
  });
  const res = await apiAuthGet<{
    total: number;
    transactions: RawWalletTransaction[];
  }>(`/wallet/transactions?${params.toString()}`);
  return { transactions: res.transactions.map(mapWalletTransaction), total: res.total };
}

interface RawTransactionLoanSummary {
  id: string;
  amount: number;
  interest_rate: number;
  duration: number | null;
  duration_days: number | null;
  status: string;
  borrower_name: string | null;
  lender_name: string | null;
  total_repayable: number;
  total_paid: number;
  paid_instalments: number;
  total_instalments: number;
}

interface RawTransactionRepaymentSummary {
  id: string;
  instalment_number: number;
  payment_method: string | null;
}

interface RawTransactionDetail extends RawWalletTransaction {
  platform_fee: number | null;
  provider_fee: number | null;
  total_fee: number | null;
  fee_category: string | null;
  loan: RawTransactionLoanSummary | null;
  repayment: RawTransactionRepaymentSummary | null;
}

export async function fetchTransactionDetail(id: string): Promise<TransactionDetail> {
  const raw = await apiAuthGet<RawTransactionDetail>(`/wallet/transactions/${id}`);
  const base = mapWalletTransaction(raw);
  return {
    ...base,
    platformFee: raw.platform_fee,
    providerFee: raw.provider_fee,
    totalFee: raw.total_fee,
    feeCategory: raw.fee_category,
    loan: raw.loan
      ? {
          id: raw.loan.id,
          amount: raw.loan.amount,
          interestRate: raw.loan.interest_rate,
          duration: raw.loan.duration,
          durationDays: raw.loan.duration_days,
          status: raw.loan.status,
          borrowerName: raw.loan.borrower_name,
          lenderName: raw.loan.lender_name,
          totalRepayable: raw.loan.total_repayable,
          totalPaid: raw.loan.total_paid,
          paidInstalments: raw.loan.paid_instalments,
          totalInstalments: raw.loan.total_instalments,
        }
      : null,
    repayment: raw.repayment
      ? {
          id: raw.repayment.id,
          instalmentNumber: raw.repayment.instalment_number,
          paymentMethod: raw.repayment.payment_method,
        }
      : null,
  };
}

async function fetchWallet(): Promise<Wallet> {
  const [walletRes, txRes] = await Promise.all([
    apiAuthGet<{ balance: number; is_wallet_setup: boolean; is_frozen: boolean; frozen_reason: string | null }>("/wallet/"),
    apiAuthGet<{ total: number; transactions: RawWalletTransaction[] }>(
      "/wallet/transactions",
    ),
  ]);
  return {
    balance: walletRes.balance,
    isWalletSetup: walletRes.is_wallet_setup,
    isFrozen: walletRes.is_frozen,
    frozenReason: walletRes.frozen_reason,
    transactions: txRes.transactions.map(mapWalletTransaction),
  };
}

// ─── Profile ─────────────────────────────────────────────

interface RawProfile {
  id: string;
  full_name: string | null;
  email: string;
  phone_number: string | null;
  nin: string | null;
  account_type: string;
  is_kyc_verified: boolean;
  kyc_status: "pending" | "verified" | "rejected";
  kyc_verified_at: string | null;
  is_phone_verified: boolean;
  two_factor_enabled?: boolean;
  profile_pic: string | null;
  created_at: string;
  terms_accepted_at: string | null;
  licence_number: string | null;
  licence_status: "not_issued" | "active" | "expired" | null;
  licence_valid_until: string | null;
}

function mapProfile(p: RawProfile): User {
  return {
    id: p.id,
    fullName: p.full_name ?? "",
    email: p.email,
    phone: p.phone_number ?? "",
    nin: p.nin ?? "",
    role: p.account_type === "business" ? "lender" : "borrower",
    accountType: p.account_type as User["accountType"],
    kycVerified: p.is_kyc_verified,
    kycStatus: p.kyc_status,
    kycVerifiedAt: p.kyc_verified_at,
    isPhoneVerified: p.is_phone_verified,
    twoFactorEnabled: p.two_factor_enabled ?? false,
    profileImage: p.profile_pic ?? undefined,
    createdAt: p.created_at,
    termsAcceptedAt: p.terms_accepted_at,
    licenceNumber: p.licence_number,
    licenceStatus: p.licence_status,
    licenceValidUntil: p.licence_valid_until,
  };
}

export async function fetchProfile(): Promise<User> {
  const p = await apiAuthGet<RawProfile>("/users/me");
  return mapProfile(p);
}

export async function signLenderAgreement(): Promise<User> {
  const p = await apiAuthPost<RawProfile>("/users/me/sign-lender-agreement", {});
  return mapProfile(p);
}

export async function updateProfile(data: {
  fullName?: string;
  phone?: string;
  nin?: string;
  twoFactorEnabled?: boolean;
}): Promise<User> {
  const p = await apiAuthPut<RawProfile>("/users/me", {
    full_name: data.fullName,
    phone_number: data.phone,
    nin: data.nin,
    two_factor_enabled: data.twoFactorEnabled,
  });
  return mapProfile(p);
}

// ─── Borrower Dashboard ──────────────────────────────────

export async function fetchBorrowerDashboard() {
  const [profile, applications, loan, wallet] = await Promise.all([
    apiAuthGet<{ full_name: string | null; credit_score: number }>(
      "/users/me",
    ),
    fetchApplications(),
    fetchActiveLoan(),
    fetchBorrowerWallet(),
  ]);

  const [firstName, ...rest] = (profile.full_name ?? "").split(" ");
  const pendingApps = applications.filter((a) => a.status === "pending");
  const offersLive = pendingApps.reduce(
    (sum, a) => sum + (a.pendingOffersCount ?? 0),
    0,
  );

  return {
    user: { firstName: firstName || "", lastName: rest.join(" ") },
    stats: {
      loansTaken: offersLive,
      paymentsRepaid: loan?.totalPaid ?? 0,
      totalPayments: loan?.totalRepayable ?? 0,
      creditScore: profile.credit_score ?? 0,
    },
    loan: loan ?? undefined,
    walletBalance: wallet.balance,
  };
}

// ─── Borrower Wallet ────────────────────────────────────

export async function fetchBorrowerWallet(): Promise<Wallet> {
  return fetchWallet();
}

// ─── Active Loan / Repayments ───────────────────────────

interface RawLoanGuarantor {
  id: string;
  full_name: string | null;
  username: string | null;
  relationship_type: string | null;
  status: "pending" | "accepted" | "declined";
}

interface RawLoan {
  id: string;
  application_id: string | null;
  borrower_id: string;
  lender_id: string;
  borrower_name?: string | null;
  borrower_phone?: string | null;
  borrower_email?: string | null;
  lender_name?: string | null;
  amount: number;
  interest_rate: number;
  duration: number | null;
  duration_days: number | null;
  monthly_payment: number;
  total_repayable: number;
  total_paid: number;
  paid_instalments: number;
  total_instalments: number;
  next_payment_date: string | null;
  next_payment_amount: number | null;
  status: string;
  disbursed_at: string | null;
  created_at: string;
  borrower_note: string | null;
  required_documents: string[];
  required_documents_status: RawRequiredDocumentStatus[];
  guarantors: RawLoanGuarantor[];
}

interface RawRepayment {
  id: string;
  amount: number;
  instalment_number: number;
  status: string;
  payment_method: string | null;
  transaction_id: string | null;
  created_at: string;
}

function mapLoan(raw: RawLoan): Loan {
  return {
    id: raw.id,
    applicationId: raw.application_id,
    borrowerId: raw.borrower_id,
    lenderId: raw.lender_id,
    borrowerName: raw.borrower_name ?? null,
    borrowerPhone: raw.borrower_phone ?? null,
    borrowerEmail: raw.borrower_email ?? null,
    lenderName: raw.lender_name ?? null,
    amount: raw.amount,
    duration: raw.duration,
    durationDays: raw.duration_days,
    type: "personal", // the active-loan API doesn't return a loan type today
    interestRate: raw.interest_rate,
    monthlyPayment: raw.monthly_payment,
    totalRepayable: raw.total_repayable,
    totalPaid: raw.total_paid,
    status: raw.status as LoanStatus,
    paidInstalments: raw.paid_instalments,
    totalInstalments: raw.total_instalments,
    nextPaymentDate: raw.next_payment_date ?? undefined,
    nextPaymentAmount: raw.next_payment_amount ?? undefined,
    disbursedAt: raw.disbursed_at,
    createdAt: raw.created_at,
    borrowerNote: raw.borrower_note ?? null,
    requiredDocuments: raw.required_documents ?? [],
    requiredDocumentsStatus: (raw.required_documents_status ?? []).map(mapRequiredDocumentStatus),
    guarantors: (raw.guarantors ?? []).map((g) => ({
      id: g.id,
      fullName: g.full_name,
      username: g.username,
      relationshipType: g.relationship_type,
      status: g.status,
    })),
  };
}

function mapRepayment(raw: RawRepayment) {
  return {
    id: raw.id,
    amount: raw.amount,
    instalmentNumber: raw.instalment_number,
    status: raw.status,
    paymentMethod: raw.payment_method,
    transactionId: raw.transaction_id,
    createdAt: raw.created_at,
  };
}

export async function fetchActiveLoan(): Promise<Loan | null> {
  const res = await apiAuthGet<{ total: number; loans: RawLoan[] }>(
    "/loans/active",
  );
  const raw =
    res.loans.find((l) => l.status === "active" || l.status === "overdue") ??
    res.loans[0];
  return raw ? mapLoan(raw) : null;
}

export async function fetchLoanDetail(
  loanId: string,
): Promise<Loan & { repayments: ReturnType<typeof mapRepayment>[] }> {
  const raw = await apiAuthGet<RawLoan & { repayments?: RawRepayment[] }>(
    `/loans/active/${loanId}`,
  );
  return {
    ...mapLoan(raw),
    repayments: (raw.repayments ?? []).map(mapRepayment),
  };
}

interface RawRepaymentHistoryItem extends RawRepayment {
  loan_id: string;
  lender_name: string | null;
}

export interface RepaymentHistoryItem {
  id: string;
  loanId: string;
  amount: number;
  instalmentNumber: number;
  status: string;
  paymentMethod: string | null;
  transactionId: string | null;
  createdAt: string;
  lenderName: string | null;
}

export async function fetchMyRepayments(
  skip = 0,
  limit = 20,
): Promise<{ total: number; repayments: RepaymentHistoryItem[] }> {
  const res = await apiAuthGet<{ total: number; repayments: RawRepaymentHistoryItem[] }>(
    `/loans/repayments/mine?skip=${skip}&limit=${limit}`,
  );
  return {
    total: res.total,
    repayments: res.repayments.map((r) => ({
      ...mapRepayment(r),
      loanId: r.loan_id,
      lenderName: r.lender_name,
    })),
  };
}

/** Downloads the real PDF receipt for a repayment, then opens the native
 * share sheet so the user can save or send it — there's no "Downloads
 * folder" to drop it into directly on either platform.
 */
export async function downloadRepaymentReceipt(repaymentId: string): Promise<void> {
  const FileSystem = await import("expo-file-system");
  const Sharing = await import("expo-sharing");
  const { getAccessToken, API_BASE_URL } = await import("./auth");

  const token = await getAccessToken();
  const fileUri = `${FileSystem.documentDirectory}mpola-receipt-${repaymentId}.pdf`;

  const download = FileSystem.createDownloadResumable(
    `${API_BASE_URL}/loans/repayments/${repaymentId}/receipt`,
    fileUri,
    { headers: token ? { Authorization: `Bearer ${token}` } : {} },
  );

  const result = await download.downloadAsync();
  if (!result) throw new Error("Receipt download failed");

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(result.uri, { mimeType: "application/pdf" });
  }
}

/** Downloads the real PDF receipt for a loan's disbursement, then opens the
 * native share sheet — same pattern as downloadRepaymentReceipt. */
export async function downloadDisbursementReceipt(loanId: string): Promise<void> {
  const FileSystem = await import("expo-file-system");
  const Sharing = await import("expo-sharing");
  const { getAccessToken, API_BASE_URL } = await import("./auth");

  const token = await getAccessToken();
  const fileUri = `${FileSystem.documentDirectory}mpola-disbursement-${loanId}.pdf`;

  const download = FileSystem.createDownloadResumable(
    `${API_BASE_URL}/loans/${loanId}/disbursement-receipt`,
    fileUri,
    { headers: token ? { Authorization: `Bearer ${token}` } : {} },
  );

  const result = await download.downloadAsync();
  if (!result) throw new Error("Receipt download failed");

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(result.uri, { mimeType: "application/pdf" });
  }
}

export async function makeRepayment(data: {
  loanId: string;
  amount: number;
  paymentMethod: "wallet" | "mobile_money";
  phoneNumber?: string;
  carrier?: string;
}): Promise<{
  repaymentId: string;
  transactionId: string;
  date: string;
  amount: number;
  paymentMethod: string;
  instalmentNumber: number;
  loan: Loan;
}> {
  const res = await apiAuthPost<{
    status: number;
    message: string;
    repayment: {
      id: string;
      amount: number;
      instalment_number: number;
      payment_method: string | null;
      transaction_id: string | null;
      created_at: string;
    };
    loan: RawLoan;
  }>("/loans/repayments", {
    loan_id: data.loanId,
    amount: data.amount,
    payment_method: data.paymentMethod,
    phone_number: data.phoneNumber,
    carrier: data.carrier,
  });
  return {
    repaymentId: res.repayment.id,
    transactionId: res.repayment.transaction_id ?? res.repayment.id,
    date: res.repayment.created_at,
    amount: res.repayment.amount,
    paymentMethod: res.repayment.payment_method ?? data.paymentMethod,
    instalmentNumber: res.repayment.instalment_number,
    loan: mapLoan(res.loan),
  };
}

// ─── Loan applications / marketplace / offers (shared mapping) ──

interface RawApplicationBorrower {
  id: string;
  full_name: string | null;
  kyc_status: string;
  credit_score: number;
}

interface RawRequiredDocumentStatus {
  label: string;
  type: string | null;
  source: "kyc" | "borrower_doc" | "custom" | null;
  satisfied: boolean;
  file_url: string | null;
  file_name: string | null;
  verified: boolean;
  text_response: string | null;
}

interface RawOffer {
  id: string;
  application_id: string;
  application_reference: string | null;
  borrower_name: string | null;
  loan_type: string | null;
  application_status: string | null;
  lender_id: string;
  lender_name: string | null;
  lender_kyc_status: "pending" | "verified" | "rejected" | null;
  amount: number;
  interest_rate: number;
  duration: number | null;
  duration_days: number | null;
  monthly_payment: number | null;
  total_repayable: number | null;
  status: string;
  template_id: string | null;
  auto_match_cooldown_ends_at: string | null;
  required_documents: string[];
  required_documents_status: RawRequiredDocumentStatus[];
  created_at: string;
}

function mapRequiredDocumentStatus(d: RawRequiredDocumentStatus): RequiredDocumentStatus {
  return {
    label: d.label,
    type: d.type,
    source: d.source,
    satisfied: d.satisfied,
    fileUrl: d.file_url,
    fileName: d.file_name,
    verified: d.verified,
    textResponse: d.text_response,
  };
}

interface RawGuarantor {
  id: string;
  guarantor_user_id: string;
  full_name: string | null;
  username: string;
  relationship_type: string | null;
  status: string;
}

interface RawApplication {
  id: string;
  reference_number: string;
  amount: number;
  duration: number | null;
  duration_days: number | null;
  loan_type: string;
  purpose: string | null;
  status: string;
  interest_rate: number | null;
  monthly_payment: number | null;
  total_repayable: number | null;
  max_interest_rate: number | null;
  created_at: string;
  valid_until: string | null;
  is_frozen: boolean;
  frozen_by: "borrower" | "admin" | null;
  borrower: RawApplicationBorrower | null;
  offers_count: number;
  pending_offers_count: number;
  loan_id: string | null;
  loan_status: string | null;
  loan_disbursed_at: string | null;
  offers?: RawOffer[];
  guarantors?: RawGuarantor[];
}

function mapOffer(o: RawOffer): LoanOffer {
  return {
    id: o.id,
    applicationId: o.application_id,
    applicationReference: o.application_reference,
    borrowerName: o.borrower_name,
    loanType: (o.loan_type as LoanOffer["loanType"]) ?? null,
    applicationStatus: (o.application_status as LoanOffer["applicationStatus"]) ?? null,
    lenderId: o.lender_id,
    lenderName: o.lender_name,
    lenderKycStatus: o.lender_kyc_status,
    amount: o.amount,
    interestRate: o.interest_rate,
    duration: o.duration,
    durationDays: o.duration_days,
    monthlyPayment: o.monthly_payment,
    totalRepayable: o.total_repayable,
    status: o.status as OfferStatus,
    templateId: o.template_id,
    autoMatchCooldownEndsAt: o.auto_match_cooldown_ends_at,
    requiredDocuments: o.required_documents,
    requiredDocumentsStatus: (o.required_documents_status ?? []).map(mapRequiredDocumentStatus),
    createdAt: o.created_at,
  };
}

function mapGuarantor(g: RawGuarantor): Guarantor {
  return {
    id: g.id,
    guarantorUserId: g.guarantor_user_id,
    fullName: g.full_name,
    username: g.username,
    relationshipType: g.relationship_type,
    status: g.status as Guarantor["status"],
  };
}

function mapApplicationBorrower(
  b: RawApplicationBorrower,
): ApplicationBorrower {
  return {
    id: b.id,
    fullName: b.full_name,
    kycStatus: b.kyc_status as ApplicationBorrower["kycStatus"],
    creditScore: b.credit_score,
  };
}

function mapApplication(a: RawApplication): LoanApplication {
  return {
    id: a.id,
    referenceNumber: a.reference_number,
    amount: a.amount,
    duration: a.duration,
    durationDays: a.duration_days,
    loanType: a.loan_type as LoanType,
    purpose: a.purpose,
    status: a.status as ApplicationStatus,
    interestRate: a.interest_rate,
    monthlyPayment: a.monthly_payment,
    totalRepayable: a.total_repayable,
    maxInterestRate: a.max_interest_rate,
    createdAt: a.created_at,
    validUntil: a.valid_until,
    isFrozen: a.is_frozen,
    frozenBy: a.frozen_by,
    borrower: a.borrower ? mapApplicationBorrower(a.borrower) : null,
    offersCount: a.offers_count,
    pendingOffersCount: a.pending_offers_count,
    loanId: a.loan_id,
    loanStatus: a.loan_status as LoanApplication["loanStatus"],
    loanDisbursedAt: a.loan_disbursed_at,
    offers: a.offers?.map(mapOffer),
    guarantors: a.guarantors?.map(mapGuarantor),
  };
}

export async function fetchApplications(): Promise<LoanApplication[]> {
  const res = await apiAuthGet<{
    total: number;
    applications: RawApplication[];
  }>("/loans/applications");
  return res.applications.map(mapApplication);
}

export async function fetchApplicationDetail(
  id: string,
): Promise<LoanApplication> {
  const res = await apiAuthGet<RawApplication>(`/loans/applications/${id}`);
  return mapApplication(res);
}

export async function searchGuarantorCandidate(
  email: string,
  phoneNumber: string,
): Promise<{ id: string; username: string; fullName: string | null; role: string }> {
  const params = new URLSearchParams({ email, phone_number: phoneNumber });
  const res = await apiAuthGet<{ id: string; username: string; full_name: string | null; role: string }>(
    `/users/search-guarantor-candidate?${params.toString()}`,
  );
  return { id: res.id, username: res.username, fullName: res.full_name, role: res.role };
}

export async function attachGuarantors(
  applicationId: string,
  guarantorUserIds: string[],
): Promise<{ status: number; message: string }> {
  return apiAuthPost(`/loans/applications/${applicationId}/guarantors`, {
    guarantor_user_ids: guarantorUserIds,
  });
}

export async function respondToGuarantorRequest(
  guarantorId: string,
  status: "accepted" | "declined",
): Promise<{ status: number; message: string }> {
  return apiAuthPut(`/guarantors/${guarantorId}/respond`, { status });
}

export async function replaceGuarantor(
  applicationId: string,
  guarantorId: string,
  newGuarantorUserId: string,
): Promise<{ status: number; message: string }> {
  return apiAuthPut(`/guarantors/applications/${applicationId}/${guarantorId}/replace`, {
    new_guarantor_user_id: newGuarantorUserId,
  });
}

export async function remindGuarantor(guarantorId: string): Promise<{ status: number; message: string }> {
  return apiAuthPost(`/guarantors/${guarantorId}/remind`, {});
}

interface RawGuarantorRequest {
  id: string;
  application_id: string;
  status: "pending" | "accepted" | "declined";
  amount: number | null;
  loan_type: string | null;
  duration: number | null;
  duration_days: number | null;
  purpose: string | null;
  borrower_name: string | null;
  created_at: string;
}

export async function fetchGuarantorRequests(status?: string): Promise<GuarantorRequest[]> {
  const query = status ? `?status=${status}` : "";
  const res = await apiAuthGet<{ requests: RawGuarantorRequest[] }>(`/guarantors/requests${query}`);
  return res.requests.map((r) => ({
    id: r.id,
    applicationId: r.application_id,
    status: r.status,
    amount: r.amount,
    loanType: r.loan_type,
    duration: r.duration,
    durationDays: r.duration_days,
    purpose: r.purpose,
    borrowerName: r.borrower_name,
    createdAt: r.created_at,
  }));
}

// ─── Account-level KYC documents ───
export type KYCDocumentType =
  | "national_id"
  | "passport"
  | "profile_photo"
  | "proof_of_address";

export interface KYCDocument {
  id: string;
  document_type: KYCDocumentType | string;
  file_url: string;
  file_name: string | null;
  verified: boolean;
  rejection_reason: string | null;
}

export async function getMyKycDocuments(): Promise<KYCDocument[]> {
  const res = await apiAuthGet<{ documents: KYCDocument[] }>(
    "/users/me/kyc-documents",
  );
  return res.documents;
}

export async function uploadKycDocument(
  documentType: KYCDocumentType,
  file: { uri: string; name: string; mimeType?: string },
): Promise<{ status: number; message: string; document: KYCDocument }> {
  const formData = new FormData();
  formData.append("document_type", documentType);
  formData.append("file", {
    uri: file.uri,
    name: file.name,
    type: file.mimeType || "application/octet-stream",
  } as unknown as Blob);
  return apiAuthUpload("/users/me/kyc-documents", formData);
}

// Account-wide, reusable supporting documents (bank statement, payslip/
// business proof, land title, URA TIN) — separate from KYCDocument
// (identity) and satisfy a lender's required_documents once uploaded, for
// every current and future offer that asks for the same thing.
export type BorrowerDocumentType = "bank_statement" | "business_proof" | "land_title" | "ura_tin";

export interface BorrowerDocument {
  id: string;
  document_type: BorrowerDocumentType | string;
  file_url: string;
  file_name: string | null;
  verified: boolean;
}

export async function getMyBorrowerDocuments(): Promise<BorrowerDocument[]> {
  const res = await apiAuthGet<{ documents: BorrowerDocument[] }>("/users/me/documents");
  return res.documents;
}

export async function uploadBorrowerDocument(
  documentType: BorrowerDocumentType,
  file: { uri: string; name: string; mimeType?: string },
): Promise<{ status: number; message: string; document: BorrowerDocument }> {
  const formData = new FormData();
  formData.append("document_type", documentType);
  formData.append("file", {
    uri: file.uri,
    name: file.name,
    type: file.mimeType || "application/octet-stream",
  } as unknown as Blob);
  return apiAuthUpload("/users/me/documents", formData);
}

export async function submitCustomDocumentResponse(
  applicationId: string,
  label: string,
  data: { textResponse?: string; file?: { uri: string; name: string; mimeType?: string } },
): Promise<{ status: number; message: string }> {
  const formData = new FormData();
  formData.append("label", label);
  if (data.textResponse) formData.append("text_response", data.textResponse);
  if (data.file) {
    formData.append("file", {
      uri: data.file.uri,
      name: data.file.name,
      type: data.file.mimeType || "application/octet-stream",
    } as unknown as Blob);
  }
  return apiAuthUpload(`/loans/applications/${applicationId}/custom-document-response`, formData);
}

export async function submitLoanApplication(data: {
  amount: number;
  duration?: number;
  durationDays?: number;
  loanType: string;
  purpose?: string;
  maxInterestRate?: number;
  validUntil?: string;
}): Promise<{ referenceNumber: string; applicationId: string }> {
  const res = await apiAuthPost<{
    status: number;
    message: string;
    application: RawApplication;
  }>("/loans/applications", {
    amount: data.amount,
    duration: data.duration,
    duration_days: data.durationDays,
    loan_type: data.loanType,
    purpose: data.purpose,
    max_interest_rate: data.maxInterestRate,
    valid_until: data.validUntil,
  });
  return {
    referenceNumber: res.application.reference_number,
    applicationId: res.application.id,
  };
}

export async function updateApplication(
  id: string,
  data: Partial<{
    amount: number;
    duration: number | null;
    durationDays: number | null;
    loanType: string;
    purpose: string;
    maxInterestRate: number | null;
    validUntil: string | null;
  }>,
): Promise<LoanApplication> {
  const res = await apiAuthPut<{ status: number; message: string; application: RawApplication }>(
    `/loans/applications/${id}`,
    {
      amount: data.amount,
      duration: data.duration,
      duration_days: data.durationDays,
      loan_type: data.loanType,
      purpose: data.purpose,
      max_interest_rate: data.maxInterestRate,
      valid_until: data.validUntil,
    },
  );
  return mapApplication(res.application);
}

export async function deleteApplication(id: string): Promise<void> {
  await apiAuthDelete(`/loans/applications/${id}`);
}

export async function freezeApplication(id: string): Promise<LoanApplication> {
  const res = await apiAuthPost<{ status: number; message: string; application: RawApplication }>(
    `/loans/applications/${id}/freeze`,
    {},
  );
  return mapApplication(res.application);
}

export async function unfreezeApplication(id: string): Promise<LoanApplication> {
  const res = await apiAuthPost<{ status: number; message: string; application: RawApplication }>(
    `/loans/applications/${id}/unfreeze`,
    {},
  );
  return mapApplication(res.application);
}

// The apply wizard's resume-where-you-left-off check — an application that
// exists but hasn't had its guarantors attached yet is, by definition, an
// unfinished draft (see GET /loans/applications/draft on the backend).
export async function fetchDraftApplication(): Promise<LoanApplication | null> {
  const res = await apiAuthGet<{ draft: RawApplication | null }>("/loans/applications/draft");
  if (!res.draft) return null;
  return mapApplication(res.draft);
}

// ─── Offers ──────────────────────────────────────────────

export async function fetchBorrowerOffers(
  applicationId: string,
): Promise<LoanOffer[]> {
  const application = await fetchApplicationDetail(applicationId);
  return application.offers ?? [];
}

/** Every offer the borrower has ever received, across every application —
 * powers the "Browse Offers" screen when opened with no specific request
 * selected (mirrors mpola_website's /dashboard/offers-received default view). */
export async function fetchAllOffersReceived(): Promise<LoanOffer[]> {
  const res = await apiAuthGet<{ total: number; offers: RawOffer[] }>(
    "/loans/offers/received?limit=100",
  );
  return res.offers.map(mapOffer);
}

export async function respondToOffer(
  offerId: string,
  status: "accepted" | "declined",
  note?: string,
): Promise<{ status: number; message: string }> {
  return apiAuthPut(`/loans/offers/${offerId}`, { status, note: note || undefined });
}

// ─── Lender Dashboard ───────────────────────────────────

export async function fetchLenderDashboard() {
  const [profile, portfolio, earnings, marketplace] = await Promise.all([
    apiAuthGet<{ full_name: string | null }>("/users/me"),
    fetchPortfolio(),
    fetchLenderEarnings(),
    fetchMarketplace(),
  ]);

  const [firstName, ...rest] = (profile.full_name ?? "").split(" ");
  const activeLoans = portfolio.filter(
    (l) => l.status === "active" || l.status === "overdue",
  );
  const totalPaid = portfolio.reduce((sum, l) => sum + (l.totalPaid ?? 0), 0);
  const totalOwed = portfolio.reduce((sum, l) => sum + l.totalRepayable, 0);

  return {
    user: { firstName: firstName || "", lastName: rest.join(" ") },
    stats: {
      totalDeployed: earnings.totalDeployed,
      activeLoans: activeLoans.length,
      monthlyReturn: earnings.thisMonthEarned,
      repaymentRate: totalOwed ? Math.round((totalPaid / totalOwed) * 100) : 0,
      totalEarned: earnings.totalEarned,
      thisMonthEarned: earnings.thisMonthEarned,
      pendingAmount: 0,
      projectedAmount: 0,
    },
    recentActivity: activeLoans.slice(0, 3),
    newMatches: marketplace.total,
  };
}

// ─── Marketplace (Lender browse) ────────────────────────

export async function fetchMarketplace(
  page: number = 1,
  pageSize: number = 20,
  filters?: {
    loanType?: string;
    minAmount?: number;
    maxAmount?: number;
  },
): Promise<{ applications: MarketplaceApplication[]; total: number }> {
  const params = new URLSearchParams();
  params.set("skip", String((page - 1) * pageSize));
  params.set("limit", String(pageSize));
  if (filters?.loanType) params.set("loan_type", filters.loanType);
  if (filters?.minAmount) params.set("min_amount", String(filters.minAmount));
  if (filters?.maxAmount) params.set("max_amount", String(filters.maxAmount));
  const res = await apiAuthGet<{
    total: number;
    applications: RawApplication[];
  }>(`/loans/marketplace?${params.toString()}`);
  return { applications: res.applications.map(mapApplication), total: res.total };
}

export async function skipApplication(applicationId: string): Promise<{ status: number; message: string }> {
  return apiAuthPost(`/loans/marketplace/${applicationId}/skip`, {});
}

export async function fetchMyOffers(): Promise<LoanOffer[]> {
  const res = await apiAuthGet<{ total: number; offers: RawOffer[] }>(
    "/loans/offers/mine",
  );
  return res.offers.map(mapOffer);
}

// ─── Make Offer ─────────────────────────────────────────

export async function makeOffer(data: {
  applicationId: string;
  amount: number;
  interestRate: number;
  duration?: number | null;
  durationDays?: number | null;
  requiredDocuments?: string[];
}): Promise<LoanOffer> {
  const res = await apiAuthPost<{
    status: number;
    message: string;
    offer: RawOffer;
  }>("/loans/offers", {
    application_id: data.applicationId,
    amount: data.amount,
    interest_rate: data.interestRate,
    duration: data.duration,
    duration_days: data.durationDays,
    required_documents: data.requiredDocuments ?? [],
  });
  return mapOffer(res.offer);
}

// ─── Standing Offer Templates ───────────────────────────

interface RawOfferTemplate {
  id: string;
  lender_id: string;
  max_amount: number;
  min_amount: number;
  interest_rate: number;
  max_duration: number | null;
  max_duration_days: number | null;
  accepted_loan_types: string[];
  required_documents: string[];
  description: string | null;
  valid_until: string | null;
  max_concurrent_loans: number | null;
  status: OfferTemplateStatus;
  is_frozen: boolean;
  frozen_by: "lender" | "admin" | null;
  created_at: string;
  matched_count: number;
  pending_count: number;
  accepted_count: number;
}

function mapOfferTemplate(t: RawOfferTemplate): OfferTemplate {
  return {
    id: t.id,
    lenderId: t.lender_id,
    maxAmount: t.max_amount,
    minAmount: t.min_amount,
    interestRate: t.interest_rate,
    maxDuration: t.max_duration,
    maxDurationDays: t.max_duration_days,
    acceptedLoanTypes: t.accepted_loan_types,
    requiredDocuments: t.required_documents,
    description: t.description,
    validUntil: t.valid_until,
    maxConcurrentLoans: t.max_concurrent_loans,
    status: t.status,
    isFrozen: t.is_frozen,
    frozenBy: t.frozen_by,
    createdAt: t.created_at,
    matchedCount: t.matched_count,
    pendingCount: t.pending_count,
    acceptedCount: t.accepted_count,
  };
}

function offerTemplatePayload(data: OfferTemplateInput) {
  return {
    max_amount: data.maxAmount,
    min_amount: data.minAmount,
    interest_rate: data.interestRate,
    max_duration: data.maxDuration,
    max_duration_days: data.maxDurationDays,
    accepted_loan_types: data.acceptedLoanTypes,
    required_documents: data.requiredDocuments,
    description: data.description,
    valid_until: data.validUntil,
    max_concurrent_loans: data.maxConcurrentLoans,
  };
}

export async function createOfferTemplate(
  data: OfferTemplateInput & { isDraft?: boolean },
): Promise<OfferTemplate> {
  const res = await apiAuthPost<{ status: number; message: string; template: RawOfferTemplate }>(
    "/loans/offer-templates",
    { ...offerTemplatePayload(data), is_draft: data.isDraft ?? false },
  );
  return mapOfferTemplate(res.template);
}

export async function fetchMyOfferTemplates(): Promise<OfferTemplate[]> {
  const res = await apiAuthGet<{ templates: RawOfferTemplate[] }>("/loans/offer-templates/mine");
  return res.templates.map(mapOfferTemplate);
}

export async function fetchOfferTemplateMatches(templateId: string): Promise<LoanOffer[]> {
  const res = await apiAuthGet<{ offers: RawOffer[] }>(
    `/loans/offer-templates/${templateId}/matches`,
  );
  return res.offers.map(mapOffer);
}

export async function updateOfferTemplate(
  id: string,
  data: Partial<OfferTemplateInput>,
): Promise<OfferTemplate> {
  const res = await apiAuthPut<{ status: number; message: string; template: RawOfferTemplate }>(
    `/loans/offer-templates/${id}`,
    offerTemplatePayload(data as OfferTemplateInput),
  );
  return mapOfferTemplate(res.template);
}

export async function deleteOfferTemplate(id: string): Promise<void> {
  await apiAuthDelete(`/loans/offer-templates/${id}`);
}

export async function freezeMyOfferTemplate(id: string): Promise<OfferTemplate> {
  const res = await apiAuthPost<{ status: number; message: string; template: RawOfferTemplate }>(
    `/loans/offer-templates/${id}/freeze`,
    {},
  );
  return mapOfferTemplate(res.template);
}

export async function unfreezeMyOfferTemplate(id: string): Promise<OfferTemplate> {
  const res = await apiAuthPost<{ status: number; message: string; template: RawOfferTemplate }>(
    `/loans/offer-templates/${id}/unfreeze`,
    {},
  );
  return mapOfferTemplate(res.template);
}

export async function extendOfferTemplateExpiry(
  id: string,
  validUntil: string | null,
): Promise<OfferTemplate> {
  const res = await apiAuthPut<{ status: number; message: string; template: RawOfferTemplate }>(
    `/loans/offer-templates/${id}/expiry`,
    { valid_until: validUntil },
  );
  return mapOfferTemplate(res.template);
}

// ─── Portfolio ──────────────────────────────────────────

export async function fetchPortfolio(): Promise<
  (Loan & { borrowerName: string; progress: number })[]
> {
  const res = await apiAuthGet<{ total: number; loans: RawLoan[] }>(
    "/loans/active?limit=100",
  );
  return res.loans.map(mapLoan).map((l) => ({
    ...l,
    borrowerName: l.borrowerName ?? "Unknown",
    progress: l.totalInstalments ? l.paidInstalments / l.totalInstalments : 0,
  }));
}

export async function approveDisbursement(loanId: string): Promise<void> {
  await apiAuthPost(`/loans/active/${loanId}/approve-disbursement`, {});
}

// ─── Lender Wallet ──────────────────────────────────────

export async function fetchLenderWallet(): Promise<Wallet> {
  return fetchWallet();
}

// ─── Earnings ───────────────────────────────────────────

interface RawLenderEarnings {
  total_deployed: number;
  active_loans: number;
  total_repaid: number;
  total_earned: number;
  this_month_earned: number;
  avg_yield: number;
  monthly_earnings: MonthlyEarning[];
  concentration_warning: { type: "borrower" | "loan_type"; label: string; pct: number } | null;
}

export async function fetchLenderEarnings(): Promise<LenderEarnings> {
  const raw = await apiAuthGet<RawLenderEarnings>("/loans/earnings");
  return {
    totalDeployed: raw.total_deployed,
    activeLoans: raw.active_loans,
    totalRepaid: raw.total_repaid,
    totalEarned: raw.total_earned,
    thisMonthEarned: raw.this_month_earned,
    avgYield: raw.avg_yield,
    monthlyEarnings: raw.monthly_earnings,
    concentrationWarning: raw.concentration_warning,
  };
}

// ─── Notifications ──────────────────────────────────────

interface RawNotification {
  id: string;
  title: string;
  message: string;
  type: string | null;
  data: string | null;
  is_read: boolean;
  created_at: string;
}

function mapNotification(n: RawNotification): Notification {
  let data: Record<string, unknown> | null = null;
  if (n.data) {
    try {
      data = JSON.parse(n.data);
    } catch {
      data = null;
    }
  }
  return {
    id: n.id,
    title: n.title,
    message: n.message,
    type: n.type,
    data,
    read: n.is_read,
    timestamp: n.created_at,
  };
}

export async function fetchNotifications(): Promise<Notification[]> {
  const res = await apiAuthGet<{
    total: number;
    unread: number;
    notifications: RawNotification[];
  }>("/notifications/?limit=50");
  return res.notifications.map(mapNotification);
}

// Paginated — for the full Notifications screens, which can't just render a
// flat 50-item cap once a real account accumulates hundreds of
// notifications. skip/limit drive an infinite-scroll "Load More" list.
export async function fetchNotificationsPage(
  skip: number,
  limit: number = 20,
): Promise<{ notifications: Notification[]; total: number; unread: number }> {
  const res = await apiAuthGet<{
    total: number;
    unread: number;
    notifications: RawNotification[];
  }>(`/notifications/?skip=${skip}&limit=${limit}`);
  return {
    notifications: res.notifications.map(mapNotification),
    total: res.total,
    unread: res.unread,
  };
}

export async function markNotificationRead(id: string): Promise<void> {
  await apiAuthPut(`/notifications/${id}/read`, {});
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiAuthPost("/notifications/read-all", {});
}

// ─── Referrals ────────────────────────────────────────────

export interface ReferralInfo {
  referral_code: string;
  referral_link: string;
  total_referred: number;
  bonus_per_referral: number;
  total_earned: number;
  referred_users: { full_name: string | null; role: string; created_at: string }[];
}

export async function fetchReferralInfo(): Promise<ReferralInfo> {
  return apiAuthGet("/referrals/me");
}

// ─── Support tickets ────────────────────────────────────────

export interface SupportMessage {
  id: string;
  message: string;
  is_admin: boolean;
  sender_name: string | null;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  subject: string;
  category: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  created_at: string;
  message_count: number;
  messages?: SupportMessage[];
}

export async function createSupportTicket(data: {
  subject: string;
  category: string;
  message: string;
}): Promise<SupportTicket> {
  const res = await apiAuthPost<{ ticket: SupportTicket }>("/support", data);
  return res.ticket;
}

export async function fetchMySupportTickets(): Promise<SupportTicket[]> {
  const res = await apiAuthGet<{ tickets: SupportTicket[] }>("/support/mine");
  return res.tickets;
}

export async function fetchSupportTicket(id: string): Promise<SupportTicket> {
  const res = await apiAuthGet<{ ticket: SupportTicket }>(`/support/${id}`);
  return res.ticket;
}

export async function replySupportTicket(id: string, message: string): Promise<SupportTicket> {
  const res = await apiAuthPost<{ ticket: SupportTicket }>(`/support/${id}/messages`, { message });
  return res.ticket;
}

// ─── Disputes ───────────────────────────────────────────────

export interface DisputeMessage {
  id: string;
  sender_id: string | null;
  sender_name: string | null;
  is_admin: boolean;
  message: string;
  created_at: string;
}

export interface DisputeProposal {
  proposed_by_id: string;
  proposed_by_name: string | null;
  note: string | null;
  settlement_amount: number | null;
  settlement_payer_id: string | null;
  settlement_payer_name: string | null;
  status: "pending" | "accepted" | "declined";
}

export interface Dispute {
  id: string;
  user_id: string;
  filer_name: string | null;
  respondent_id: string | null;
  respondent_name: string | null;
  category: string;
  description: string;
  status: "open" | "investigating" | "resolved" | "rejected";
  loan_id: string | null;
  resolution_note: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  proposal: DisputeProposal | null;
  message_count: number;
  messages?: DisputeMessage[];
}

export async function fileDispute(data: {
  category: string;
  description: string;
  loan_id?: string;
}): Promise<Dispute> {
  const res = await apiAuthPost<{ dispute: Dispute }>("/disputes", data);
  return res.dispute;
}

export async function fetchMyDisputes(): Promise<Dispute[]> {
  const res = await apiAuthGet<{ disputes: Dispute[] }>("/disputes/mine");
  return res.disputes;
}

export async function fetchDispute(id: string): Promise<Dispute> {
  const res = await apiAuthGet<{ dispute: Dispute }>(`/disputes/${id}`);
  return res.dispute;
}

export async function postDisputeMessage(id: string, message: string): Promise<DisputeMessage> {
  const res = await apiAuthPost<{ message_data: DisputeMessage }>(`/disputes/${id}/messages`, { message });
  return res.message_data;
}

export async function proposeDisputeResolution(
  id: string,
  data: { note: string; settlementAmount?: number; payer: "self" | "other" },
): Promise<Dispute> {
  const res = await apiAuthPost<{ dispute: Dispute }>(`/disputes/${id}/propose`, {
    note: data.note,
    settlement_amount: data.settlementAmount,
    payer: data.payer,
  });
  return res.dispute;
}

export async function respondToDisputeProposal(id: string, accept: boolean): Promise<Dispute> {
  const res = await apiAuthPost<{ dispute: Dispute }>(`/disputes/${id}/respond-proposal`, { accept });
  return res.dispute;
}

export async function escalateDispute(id: string): Promise<Dispute> {
  const res = await apiAuthPost<{ dispute: Dispute }>(`/disputes/${id}/escalate`, {});
  return res.dispute;
}

// Reuses /loans/active, which despite the name returns every loan (any
// status) the current user is on as either borrower or lender — exactly
// what's needed to pick "which loan is this dispute about."
export async function fetchMyLoansForDispute(): Promise<Loan[]> {
  const res = await apiAuthGet<{ total: number; loans: RawLoan[] }>("/loans/active?limit=100");
  return res.loans.map(mapLoan);
}

// ─── Login sessions ─────────────────────────────────────────

export interface LoginSessionInfo {
  id: string;
  device_label: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  is_most_recent: boolean;
}

export async function fetchLoginSessions(): Promise<LoginSessionInfo[]> {
  const res = await apiAuthGet<{ sessions: LoginSessionInfo[] }>("/sessions/");
  return res.sessions;
}

export async function signOutEverywhere(): Promise<{ status: number; message: string }> {
  return apiAuthPost("/sessions/sign-out-everywhere", {});
}
