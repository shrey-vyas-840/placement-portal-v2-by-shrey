import { supabase } from "@/lib/supabase";
import { studentService } from "@/services/studentService";
import type { StudentMaster } from "@/types/student";

type EditableProfile = {
  first_name: string;
  middle_name: string;
  last_name: string;
  institute_email: string;
  personal_email: string;
  contact_number: string;
  alternate_contact_number: string;
  gender: "" | "Male" | "Female" | "Other";
  date_of_birth: string;
  placement_preference: "Interested" | "Not Interested" | "Higher Studies" | "Entrepreneurship";
};

export interface CreateOrUpdateStudentProfileFromDraftInput {
  authProviderId: string;
  emailAddress: string;
  enrollmentNo: string;
  registrySnapshot?: unknown;
  editedProfile?: unknown;
}

function toText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function nullableText(value: unknown): string | null {
  const result = toText(value);
  return result || null;
}

function mapPlacementPreference(value?: unknown): StudentMaster["placement_preference"] {
  const raw = toText(value).toLowerCase();

  if (raw.includes("higher") || raw.includes("master")) {
    return "Higher Studies";
  }

  if (raw.includes("entrepreneur") || raw.includes("startup")) {
    return "Entrepreneurship";
  }

  if (raw.includes("not")) {
    return "Not Interested";
  }

  return "Interested";
}
async function resolvePortalUserId(authProviderId: string, emailAddress?: string): Promise<string> {
  const { data, error } = await (supabase as any)
    .from("user_accounts")
    .select("user_id")
    .eq("auth_provider_id", authProviderId)
    .maybeSingle();

  if (error) {
    console.error("PROVISION ERROR", error);

    throw error;
  }

  console.log("USER ACCOUNT LOOKUP", authProviderId, data);

  if (data?.user_id) {
    return data.user_id as string;
  }

  console.log("CREATING USER ACCOUNT", authProviderId);

  const userId = crypto.randomUUID();

  const { error: insertError } = await (supabase as any).from("user_accounts").insert({
    user_id: userId,
    auth_provider_id: authProviderId,
    email_address: emailAddress ?? "",
    account_status: "Active",
    email_verified: true,
    created_by_type: "Auto Generated",
    is_active: true,
  });

  if (insertError) {
    throw insertError;
  }

  return userId;
}

export async function createOrUpdateStudentProfileFromOnboardingDraft(
  input: CreateOrUpdateStudentProfileFromDraftInput,
): Promise<StudentMaster> {
  const userId = await resolvePortalUserId(input.authProviderId, input.emailAddress);

  const existingProfile = await studentService.getProfileByUserId(input.authProviderId);

  const registry = (input.registrySnapshot ?? {}) as Record<string, unknown>;
  const edited = (input.editedProfile ?? {}) as Record<string, unknown>;

  const firstName = toText(edited.first_name) || toText(registry.first_name) || "";
  const lastName = toText(edited.last_name) || toText(registry.last_name) || "";
  const instituteEmail =
    toText(edited.institute_email) ||
    toText(registry.institute_email_id) ||
    toText(registry.email_address) ||
    input.emailAddress;
  const contactNumber = toText(edited.contact_number) || toText(registry.contact_number) || "";

  if (!firstName || !lastName || !instituteEmail || !contactNumber) {
    throw new Error("Required profile fields are missing.");
  }

  const payload = {
    user_id: userId,
    enrollment_no: input.enrollmentNo.trim().toUpperCase(),
    first_name: firstName,
    middle_name: nullableText(edited.middle_name) ?? nullableText(registry.middle_name),
    last_name: lastName,
    institute_email: instituteEmail,
    personal_email: nullableText(edited.personal_email) ?? nullableText(registry.personal_email_id),
    contact_number: contactNumber,
    alternate_contact_number: nullableText(edited.alternate_contact_number) ?? null,
    gender: (toText(edited.gender) || toText(registry.gender) || null) as
      | "Male"
      | "Female"
      | "Other"
      | null,
    date_of_birth: nullableText(edited.date_of_birth) ?? nullableText(registry.date_of_birth),
    profile_photo_document_id: null,
    placement_preference: mapPlacementPreference(
      edited.placement_preference ?? registry.placement_preference_text,
    ),
    placement_status: "Unplaced",
    created_by_type: "Auto Generated",
    is_active: true,
  };

  if (existingProfile) {
    const { data, error } = await (supabase as any)
      .from("student_master")
      .update({
        enrollment_no: payload.enrollment_no,
        first_name: payload.first_name,
        middle_name: payload.middle_name,
        last_name: payload.last_name,
        institute_email: payload.institute_email,
        personal_email: payload.personal_email,
        contact_number: payload.contact_number,
        alternate_contact_number: payload.alternate_contact_number,
        gender: payload.gender,
        date_of_birth: payload.date_of_birth,
        profile_photo_document_id: payload.profile_photo_document_id,
        placement_preference: payload.placement_preference,
        placement_status: payload.placement_status,
        is_active: payload.is_active,
      })
      .eq("student_id", existingProfile.student_id)
      .select("*")
      .single();

    if (error) {
      console.error("PROVISION ERROR", error);

      throw error;
    }

    return data as StudentMaster;
  }

  const { data, error } = await (supabase as any)
    .from("student_master")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    console.error("PROVISION ERROR", error);

    throw error;
  }

  return data as StudentMaster;
}

export async function provisionStudentFromApprovedDraft(draft: any) {
  if (!draft) {
    throw new Error("Draft not found.");
  }

  const profile = await createOrUpdateStudentProfileFromOnboardingDraft({
    authProviderId: draft.auth_provider_id,
    emailAddress: draft.email_address,
    enrollmentNo: draft.enrollment_no,
    registrySnapshot: draft.registry_snapshot,
    editedProfile: draft.edited_profile,
  });

  const questionnaire = draft.questionnaire_answers ?? {};

  const registry = draft.registry_snapshot ?? {};

  const edited = draft.edited_profile ?? {};

const { data: academicRows, error: academicLookupError } = await (supabase as any)
  .from("student_academic_details")
  .select("academic_id")
  .eq("student_id", profile.student_id);

console.log("ACADEMIC LOOKUP", academicRows);
console.log("ACADEMIC LOOKUP ERROR", academicLookupError);

if (academicLookupError) {
  throw academicLookupError;
}

 if (!academicRows || academicRows.length === 0) {
    const graduationYear = Number(edited.graduation_year) || null;
    const academicPayload = {
      student_id: profile.student_id,

      current_degree_level: registry.current_degree_level ?? registry.current_degree ?? null,

      current_branch_name: registry.bachelors_degree_branch ?? registry.current_branch_name ?? null,

      current_institute_name: registry.current_institute ?? registry.current_institute_name ?? null,

      current_cgpa: registry.current_cgpa ?? null,

      active_backlogs: registry.active_backlogs ?? 0,

      graduation_year: graduationYear,

      created_by_type: "Auto Generated",

      is_active: true,
    };

    console.log("ACADEMIC PAYLOAD", academicPayload);

    const { error: academicError } = await (supabase as any)
      .from("student_academic_details")
      .insert(academicPayload);

    console.log("ACADEMIC ERROR", academicError);

    if (academicError) {
      throw academicError;
    }
  }

  const existingSkill = await (supabase as any)
    .from("student_skill_profile")
    .select("skill_profile_id")
    .eq("student_id", profile.student_id)
    .maybeSingle();

  if (!existingSkill.data) {
    await (supabase as any).from("student_skill_profile").insert({
      student_id: profile.student_id,
      technical_skills: "",
      programming_languages: "",
      tools_and_technologies: "",
      certification_count: 0,
      hackathon_count: 0,
      project_count: 0,
      strengths: "",
      profile_score: 0,
      github_url: null,
      linkedin_url: null,
      portfolio_url: null,
      created_by_type: "Auto Generated",
      is_active: true,
    });
  }

  const existingOnboarding = await (supabase as any)
    .from("student_onboarding")
    .select("student_id")
    .eq("student_id", profile.student_id)
    .maybeSingle();

  if (!existingOnboarding.data) {
    const { error: onboardingError } = await (supabase as any).from("student_onboarding").insert({
      onboarding_id: crypto.randomUUID(),

      student_id: profile.student_id,

      auth_provider_id: draft.auth_provider_id,

      enrollment_no: draft.enrollment_no,

      draft_payload: draft,

      onboarding_status: "COMPLETED",

      policy_accepted: draft.policy_accepted === true,

      completed_at: new Date().toISOString(),

      is_active: true,
    });

    console.log("ONBOARDING ERROR", onboardingError);

    if (onboardingError) {
      throw onboardingError;
    }
  }

  return profile;
}
