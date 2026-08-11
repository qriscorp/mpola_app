const STATUS_LABEL: Record<string, string> = {
  awaiting_guarantors: "Awaiting Guarantors",
  pending: "Pending",
  approved: "Approved",
  completed: "Completed",
  rejected: "Rejected",
  defaulted: "Defaulted",
  expired: "Expired",
};

const STATUS_VARIANT: Record<string, "success" | "warning" | "danger" | "info" | "default"> = {
  awaiting_guarantors: "warning",
  pending: "warning",
  approved: "success",
  completed: "info",
  rejected: "danger",
  defaulted: "danger",
  expired: "default",
};

/** A "funded" application status alone can't tell "accepted, waiting on
 * the lender to release funds" apart from "actually funded" — both are
 * stored as status="funded" (see mpola_api's _app_response); only the
 * associated loan's own status (loanStatus) distinguishes them. Shared by
 * both the borrower's My Requests screen and the lender's applicant-detail
 * screen — anywhere a LoanApplication's status is shown to a user. */
export function applicationStatusLabel(status: string, loanStatus: string | null | undefined): string {
  if (status === "funded") {
    return loanStatus && loanStatus !== "pending_disbursement" ? "Funded" : "Awaiting Disbursement";
  }
  return STATUS_LABEL[status] ?? status;
}

export function applicationStatusVariant(
  status: string,
  loanStatus: string | null | undefined,
): "success" | "warning" | "danger" | "info" | "default" {
  if (status === "funded") {
    return loanStatus && loanStatus !== "pending_disbursement" ? "success" : "warning";
  }
  return STATUS_VARIANT[status] ?? "default";
}
