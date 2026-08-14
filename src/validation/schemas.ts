import { z } from "zod";
import { passwordRequirementErrors, PASSWORD_REQUIREMENTS_HINT } from "./password";

// ─── Auth Schemas ─────────────────────────────────────────

export const registerSchema = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 characters"),
  nin: z
    .string()
    .min(10, "NIN must be at least 10 characters")
    .regex(/^[A-Z]{2}\d+[A-Z]*$/, "Invalid NIN format"),
  phone: z
    .string()
    .min(9, "Phone number is required")
    .regex(/^\d{9,10}$/, "Enter 9-10 digits without country code"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, PASSWORD_REQUIREMENTS_HINT)
    .refine((pw) => passwordRequirementErrors(pw).length === 0, {
      message: PASSWORD_REQUIREMENTS_HINT,
    }),
  accountType: z.enum(["individual", "business", "company"]),
  agreed: z.literal(true, {
    errorMap: () => ({ message: "You must agree to the terms" }),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email or phone is required")
    .refine(
      (value) => {
        const trimmed = value.trim();
        const digits = trimmed.replace(/\D/g, "");
        const looksLikePhone = /^\d{9,12}$/.test(digits);
        const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
        return looksLikePhone || looksLikeEmail;
      },
      { message: "Enter a valid email or phone number" },
    ),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ─── Loan Application Schema ──────────────────────────────

// A factory, not a static schema — the amount bounds are admin-configurable
// (Settings > Min/Max Loan Amount) and fetched live via
// fetchApplicationEligibility, so they can't be hardcoded here without
// drifting from whatever the server will actually accept.
export const makeLoanDetailsSchema = (minAmount: number, maxAmount: number) =>
  z
    .object({
      amount: z
        .string()
        .min(1, "Amount is required")
        .refine((v) => Number(v) >= minAmount, `Minimum loan is UGX ${minAmount.toLocaleString()}`)
        .refine((v) => Number(v) <= maxAmount, `Maximum loan is UGX ${maxAmount.toLocaleString()}`),
      // Exactly one of these two — duration (months, standard) or
      // durationDays (1-29, "emergency" single bullet repayment). Mirrors
      // mpola_api's LoanApplicationCreate.check_duration.
      duration: z.number().min(1).max(24).nullable(),
      durationDays: z.number().min(1).max(29).nullable(),
      loanType: z.enum([
        "personal",
        "business",
        "education",
        "agricultural",
        "emergency",
      ]),
    })
    .refine((v) => (v.duration == null) !== (v.durationDays == null), {
      message: "Choose a duration",
      path: ["duration"],
    });

export type LoanDetailsInput = z.infer<ReturnType<typeof makeLoanDetailsSchema>>;

// ─── Lender Make Offer Schema ─────────────────────────────

// A factory, not a static schema — amount/rate bounds are admin-configurable
// (Settings > Min/Max Loan Amount, Max Interest Rate) and fetched live via
// fetchLendingLimits, so they can't be hardcoded here without drifting from
// whatever the server will actually accept.
export const makeMakeOfferSchema = (minAmount: number, maxAmount: number, maxRate: number) =>
  z.object({
    amount: z
      .string()
      .min(1, "Amount is required")
      .refine((v) => Number(v) >= minAmount, `Minimum offer is UGX ${minAmount.toLocaleString()}`)
      .refine((v) => Number(v) <= maxAmount, `Maximum offer is UGX ${maxAmount.toLocaleString()}`),
    rate: z
      .string()
      .min(1, "Interest rate is required")
      .refine((v) => Number(v) > 0 && Number(v) <= maxRate, `Rate must be 0.1% - ${maxRate}%`),
    duration: z
      .string()
      .min(1, "Duration is required")
      .refine((v) => Number(v) >= 1 && Number(v) <= 36, "Duration: 1-36 months"),
  });

export type MakeOfferInput = z.infer<ReturnType<typeof makeMakeOfferSchema>>;

// ─── Profile Edit Schema ──────────────────────────────────

export const editProfileSchema = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 characters"),
  phone: z
    .string()
    .min(9, "Phone number is required")
    .regex(/^\d{9,10}$/, "Enter 9-10 digits"),
});

export type EditProfileInput = z.infer<typeof editProfileSchema>;
