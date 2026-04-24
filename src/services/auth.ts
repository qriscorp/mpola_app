/**
 * Auth service — connects to real Welend API.
 * Handles login, register, token storage (SecureStore), and refresh.
 */
import * as SecureStore from "expo-secure-store";

const ENV_API_URL = (
  globalThis as { process?: { env?: Record<string, string | undefined> } }
).process?.env?.EXPO_PUBLIC_API_URL;

const API_BASE_URL =
  ENV_API_URL ||
  (__DEV__ ? "http://10.0.2.2:8000" : "https://api.lendflow.app");

const TOKEN_KEY = "lf_access_token";
const REFRESH_KEY = "lf_refresh_token";
const USER_KEY = "lf_user";
const SIGNUP_DRAFT_KEY = "lf_signup_draft";
const SIGNUP_FORM_DRAFT_KEY = "lf_signup_form_draft";

// ─── Token Management ────────────────────────────────────

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_KEY);
}

export async function getStoredUser(): Promise<AuthUser | null> {
  const json = await SecureStore.getItemAsync(USER_KEY);
  return json ? JSON.parse(json) : null;
}

async function storeTokens(access: string, refresh: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, access);
  await SecureStore.setItemAsync(REFRESH_KEY, refresh);
}

async function storeUser(user: AuthUser) {
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
}

export async function clearAuth() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
}

export interface SignupDraftState {
  draftId: string;
  email: string;
  phoneNumber: string;
  role: "borrower" | "lender";
  emailVerified: boolean;
  phoneVerified: boolean;
}

export interface SignupFormDraftState {
  role: "borrower" | "lender";
  fullName: string;
  nin: string;
  phone: string;
  email: string;
  password: string;
  accountType: string;
  agreed: boolean;
}

export type SignupDraftNextStep = "verify-email" | "verify-phone";

export function getSignupDraftNextStep(
  draft: SignupDraftState,
): SignupDraftNextStep {
  if (!draft.emailVerified) {
    return "verify-email";
  }
  if (!draft.phoneVerified) {
    return "verify-phone";
  }
  return "verify-email";
}

async function storeSignupDraft(draft: SignupDraftState) {
  await SecureStore.setItemAsync(SIGNUP_DRAFT_KEY, JSON.stringify(draft));
}

export async function getSignupDraft(): Promise<SignupDraftState | null> {
  const json = await SecureStore.getItemAsync(SIGNUP_DRAFT_KEY);
  return json ? (JSON.parse(json) as SignupDraftState) : null;
}

export async function clearSignupDraft() {
  await SecureStore.deleteItemAsync(SIGNUP_DRAFT_KEY);
}

export async function saveSignupFormDraft(
  draft: SignupFormDraftState,
): Promise<void> {
  await SecureStore.setItemAsync(SIGNUP_FORM_DRAFT_KEY, JSON.stringify(draft));
}

export async function getSignupFormDraft(): Promise<SignupFormDraftState | null> {
  const json = await SecureStore.getItemAsync(SIGNUP_FORM_DRAFT_KEY);
  return json ? (JSON.parse(json) as SignupFormDraftState) : null;
}

export async function clearSignupFormDraft() {
  await SecureStore.deleteItemAsync(SIGNUP_FORM_DRAFT_KEY);
}

async function updateSignupDraft(
  updater: (draft: SignupDraftState) => SignupDraftState,
) {
  const existing = await getSignupDraft();
  if (!existing) return;
  await storeSignupDraft(updater(existing));
}

// ─── Types ───────────────────────────────────────────────

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  full_name: string;
  phone_number: string;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  is_kyc_verified: boolean;
  kyc_status: string;
  credit_score: number | null;
}

interface AuthResponse {
  user: AuthUser;
  access_token: string;
  refresh_token: string;
}

interface SignupDraftResponse {
  draft_id: string;
  email: string;
  phone_number: string | null;
  role: "borrower" | "lender";
  status: number;
  message: string;
}

interface ApiMessageResponse {
  status: number;
  message: string;
}

// ─── API Helpers ─────────────────────────────────────────

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

// ─── Phone normalization ─────────────────────────────────

function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 9) return `256${digits}`;
  if (digits.startsWith("0") && digits.length === 10)
    return `256${digits.slice(1)}`;
  if (digits.startsWith("256") && digits.length === 12) return digits;
  return digits;
}

// ─── Auth API ────────────────────────────────────────────

export async function apiRegister(data: {
  fullName: string;
  nin: string;
  phone: string;
  email: string;
  password: string;
  accountType: string;
  role: "borrower" | "lender";
}): Promise<SignupDraftState> {
  const res = await apiPost<SignupDraftResponse>("/auth/register_start", {
    email: data.email,
    password: data.password,
    full_name: data.fullName,
    phone_number: normalizePhone(data.phone),
    nin: data.nin,
    account_type: data.accountType,
    role: data.role,
  });

  const draft: SignupDraftState = {
    draftId: res.draft_id,
    email: res.email,
    phoneNumber: res.phone_number || normalizePhone(data.phone),
    role: res.role,
    emailVerified: false,
    phoneVerified: false,
  };
  await storeSignupDraft(draft);
  await clearSignupFormDraft();
  return draft;
}

export async function apiLogin(data: {
  email: string;
  password: string;
}): Promise<AuthUser> {
  // If input looks like a phone number, normalize it
  const identifier = /^\d{9,12}$/.test(data.email.replace(/\D/g, ""))
    ? normalizePhone(data.email)
    : data.email;
  const res = await apiPost<AuthResponse>("/auth/login", {
    username: identifier,
    password: data.password,
  });

  await storeTokens(res.access_token, res.refresh_token);
  await storeUser(res.user);
  return res.user;
}

export async function apiRefreshToken(): Promise<string | null> {
  const refresh = await getRefreshToken();
  if (!refresh) return null;

  try {
    const res = await apiPost<AuthResponse>("/auth/refresh", {
      refresh_token: refresh,
    });
    await storeTokens(res.access_token, res.refresh_token);
    await storeUser(res.user);
    return res.access_token;
  } catch {
    await clearAuth();
    return null;
  }
}

export async function apiSignOut() {
  await clearAuth();
}

// ─── Signup Draft OTP Flow ───────────────────────────────

export async function apiSendSignupEmailOtp(
  draftId: string,
): Promise<ApiMessageResponse> {
  return apiPost("/auth/send_signup_email_otp", { draft_id: draftId });
}

export async function apiVerifySignupEmailOtp(
  draftId: string,
  code: string,
): Promise<ApiMessageResponse> {
  const res = await apiPost<ApiMessageResponse>(
    "/auth/verify_signup_email_otp",
    {
      draft_id: draftId,
      code,
    },
  );
  await updateSignupDraft((draft) => ({
    ...draft,
    emailVerified: true,
  }));
  return res;
}

export async function apiSendSignupPhoneOtp(
  draftId: string,
  phoneNumber: string,
): Promise<ApiMessageResponse> {
  const normalized = normalizePhone(phoneNumber);
  const res = await apiPost<ApiMessageResponse>("/auth/send_signup_phone_otp", {
    draft_id: draftId,
    phone_number: normalized,
  });
  await updateSignupDraft((draft) => ({
    ...draft,
    phoneNumber: normalized,
    phoneVerified: false,
  }));
  return res;
}

export async function apiVerifySignupPhoneOtp(
  draftId: string,
  phoneNumber: string,
  code: string,
): Promise<ApiMessageResponse> {
  const normalized = normalizePhone(phoneNumber);
  const res = await apiPost<ApiMessageResponse>(
    "/auth/verify_signup_phone_otp",
    {
      draft_id: draftId,
      phone_number: normalized,
      code,
    },
  );

  if (res.message.toLowerCase().includes("account created")) {
    await clearSignupDraft();
    await clearSignupFormDraft();
  } else {
    await updateSignupDraft((draft) => ({
      ...draft,
      phoneNumber: normalized,
      phoneVerified: true,
    }));
  }

  return res;
}

// ─── Forgot Password (OTP flow) ───────────────────────────

export async function apiForgotPasswordSend(
  identifier: string,
): Promise<{ status: number; message: string }> {
  return apiPost("/auth/send_password_reset_code", { identifier });
}

export async function apiForgotPasswordVerify(
  identifier: string,
  code: string,
): Promise<{ access_token: string }> {
  return apiPost("/auth/verify_password_reset_code", { identifier, code });
}

export async function apiForgotPasswordReset(
  newPassword: string,
  accessToken: string,
): Promise<{ status: number; message: string }> {
  return apiPost("/auth/reset_password", {
    new_password: newPassword,
    access_token: accessToken,
  });
}

// ─── Phone OTP Sign-in ────────────────────────────────────

export async function apiSendLoginPhoneOtp(
  phoneNumber: string,
): Promise<{ status: number; message: string }> {
  return apiPost("/auth/send_login_phone_otp", {
    phone_number: normalizePhone(phoneNumber),
  });
}

export async function apiVerifyLoginPhoneOtp(
  phoneNumber: string,
  code: string,
): Promise<AuthUser> {
  const res = await apiPost<AuthResponse>("/auth/verify_login_phone_otp", {
    phone_number: normalizePhone(phoneNumber),
    code,
  });
  await storeTokens(res.access_token, res.refresh_token);
  await storeUser(res.user);
  return res.user;
}
