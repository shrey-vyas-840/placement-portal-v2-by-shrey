import { generateUuid } from "@/lib/generateUuid";
import { supabase } from "@/lib/supabase";
import { studentService } from "@/services/studentService";
import type { StudentMaster } from "@/types/student";

const db = supabase as any;

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

async function resolvePortalUserId(
  authProviderId: string,
  emailAddress?: string,
): Promise<string> {
  const { data, error } = await db
    .from("user_accounts")
    .select("user_id")
    .eq("auth_provider_id", authProviderId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data?.user_id) {
    throw new Error(
      `No linked portal account found for ${emailAddress ?? authProviderId}.`,
    );
  }

  return data.user_id;
}

export async function createOrUpdateStudentProfileFromOnboardingDraft(
  input: CreateOrUpdateStudentProfileFromDraftInput,
): Promise<StudentMaster> {
  const userId = await resolvePortalUserId(input.authProviderId, input.emailAddress);

  const existingProfile = await studentService.getProfileByPortalUserId(userId);

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
    const updatePayload = {
      ...payload,
    };

    delete (updatePayload as any).user_id;
    delete (updatePayload as any).created_by_type;

    const { data, error } = await db
      .from("student_master")
      .update(updatePayload)
      .eq("student_id", existingProfile.student_id)
      .select("*")
      .single();

    if (error) {
      console.error("PROVISION ERROR", error);

      throw error;
    }

    return data as StudentMaster;
  }

  const { data, error } = await db.from("student_master").insert(payload).select("*").single();

  if (error) {
    console.error("STUDENT_MASTER INSERT FAILED");
    console.error(error);
    console.error(payload);

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

  const verifiedProfile = await studentService.getProfileByPortalUserId(profile.user_id);

  if (!verifiedProfile) {
    throw new Error(
      "Student profile provisioning failed. student_master record could not be verified.",
    );
  }

  const questionnaire = draft.questionnaire_answers ?? {};

  const registry = draft.registry_snapshot ?? {};

  const edited = draft.edited_profile ?? {};

  const { data: academicRows, error: academicLookupError } = await db
    .from("student_academic_details")
    .select("academic_id")
    .eq("student_id", profile.student_id);

  if (academicLookupError) {
    throw academicLookupError;
  }

  if (!academicRows || academicRows.length === 0) {
    const graduationYear = Number(edited.graduation_year) || null;
    const academicPayload = {
      student_id: profile.student_id,

      current_degree_name: registry.current_degree_name ?? registry.current_degree ?? null,

      current_branch_name: registry.bachelors_degree_branch ?? registry.current_branch_name ?? null,

      current_institute_name: registry.current_institute ?? registry.current_institute_name ?? null,

      current_cgpa: registry.current_cgpa ?? null,

      active_backlogs: registry.active_backlogs ?? 0,

      graduation_year: graduationYear,

      created_by_type: "Auto Generated",

      is_active: true,
    };

    const { error: academicError } = await db
      .from("student_academic_details")
      .insert(academicPayload);

    if (academicError) {
      throw academicError;
    }
  }

  const existingOnboarding = await db
    .from("student_onboarding")
    .select("student_id")
    .eq("student_id", profile.student_id)
    .maybeSingle();

  if (!existingOnboarding.data) {
    const { error: onboardingError } = await db.from("student_onboarding").insert({
      onboarding_id: generateUuid(),

      student_id: profile.student_id,

      auth_provider_id: draft.auth_provider_id,

      enrollment_no: draft.enrollment_no,

      draft_payload: draft,

      onboarding_status: "COMPLETED",

      policy_accepted: draft.policy_accepted === true,

      completed_at: new Date().toISOString(),

      is_active: true,
    });

    if (onboardingError) {
      throw onboardingError;
    }
  }

  const [verifiedStudent, verifiedAcademic, verifiedOnboarding] = await Promise.all([
    db
      .from("student_master")
      .select("student_id")
      .eq("student_id", profile.student_id)
      .maybeSingle(),

    db
      .from("student_academic_details")
      .select("academic_id")
      .eq("student_id", profile.student_id)
      .maybeSingle(),

    db
      .from("student_onboarding")
      .select("onboarding_id")
      .eq("student_id", profile.student_id)
      .maybeSingle(),
  ]);

  if (!verifiedStudent.data) {
    throw new Error("Provisioning verification failed: student_master.");
  }

  if (!verifiedAcademic.data) {
    throw new Error("Provisioning verification failed: student_academic_details.");
  }

  if (!verifiedOnboarding.data) {
    throw new Error("Provisioning verification failed: student_onboarding.");
  }

  return profile;
}
