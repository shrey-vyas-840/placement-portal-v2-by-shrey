export const WORKSPACE_ALLOWED_EMAILS = [
  "shreyvyas.23.cse@iite.indusuni.ac.in",

  "vs.shrey@gmail.com",
];

export function hasWorkspaceAccess(email?: string | null): boolean {
  if (!email) {
    return false;
  }

  return WORKSPACE_ALLOWED_EMAILS.includes(email.toLowerCase());
}
