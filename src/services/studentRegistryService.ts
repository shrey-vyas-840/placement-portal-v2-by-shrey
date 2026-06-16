import { supabase } from "@/lib/supabase";
import {
  isInstitutionalEmail,
  normalizeEmail,
} from "@/services/identityPolicyService";

export interface StudentMasterRegistryRow {
  registry_id: string;
  institute_name: string;
  institute_key: string;
  source_file_name: string;
  source_row_number: number;
  source_timestamp: string;
  email_address: string;
  enrollment_no: string;
  first_name: string;
  last_name: string;
  gender?: string | null;
  date_of_birth?: string | null;
  institute_email_id: string;
  personal_email_id?: string | null;
  contact_number: string;
  hometown?: string | null;
  current_degree?: string | null;
  masters_degree_branch?: string | null;
  bachelors_degree_branch?: string | null;
  placement_preference_text?: string | null;
  ssc_percentage?: number | null;
  hsc_or_diploma_type?: string | null;
  hsc_or_diploma_percentage?: number | null;
  willing_to_relocate?: string | null;
  reason_for_opt_out?: string | null;
  declaration_text?: string | null;
  validation_status?: string | null;
  validation_issues?: unknown;
  imported_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  is_active?: boolean | null;
}

export async function getRegistryStudentByEmail(
  email: string,
): Promise<StudentMasterRegistryRow | null> {
  const normalizedEmail = normalizeEmail(email);

  if (!isInstitutionalEmail(normalizedEmail)) {
    return null;
  }

  const query = (supabase as any)
    .from("student_master_registry")
    .select("*")
    .eq("is_active", true)
    .order("source_timestamp", { ascending: false });

  const { data: byEmail, error: byEmailError } = await query
    .eq("email_address", normalizedEmail)
    .maybeSingle();

  if (byEmailError) {
    throw byEmailError;
  }

  if (byEmail) {
    return byEmail as StudentMasterRegistryRow;
  }

  const { data: byInstituteEmail, error: byInstituteEmailError } =
    await (supabase as any)
      .from("student_master_registry")
      .select("*")
      .eq("is_active", true)
      .eq("institute_email_id", normalizedEmail)
      .order("source_timestamp", { ascending: false })
      .maybeSingle();

  if (byInstituteEmailError) {
    throw byInstituteEmailError;
  }

  return (byInstituteEmail as StudentMasterRegistryRow | null) ?? null;
}

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

  const row = await getRegistryStudentByEmail(normalizedEmail);

  if (!row) {
    return false;
  }

  return (
    row.enrollment_no.trim().toUpperCase() === normalizedEnrollment
  );
}