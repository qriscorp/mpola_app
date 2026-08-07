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
  Guarantor,
  Wallet,
  Transaction,
  TransactionType,
  BankOption,
  CardDepositInitiateResult,
  TransferStatusResult,
  BorrowerStats,
  LenderStats,
  Notification,
  MonthlyEarning,
  LenderEarnings,
} from "../models";
import {
  apiAuthGet,
  apiAuthPost,
  apiAuthPatch,
  apiAuthPut,
  apiAuthUpload,
  apiPublicGet,
  apiPublicPost,
} from "./auth";

const delay = (ms = 800) => new Promise((r) => setTimeout(r, ms));

// ─── Wallet (shared) ─────────────────────────────────────
// One wallet per user — borrower and lender portals hit the same endpoints.

interface RawWalletTransaction {
  id: string;
  amount: number;
  type: TransactionType;
  status: "pending" | "completed" | "failed";
  description: string | null;
  reference: string | null;
  counterparty: string | null;
  created_at: string;
}

const DEBIT_TYPES = new Set<TransactionType>(["withdrawal", "repayment"]);

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
  const signedAmount = DEBIT_TYPES.has(tx.type)
    ? -Math.abs(tx.amount)
    : Math.abs(tx.amount);
  return {
    id: tx.id,
    type: tx.type,
    amount: signedAmount,
    description: tx.description || TYPE_LABELS[tx.type],
    date: formatTxDate(tx.created_at),
    counterparty: tx.counterparty ?? undefined,
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

async function fetchWallet(): Promise<Wallet> {
  const [walletRes, txRes] = await Promise.all([
    apiAuthGet<{ balance: number; is_wallet_setup: boolean }>("/wallet/"),
    apiAuthGet<{ total: number; transactions: RawWalletTransaction[] }>(
      "/wallet/transactions",
    ),
  ]);
  return {
    balance: walletRes.balance,
    isWalletSetup: walletRes.is_wallet_setup,
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
  is_phone_verified: boolean;
  two_factor_enabled?: boolean;
  profile_pic: string | null;
  created_at: string;
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
    isPhoneVerified: p.is_phone_verified,
    twoFactorEnabled: p.two_factor_enabled ?? false,
    profileImage: p.profile_pic ?? undefined,
    createdAt: p.created_at,
  };
}

export async function fetchProfile(): Promise<User> {
  const p = await apiAuthGet<RawProfile>("/users/me");
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

interface RawLoan {
  id: string;
  borrower_id: string;
  lender_id: string;
  borrower_name?: string | null;
  lender_name?: string | null;
  amount: number;
  interest_rate: number;
  duration: number;
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
    borrowerId: raw.borrower_id,
    lenderId: raw.lender_id,
    borrowerName: raw.borrower_name ?? null,
    lenderName: raw.lender_name ?? null,
    amount: raw.amount,
    duration: raw.duration,
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
    createdAt: raw.created_at,
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

interface RawOffer {
  id: string;
  application_id: string;
  lender_id: string;
  lender_name: string | null;
  amount: number;
  interest_rate: number;
  duration: number;
  monthly_payment: number | null;
  total_repayable: number | null;
  status: string;
  created_at: string;
}

interface RawGuarantor {
  id: string;
  name: string;
  phone: string;
  relationship_type: string | null;
  status: string;
}

interface RawApplication {
  id: string;
  reference_number: string;
  amount: number;
  duration: number;
  loan_type: string;
  purpose: string | null;
  status: string;
  interest_rate: number | null;
  monthly_payment: number | null;
  total_repayable: number | null;
  created_at: string;
  borrower: RawApplicationBorrower | null;
  offers_count: number;
  pending_offers_count: number;
  offers?: RawOffer[];
  guarantors?: RawGuarantor[];
}

function mapOffer(o: RawOffer): LoanOffer {
  return {
    id: o.id,
    applicationId: o.application_id,
    lenderId: o.lender_id,
    lenderName: o.lender_name,
    amount: o.amount,
    interestRate: o.interest_rate,
    duration: o.duration,
    monthlyPayment: o.monthly_payment,
    totalRepayable: o.total_repayable,
    status: o.status as OfferStatus,
    createdAt: o.created_at,
  };
}

function mapGuarantor(g: RawGuarantor): Guarantor {
  return {
    id: g.id,
    name: g.name,
    phone: g.phone,
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
    loanType: a.loan_type as LoanType,
    purpose: a.purpose,
    status: a.status as ApplicationStatus,
    interestRate: a.interest_rate,
    monthlyPayment: a.monthly_payment,
    totalRepayable: a.total_repayable,
    createdAt: a.created_at,
    borrower: a.borrower ? mapApplicationBorrower(a.borrower) : null,
    offersCount: a.offers_count,
    pendingOffersCount: a.pending_offers_count,
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

export async function addGuarantor(
  applicationId: string,
  data: { name: string; phone: string; relationshipType?: string },
): Promise<{ status: number; message: string }> {
  return apiAuthPost(`/loans/applications/${applicationId}/guarantors`, {
    name: data.name,
    phone: data.phone,
    relationship_type: data.relationshipType,
  });
}

// ─── Guarantor confirmation — public, the guarantor has no account ──

export async function fetchGuarantorInvite(token: string): Promise<{
  guarantor: { id: string; name: string; status: string };
  application: {
    id: string | null;
    amount: number | null;
    duration: number | null;
    loanType: string | null;
    borrowerName: string | null;
  };
}> {
  const res = await apiPublicGet<{
    guarantor: { id: string; name: string; status: string };
    application: {
      id: string | null;
      amount: number | null;
      duration: number | null;
      loan_type: string | null;
      borrower_name: string | null;
    };
  }>(`/loans/guarantors/${token}`);
  return {
    guarantor: res.guarantor,
    application: {
      id: res.application.id,
      amount: res.application.amount,
      duration: res.application.duration,
      loanType: res.application.loan_type,
      borrowerName: res.application.borrower_name,
    },
  };
}

export async function respondToGuarantorInvite(
  token: string,
  status: "accepted" | "declined",
): Promise<{ status: number; message: string }> {
  return apiPublicPost(`/loans/guarantors/${token}/respond`, { status });
}

export async function uploadLoanDocument(
  applicationId: string,
  file: { uri: string; name: string; mimeType?: string },
  documentType: string,
): Promise<{
  status: number;
  message: string;
  document: {
    id: string;
    document_type: string;
    file_url: string;
    file_name: string | null;
    verified: boolean;
  };
}> {
  const formData = new FormData();
  formData.append("document_type", documentType);
  // React Native's FormData expects this shape for files, not a real Blob.
  formData.append("file", {
    uri: file.uri,
    name: file.name,
    type: file.mimeType || "application/octet-stream",
  } as unknown as Blob);
  return apiAuthUpload(
    `/loans/applications/${applicationId}/documents`,
    formData,
  );
}

// ─── Account-level KYC documents (separate from per-application ones above) ───
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

export async function submitLoanApplication(data: {
  amount: number;
  duration: number;
  loanType: string;
  purpose?: string;
}): Promise<{ referenceNumber: string; applicationId: string }> {
  const res = await apiAuthPost<{
    status: number;
    message: string;
    application: RawApplication;
  }>("/loans/applications", {
    amount: data.amount,
    duration: data.duration,
    loan_type: data.loanType,
    purpose: data.purpose,
  });
  return {
    referenceNumber: res.application.reference_number,
    applicationId: res.application.id,
  };
}

// ─── Offers ──────────────────────────────────────────────

export async function fetchBorrowerOffers(
  applicationId: string,
): Promise<LoanOffer[]> {
  const application = await fetchApplicationDetail(applicationId);
  return application.offers ?? [];
}

export async function respondToOffer(
  offerId: string,
  status: "accepted" | "declined",
): Promise<{ status: number; message: string }> {
  return apiAuthPatch(`/loans/offers/${offerId}`, { status });
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
  duration: number;
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
  });
  return mapOffer(res.offer);
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
  };
}

// ─── Notifications ──────────────────────────────────────

interface RawNotification {
  id: string;
  title: string;
  message: string;
  type: string | null;
  is_read: boolean;
  created_at: string;
}

export async function fetchNotifications(): Promise<Notification[]> {
  const res = await apiAuthGet<{
    total: number;
    unread: number;
    notifications: RawNotification[];
  }>("/notifications/?limit=50");
  return res.notifications.map((n) => ({
    id: n.id,
    title: n.title,
    message: n.message,
    type: n.type,
    read: n.is_read,
    timestamp: n.created_at,
  }));
}

export async function markNotificationRead(id: string): Promise<void> {
  await apiAuthPatch(`/notifications/${id}/read`, {});
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiAuthPost("/notifications/read-all", {});
}

// ─── Referrals ────────────────────────────────────────────

export interface ReferralInfo {
  referral_code: string;
  referral_link: string;
  total_referred: number;
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

export interface Dispute {
  id: string;
  category: string;
  description: string;
  status: "open" | "investigating" | "resolved" | "rejected";
  loan_id: string | null;
  resolution_note: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
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
