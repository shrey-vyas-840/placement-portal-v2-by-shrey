import { supabase } from "@/lib/supabase";
import {
  isInstitutionalEmail,
  normalizeEmail,
} from "@/services/identityPolicyService";

export async function verifyStudentRegistryEntry(
  email: string,
  enrollment: string,
): Promise<boolean> {
  const normalizedEmail = normalizeEmail(email);

  const normalizedEnrollment = enrollment
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");

  if (!isInstitutionalEmail(normalizedEmail)) {
    return false;
  }

  const { data, error } = await (supabase as any)
    .from("student_master_registry")
    .select("registry_id")
    .eq("email_address", normalizedEmail)
    .eq("enrollment_no", normalizedEnrollment)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return !!data;
}