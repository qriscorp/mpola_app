/**
 * Where a push/WebSocket notification should deep-link to, by type — the
 * single source of truth shared by the foreground WebSocket handler
 * (src/services/realtime.ts, while the app is open) and the background
 * notification-tap handler (src/services/push.ts, when the app was closed
 * or backgrounded). Keeping this in one place means a tap always lands on
 * the same screen the in-app alert's action button would have opened.
 */
export type NotificationRoute = { pathname: string; params?: Record<string, string> };

export function resolveNotificationRoute(
  type: string | undefined,
  data: Record<string, unknown> | undefined | null,
  portal: "borrower" | "lender",
): NotificationRoute | null {
  switch (type) {
    case "chat_message": {
      const loanId = data?.loan_id;
      if (!loanId) return null;
      return {
        pathname: portal === "lender" ? "/(lender)/chat" : "/(borrower)/chat",
        params: { loanId: String(loanId) },
      };
    }
    case "admin_chat_message":
      return { pathname: portal === "lender" ? "/(lender)/admin-chat" : "/(borrower)/admin-chat" };
    case "loan_pending_disbursement":
      return { pathname: "/(lender)/(tabs)/portfolio" };
    case "lender_offer_template":
    case "auto_match_cooldown_lifted":
      return { pathname: "/(lender)/my-offers" };
    case "offer_awaiting_response":
      return { pathname: "/(borrower)/offers" };
    case "low_wallet_balance":
      return { pathname: "/(lender)/(tabs)/wallet" };
    case "guarantor_invite_received":
      return { pathname: portal === "lender" ? "/(lender)/approvals" : "/(borrower)/approvals" };
    case "guarantor_still_pending":
    case "application_expired":
      return { pathname: "/(borrower)/my-requests" };
    case "support_reply":
      return { pathname: "help" };
    default:
      return null;
  }
}
