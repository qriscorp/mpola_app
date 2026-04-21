/**
 * Auth service — connects to real Welend API.
 * Handles login, register, token storage (SecureStore), and refresh.
 */
import * as SecureStore from "expo-secure-store";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (__DEV__ ? "http://10.0.2.2:8000" : "https://api.lendflow.app");

const TOKEN_KEY = "lf_access_token";
const REFRESH_KEY = "lf_refresh_token";
const USER_KEY = "lf_user";

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
}): Promise<AuthUser> {
  const res = await apiPost<AuthResponse>("/auth/register", {
    email: data.email,
    password: data.password,
    full_name: data.fullName,
    phone_number: normalizePhone(data.phone),
    nin: data.nin,
    account_type: data.accountType,
    role: data.role,
  });

  await storeTokens(res.access_token, res.refresh_token);
  await storeUser(res.user);
  return res.user;
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
