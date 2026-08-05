/**
 * API service layer — simulates network requests with mock data.
 * When connecting real APIs, replace the body of each function
 * with actual fetch/axios calls. The viewmodel hooks stay the same.
 */
import type {
  User,
  Loan,
  LoanStatus,
  LoanOffer,
  Wallet,
  Transaction,
  TransactionType,
  BankOption,
  CardDepositInitiateResult,
  TransferStatusResult,
  BorrowerStats,
  LenderStats,
  BorrowerProfile,
  LenderProfile,
  Notification,
  EarningsBreakdown,
  MonthlyEarning,
} from "../models";
import * as mock from "./mockData";
import { apiAuthGet, apiAuthPost } from "./auth";
import type { RegisterInput, LoginInput, MakeOfferInput } from "../validation";

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
}): Promise<{ status: number; message: string; balance: number }> {
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

// ─── Auth ────────────────────────────────────────────────

export async function apiRegister(
  data: RegisterInput & { role: "borrower" | "lender" },
): Promise<User> {
  await delay(1500);
  return data.role === "borrower" ? mock.borrowerUser : mock.lenderUser;
}

export async function apiLogin(_data: LoginInput): Promise<User> {
  await delay(1000);
  return mock.borrowerUser;
}

// ─── Borrower Dashboard ──────────────────────────────────

export async function fetchBorrowerDashboard() {
  await delay();
  return {
    user: { firstName: "Sarah", lastName: "N." },
    stats: mock.borrowerStats,
    loan: mock.activeLoan,
    walletBalance: mock.borrowerWallet.balance,
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

function mapLoan(raw: RawLoan): Loan {
  return {
    id: raw.id,
    borrowerId: raw.borrower_id,
    lenderId: raw.lender_id,
    amount: raw.amount,
    duration: raw.duration,
    type: "personal", // the active-loan API doesn't return a loan type today
    interestRate: raw.interest_rate,
    monthlyPayment: raw.monthly_payment,
    totalRepayable: raw.total_repayable,
    status: raw.status as LoanStatus,
    paidInstalments: raw.paid_instalments,
    totalInstalments: raw.total_instalments,
    nextPaymentDate: raw.next_payment_date ?? undefined,
    nextPaymentAmount: raw.next_payment_amount ?? undefined,
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

export async function makeRepayment(data: {
  loanId: string;
  amount: number;
  paymentMethod: "wallet" | "mobile_money";
  phoneNumber?: string;
  carrier?: string;
}): Promise<{
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
    transactionId: res.repayment.transaction_id ?? res.repayment.id,
    date: res.repayment.created_at,
    amount: res.repayment.amount,
    paymentMethod: res.repayment.payment_method ?? data.paymentMethod,
    instalmentNumber: res.repayment.instalment_number,
    loan: mapLoan(res.loan),
  };
}

// ─── Offers ──────────────────────────────────────────────

export async function fetchBorrowerOffers(): Promise<LoanOffer[]> {
  await delay();
  return mock.borrowerOffers;
}

export async function acceptOffer(offerId: string): Promise<boolean> {
  await delay(1000);
  return true;
}

// ─── Loan Application ───────────────────────────────────

export async function submitLoanApplication(): Promise<{
  referenceNumber: string;
}> {
  await delay(1500);
  return { referenceNumber: "LF-2025-04-8821" };
}

// ─── Lender Dashboard ───────────────────────────────────

export async function fetchLenderDashboard() {
  await delay();
  const recentActivity = mock.portfolioLoans.slice(0, 3).map((loan) => ({
    ...loan,
    borrowerName: mock.portfolioBorrowerNames[loan.id] ?? "Unknown",
  }));
  return {
    user: { firstName: "Joseph", lastName: "M." },
    stats: mock.lenderStats,
    recentActivity,
    newMatches: 3,
  };
}

// ─── Browse Borrowers ───────────────────────────────────

export async function fetchBorrowerProfiles(): Promise<BorrowerProfile[]> {
  await delay();
  return mock.borrowerProfiles;
}

// ─── Lender Profiles (for borrower to pick) ─────────────

export async function fetchLenderProfiles(): Promise<LenderProfile[]> {
  await delay();
  return mock.lenderProfiles;
}

// ─── Make Offer ─────────────────────────────────────────

export async function sendLendingOffer(
  _data: MakeOfferInput,
): Promise<boolean> {
  await delay(1500);
  return true;
}

// ─── Portfolio ──────────────────────────────────────────

export async function fetchPortfolio(): Promise<
  (Loan & { borrowerName: string; progress: number })[]
> {
  await delay();
  return mock.portfolioLoans.map((l) => ({
    ...l,
    borrowerName: mock.portfolioBorrowerNames[l.id] ?? "Unknown",
    progress: l.paidInstalments / l.totalInstalments,
  }));
}

// ─── Lender Wallet ──────────────────────────────────────

export async function fetchLenderWallet(): Promise<Wallet> {
  return fetchWallet();
}

// ─── Earnings ───────────────────────────────────────────

export async function fetchEarnings() {
  await delay();
  return {
    stats: mock.lenderStats,
    breakdown: mock.earningsBreakdown,
    monthly: mock.monthlyEarnings,
  };
}

// ─── Notifications ──────────────────────────────────────

export async function fetchNotifications(): Promise<Notification[]> {
  await delay();
  return mock.lenderNotifications;
}
