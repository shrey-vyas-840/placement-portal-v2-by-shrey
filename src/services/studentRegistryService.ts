import { supabase } from "@/lib/supabase";
import { isInstitutionalEmail, normalizeEmail } from "@/services/identityPolicyService";

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

  console.log("QUERY EMAIL VALUE", JSON.stringify(normalizedEmail));
  const { data: byEmail, error: byEmailError } = await (supabase as any)
    .from("student_master_registry")
    .select("*")
    .ilike("email_address", normalizedEmail)
    .order("source_timestamp", {
      ascending: false,
    })
    .limit(1);

  console.log("REGISTRY LOOKUP EMAIL", normalizedEmail);
  console.log("REGISTRY LOOKUP RESULT", byEmail);
  console.log("REGISTRY LOOKUP ERROR", byEmailError);

  if (byEmailError) {
    console.error("REGISTRY QUERY ERROR", byEmailError);
    throw byEmailError;
  }

  if (byEmail && byEmail.length > 0) {
    return byEmail[0] as StudentMasterRegistryRow;
  }

  console.log("EMAIL_ADDRESS lookup failed, trying institute_email_id");

  const { data: byInstituteEmail, error: byInstituteEmailError } = await (supabase as any)
    .from("student_master_registry")
    .select("*")
    .ilike("institute_email_id", normalizedEmail)
    .order("source_timestamp", {
      ascending: false,
    })
    .limit(1);

  console.log("INSTITUTE EMAIL RESULT", byInstituteEmail);

  if (byInstituteEmailError) {
    throw byInstituteEmailError;
  }

  if (byInstituteEmail && byInstituteEmail.length > 0) {
    return byInstituteEmail[0] as StudentMasterRegistryRow;
  }
  return null;
}

export async function verifyStudentRegistryEntry(
  email: string,
  enrollment: string,
): Promise<boolean> {
  const normalizedEmail = normalizeEmail(email);
  const { data: allRows } = await (supabase as any)
    .from("student_master_registry")
    .select("institute_email_id,email_address")
    .limit(5);

  console.log("SAMPLE REGISTRY ROWS", allRows);
  console.log("RAW EMAIL", email);
  console.log("NORMALIZED EMAIL", normalizedEmail);
  console.log("IS INSTITUTIONAL", isInstitutionalEmail(normalizedEmail));

  if (!isInstitutionalEmail(normalizedEmail)) {
    return false;
  }

  const normalizedEnrollment = enrollment.trim().toUpperCase().replace(/\s+/g, "");

  const row = await getRegistryStudentByEmail(normalizedEmail);

  if (!row) {
    return false;
  }

  return row.enrollment_no.trim().toUpperCase() === normalizedEnrollment;
}
