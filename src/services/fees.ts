import type { WithdrawalCharges } from "../models";

// Mirrors mpola_api/utils/fee.py exactly — client-side preview only.
// The backend recomputes and enforces the real charge; this is just so
// users see what they'll pay before confirming.

const TX_FEE_RATE = 0.005; // 0.5% platform fee
const FLUTTERWAVE_FEE_RATE = 0.03; // 3%

export function calcPlatformFee(amount: number): number {
  return Math.ceil(amount * TX_FEE_RATE);
}

export function detectCarrier(phone: string): "MTN" | "AIRTEL" {
  const p = phone.trim();
  if (
    ["0077", "0078", "0076", "0079", "077", "078", "076", "079"].some((pre) =>
      p.startsWith(pre),
    )
  ) {
    return "MTN";
  }
  if (
    ["0075", "0074", "0073", "0070", "075", "074", "073", "070"].some((pre) =>
      p.startsWith(pre),
    )
  ) {
    return "AIRTEL";
  }
  return "MTN";
}

function calcMtnFee(amount: number): number {
  if (amount < 60_000) return 300;
  if (amount < 500_000) return 600;
  if (amount < 1_000_000) return 1_000;
  return 1_200;
}

function calcAirtelFee(amount: number): number {
  if (amount < 60_000) return 300;
  if (amount < 500_000) return 600;
  return 1_000;
}

export function calcMobileMoneyWithdrawalCharges(
  amount: number,
  phoneOrCarrier: string,
): WithdrawalCharges {
  const carrier = ["MTN", "AIRTEL"].includes(phoneOrCarrier.toUpperCase())
    ? (phoneOrCarrier.toUpperCase() as "MTN" | "AIRTEL")
    : detectCarrier(phoneOrCarrier);
  const platform_fee = calcPlatformFee(amount);
  const provider_fee = carrier === "MTN" ? calcMtnFee(amount) : calcAirtelFee(amount);
  return { platform_fee, provider_fee, total_fee: platform_fee + provider_fee };
}

export function calcBankWithdrawalCharges(amount: number): WithdrawalCharges {
  const platform_fee = calcPlatformFee(amount);
  const provider_fee = Math.ceil(amount * FLUTTERWAVE_FEE_RATE);
  return { platform_fee, provider_fee, total_fee: platform_fee + provider_fee };
}
