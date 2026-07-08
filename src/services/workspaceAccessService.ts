import { normalizeEmail } from "@/services/identityPolicyService";

export const WORKSPACE_ALLOWED_EMAILS = [
  "shreyvyas.23.cse@iite.indusuni.ac.in",
  "vs.shrey@gmail.com",
] as const;

const WORKSPACE_ALLOWED_EMAIL_SET = new Set(
  WORKSPACE_ALLOWED_EMAILS.map((email) => normalizeEmail(email)),
);

export function hasWorkspaceAccess(email?: string | null): boolean {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    return false;
  }

  return WORKSPACE_ALLOWED_EMAIL_SET.has(normalizedEmail);
}