import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import type { UserRole, AccountType } from "../models";
import { registerSchema, loginSchema } from "../validation";
import { apiRegister, apiLogin, type AuthUser } from "../services/auth";
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
  const [errors, setErrors] = useState<FieldErrors>({});
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);

  const registerMutation = useMutation({
    mutationFn: (params: {
      fullName: string;
      nin: string;
      phone: string;
      email: string;
      password: string;
      accountType: string;
      role: "borrower" | "lender";
    }) => apiRegister(params),
    onSuccess: (user) => setAuthUser(user),
  });

  const loginMutation = useMutation({
    mutationFn: (params: { email: string; password: string }) =>
      apiLogin(params),
    onSuccess: (user) => setAuthUser(user),
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
      });
      return true;
    } catch (e: any) {
      setErrors({ email: e?.message || "Registration failed" });
      return false;
    }
  };

  const login = async () => {
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      setErrors(extractErrors(result.error));
      return false;
    }
    setErrors({});
    try {
      await loginMutation.mutateAsync({ email, password });
      return true;
    } catch (e: any) {
      setErrors({ email: e?.message || "Invalid credentials" });
      return false;
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
    errors,
    authUser,
    loading: registerMutation.isPending || loginMutation.isPending,
    canSubmit,
    register,
    login,
  };
}
