/** Mirrors validate_password_strength in repository/auth_repo.py (mpola_api)
 * exactly — the backend is authoritative and will reject anything that
 * fails these same rules, so this exists purely to give upfront feedback
 * instead of making someone guess via a rejected submission. */
export function passwordRequirementErrors(password: string): string[] {
  const errors: string[] = [];
  if (password.length < 8) errors.push("At least 8 characters");
  if (!/[A-Z]/.test(password)) errors.push("At least one uppercase letter");
  if (!/[a-z]/.test(password)) errors.push("At least one lowercase letter");
  if (!/\d/.test(password)) errors.push("At least one digit");
  if (!/[!@#$%^&*(),.?":{}|<>_\-+=[\]\\;'/`~]/.test(password)) {
    errors.push("At least one special character");
  }
  return errors;
}

export const PASSWORD_REQUIREMENTS_HINT =
  "At least 8 characters, with an uppercase letter, a lowercase letter, a digit, and a special character.";
