/** Where tapping a notification should take you — mirrors the destinations
 * already wired into the live Alert (see realtime.ts), so the persisted
 * Notifications screen is just as navigable as the live alert was, not
 * just a one-time popup. `isLender` picks the right variant for types
 * relevant to both roles (e.g. guarantor invites). */
export function notificationHref(type: string | null, isLender: boolean): string | null {
  switch (type) {
    case "loan_pending_disbursement":
      return "/(lender)/portfolio";
    case "loan_disbursed":
      return "/(borrower)/wallet";
    case "offer_template_expired":
    case "lender_offer_template":
    case "auto_match_cooldown_lifted":
      return "/(lender)/my-offers";
    case "low_wallet_balance":
      return "/(lender)/wallet";
    case "guarantor_invite_received":
      return isLender ? "/(lender)/approvals" : "/(borrower)/approvals";
    case "guarantor_still_pending":
    case "application_expired":
      return "/(borrower)/my-requests";
    case "offer_awaiting_response":
      return "/(borrower)/offers";
    case "offer_expired":
      return isLender ? "/(lender)/my-offers" : "/(borrower)/offers";
    default:
      return null;
  }
}
