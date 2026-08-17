import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import type { UserRole, AccountType } from "../models";
import { registerSchema, loginSchema } from "../validation";
import {
  apiRegister,
  apiLogin,
  apiVerifyLogin2FA,
  type AuthUser,
  type SignupDraftState,
} from "../services/auth";
import type { ZodError } from "zod";

type FieldErrors = Partial<Record<string, string>>;

function extractErrors(err: ZodError): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of err.issues) {
    const key = issue.path[0] as string;
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}

export function useAuthViewModel() {
  const [fullName, setFullName] = useState("");
  const [nin, setNin] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accountType, setAccountType] = useState<AccountType>("individual");
  const [agreed, setAgreed] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [signupDraft, setSignupDraft] = useState<SignupDraftState | null>(null);
  const [twoFactorUsername, setTwoFactorUsername] = useState<string | null>(null);

  const registerMutation = useMutation({
    mutationFn: (params: {
      fullName: string;
      nin: string;
      phone: string;
      email: string;
      password: string;
      accountType: string;
      role: "borrower" | "lender";
      agreedToTerms: boolean;
      referredByCode?: string;
    }) => apiRegister(params),
    onSuccess: (draft) => setSignupDraft(draft),
  });

  const loginMutation = useMutation({
    mutationFn: (params: { email: string; password: string }) =>
      apiLogin(params),
    onSuccess: (result) => {
      if (result.requires2FA) {
        setTwoFactorUsername(result.username);
      } else {
        setAuthUser(result.user);
      }
    },
  });

  const verifyTwoFactorMutation = useMutation({
    mutationFn: (params: { username: string; code: string }) =>
      apiVerifyLogin2FA(params.username, params.code),
    onSuccess: (user) => {
      setTwoFactorUsername(null);
      setAuthUser(user);
    },
  });

  const validate = () => {
    const result = registerSchema.safeParse({
      fullName,
      nin,
      phone,
      email,
      password,
      accountType,
      agreed,
    });
    if (!result.success) {
      setErrors(extractErrors(result.error));
      return false;
    }
    setErrors({});
    return true;
  };

  const canSubmit =
    !!fullName && !!nin && !!phone && !!email && !!password && agreed;

  const register = async (role: UserRole) => {
    if (!validate()) return false;
    try {
      await registerMutation.mutateAsync({
        fullName,
        nin,
        phone,
        email,
        password,
        accountType,
        role,
        agreedToTerms: agreed,
        referredByCode: referralCode.trim() || undefined,
      });
      return true;
    } catch (e: any) {
      setErrors({ email: e?.message || "Registration failed" });
      return false;
    }
  };

  // Returns the freshly-logged-in user directly, rather than relying on the
  // caller reading `authUser` state right after this resolves — setAuthUser()
  // below only takes effect on the *next* render, so a caller reading
  // `vm.authUser` synchronously after `await login()` would still see
  // whatever authUser was BEFORE this call (null on a first login, or the
  // previous session's user after a role switch — this was exactly why
  // logging in as a lender right after a borrower session landed back on
  // the borrower side: the stale closure value happened to fall through to
  // the "not lender" default).
  const login = async (): Promise<AuthUser | null> => {
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      setErrors(extractErrors(result.error));
      return null;
    }
    setErrors({});
    try {
      const loginResult = await loginMutation.mutateAsync({ email, password });
      // requires2FA: true → caller should show the code-entry step instead
      // of navigating; requires2FA: false → real sign-in, return the user
      // straight from the response so routing never depends on state timing.
      return loginResult.requires2FA ? null : loginResult.user;
    } catch (e: any) {
      setErrors({ email: e?.message || "Invalid credentials" });
      return null;
    }
  };

  const verifyTwoFactor = async (code: string): Promise<AuthUser | null> => {
    if (!twoFactorUsername) return null;
    setErrors({});
    try {
      const user = await verifyTwoFactorMutation.mutateAsync({ username: twoFactorUsername, code });
      return user;
    } catch (e: any) {
      setErrors({ code: e?.message || "Invalid code" });
      return null;
    }
  };

  return {
    fullName,
    setFullName,
    nin,
    setNin,
    phone,
    setPhone,
    email,
    setEmail,
    password,
    setPassword,
    accountType,
    setAccountType,
    agreed,
    setAgreed,
    referralCode,
    setReferralCode,
    errors,
    authUser,
    signupDraft,
    twoFactorUsername,
    loading:
      registerMutation.isPending ||
      loginMutation.isPending ||
      verifyTwoFactorMutation.isPending,
    canSubmit,
    register,
    login,
    verifyTwoFactor,
  };
}
