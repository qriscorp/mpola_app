/**
 * API service layer — simulates network requests with mock data.
 * When connecting real APIs, replace the body of each function
 * with actual fetch/axios calls. The viewmodel hooks stay the same.
 */
import type {
  User,
  Loan,
  LoanOffer,
  Wallet,
  Transaction,
  TransactionType,
  BorrowerStats,
  LenderStats,
  BorrowerProfile,
  LenderProfile,
  Notification,
  EarningsBreakdown,
  MonthlyEarning,
} from "../models";
import * as mock from "./mockData";
import { apiAuthGet } from "./auth";
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

// ─── Offers ──────────────────────────────────────────────

export async function fetchBorrowerOffers(): Promise<LoanOffer[]> {
  await delay();
  return mock.borrowerOffers;
}

export async function acceptOffer(offerId: string): Promise<boolean> {
  await delay(1000);
  return true;
}

// ─── Payments ────────────────────────────────────────────

export async function submitPayment(data: {
  method: string;
  amount: number;
}): Promise<{ transactionId: string; date: string }> {
  await delay(1500);
  return { transactionId: "TXN-20250418-7821", date: "Apr 18, 9:41 AM" };
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
