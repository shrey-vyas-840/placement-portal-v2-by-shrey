export const DEVELOPER_EMAILS = ["shreyvyas.23.cse@iite.indusuni.ac.in", "vs.shrey@gmail.com"];

export const INSTITUTIONAL_EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@([A-Za-z0-9-]+\.)?indusuni\.ac\.in$/i;

export function normalizeEmail(email?: string | null): string {
  return (email ?? "").trim().toLowerCase();
}

export function isInstitutionalEmail(email?: string | null): boolean {
  return INSTITUTIONAL_EMAIL_REGEX.test(normalizeEmail(email));
}

export function isDeveloperEmail(email?: string | null): boolean {
  const normalized = normalizeEmail(email);
  return DEVELOPER_EMAILS.includes(normalized);
}

export function canAccessPortal(email?: string | null): boolean {
  return isInstitutionalEmail(email) || isDeveloperEmail(email);
}

export function getLandingRoute(email?: string | null): string {
  return isDeveloperEmail(email) ? "/workspace/catalog" : "/dashboard";
}
