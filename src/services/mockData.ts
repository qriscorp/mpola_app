import type {
  User,
  Loan,
  Wallet,
  BorrowerStats,
  LenderStats,
  Notification,
  EarningsBreakdown,
  MonthlyEarning,
  PaymentDetails,
} from "../models";

// ─── Borrower Mock Data ─────────────────────────────────────

export const borrowerUser: User = {
  id: "b1",
  fullName: "Sarah Nakato",
  email: "sarah.n@email.com",
  phone: "+256 772 456 789",
  nin: "CM940XXXXXXX",
  role: "borrower",
  accountType: "individual",
  kycVerified: true,
  createdAt: "2024-06-15",
};

export const borrowerStats: BorrowerStats = {
  loansTaken: 2,
  paymentsRepaid: 7,
  totalPayments: 12,
  creditScore: 720,
};

export const activeLoan: Loan = {
  id: "l1",
  borrowerId: "b1",
  lenderId: "lend1",
  amount: 2000000,
  duration: 12,
  type: "personal",
  interestRate: 2.5,
  monthlyPayment: 574000,
  totalRepayable: 2120000,
  status: "active",
  paidInstalments: 7,
  totalInstalments: 12,
  nextPaymentDate: "2025-05-01",
  nextPaymentAmount: 574000,
  createdAt: "2024-10-01",
};

export const borrowerWallet: Wallet = {
  balance: 512000,
  isWalletSetup: true,
  transactions: [
    {
      id: "t1",
      type: "disbursement",
      amount: 2000000,
      description: "Loan Disbursed",
      date: "Apr 10",
      counterparty: "Joseph M.",
    },
    {
      id: "t2",
      type: "repayment",
      amount: -354000,
      description: "Payment — Instalment 7",
      date: "Apr 18",
    },
    {
      id: "t3",
      type: "top_up",
      amount: 500000,
      description: "Top Up via MoMo",
      date: "Apr 15",
    },
    {
      id: "t4",
      type: "repayment",
      amount: -354000,
      description: "Payment — Instalment 6",
      date: "Mar 18",
    },
  ],
};


export const paymentDetails: PaymentDetails = {
  amount: 354000,
  method: "wallet",
  processingFee: 0,
  totalDeducted: 354000,
  instalmentNumber: 7,
  totalInstalments: 12,
  dueDate: "May 1",
};

// ─── Lender Mock Data ─────────────────────────────────────

export const lenderUser: User = {
  id: "lend1",
  fullName: "Joseph Mwesigwa",
  email: "joseph.m@email.com",
  phone: "+256 776 543 210",
  nin: "CM850XXXXXXX",
  role: "lender",
  accountType: "individual",
  kycVerified: true,
  createdAt: "2024-01-15",
};

export const lenderStats: LenderStats = {
  totalDeployed: 12400000,
  activeLoans: 8,
  monthlyReturn: 186000,
  repaymentRate: 94,
  totalEarned: 1860000,
  thisMonthEarned: 186000,
  pendingAmount: 574000,
  projectedAmount: 210000,
};

export const portfolioLoans: Loan[] = [
  {
    id: "pl1",
    borrowerId: "b1",
    lenderId: "lend1",
    amount: 2000000,
    duration: 12,
    type: "personal",
    interestRate: 2.5,
    monthlyPayment: 574000,
    totalRepayable: 2400000,
    status: "active",
    paidInstalments: 7,
    totalInstalments: 12,
    createdAt: "2024-06-01",
  },
  {
    id: "pl2",
    borrowerId: "b2",
    lenderId: "lend1",
    amount: 5000000,
    duration: 12,
    type: "business",
    interestRate: 3.0,
    monthlyPayment: 720000,
    totalRepayable: 6000000,
    status: "active",
    paidInstalments: 4,
    totalInstalments: 12,
    nextPaymentDate: "2025-05-01",
    nextPaymentAmount: 720000,
    createdAt: "2024-12-01",
  },
  {
    id: "pl3",
    borrowerId: "b3",
    lenderId: "lend1",
    amount: 800000,
    duration: 5,
    type: "personal",
    interestRate: 3.5,
    monthlyPayment: 160000,
    totalRepayable: 800000,
    status: "overdue",
    paidInstalments: 2,
    totalInstalments: 5,
    createdAt: "2025-01-15",
  },
  {
    id: "pl4",
    borrowerId: "b4",
    lenderId: "lend1",
    amount: 8000000,
    duration: 18,
    type: "business",
    interestRate: 3.5,
    monthlyPayment: 574000,
    totalRepayable: 10330000,
    status: "active",
    paidInstalments: 4,
    totalInstalments: 18,
    createdAt: "2024-12-15",
  },
];

export const portfolioBorrowerNames: Record<string, string> = {
  pl1: "A. Nakato",
  pl2: "B. Kiwanuka",
  pl3: "C. Opio",
  pl4: "D. Ssemwogerere",
};

export const lenderNotifications: Notification[] = [
  {
    id: "n1",
    title: "Offer Accepted!",
    message:
      "D. Ssemwogerere accepted your offer of UGX 8,000,000 at 3.5%/month",
    type: "offer_accepted",
    read: false,
    timestamp: "2 hours ago",
  },
  {
    id: "n2",
    title: "Repayment Received",
    message: "A. Nakato paid UGX 574,000 — instalment 7 of 12",
    type: "repayment",
    read: false,
    timestamp: "Yesterday",
  },
  {
    id: "n3",
    title: "Overdue Alert",
    message: "C. Opio — UGX 160,000 is 5 days overdue",
    type: "overdue",
    read: true,
    timestamp: "3 days ago",
  },
  {
    id: "n4",
    title: "3 New Borrower Matches",
    message: "New verified borrowers match your lending criteria",
    type: "new_matches",
    read: true,
    timestamp: "1 week ago",
  },
];

export const earningsBreakdown: EarningsBreakdown[] = [
  { borrowerName: "D. Ssemwogerere", totalEarnings: 2330000 },
  { borrowerName: "A. Nakato", totalEarnings: 720000 },
  { borrowerName: "B. Kiwanuka", totalEarnings: 2400000 },
];

export const monthlyEarnings: MonthlyEarning[] = [
  { month: "Nov", amount: 120000 },
  { month: "Dec", amount: 140000 },
  { month: "Jan", amount: 155000 },
  { month: "Feb", amount: 165000 },
  { month: "Mar", amount: 175000 },
  { month: "Apr", amount: 186000 },
];
