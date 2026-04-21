import { z } from "zod";

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
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[0-9]/, "Must contain a number"),
  accountType: z.enum(["individual", "business", "company"]),
  agreed: z.literal(true, {
    errorMap: () => ({ message: "You must agree to the terms" }),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ─── Loan Application Schema ──────────────────────────────

export const loanDetailsSchema = z.object({
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((v) => Number(v) >= 100000, "Minimum loan is UGX 100,000")
    .refine((v) => Number(v) <= 50000000, "Maximum loan is UGX 50,000,000"),
  duration: z.number().min(3).max(24),
  loanType: z.enum(["personal", "business", "real_estate", "education"]),
});

export type LoanDetailsInput = z.infer<typeof loanDetailsSchema>;

// ─── Lender Make Offer Schema ─────────────────────────────

export const makeOfferSchema = z.object({
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((v) => Number(v) >= 100000, "Minimum offer is UGX 100,000"),
  rate: z
    .string()
    .min(1, "Interest rate is required")
    .refine((v) => Number(v) > 0 && Number(v) <= 10, "Rate must be 0.1% - 10%"),
  duration: z
    .string()
    .min(1, "Duration is required")
    .refine((v) => Number(v) >= 1 && Number(v) <= 36, "Duration: 1-36 months"),
});

export type MakeOfferInput = z.infer<typeof makeOfferSchema>;

// ─── Profile Edit Schema ──────────────────────────────────

export const editProfileSchema = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 characters"),
  phone: z
    .string()
    .min(9, "Phone number is required")
    .regex(/^\d{9,10}$/, "Enter 9-10 digits"),
});

export type EditProfileInput = z.infer<typeof editProfileSchema>;
