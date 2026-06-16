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
    placement_preference:
    | "Interested"
    | "Not Interested"
    | "Higher Studies"
    | "Entrepreneurship";
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

function mapPlacementPreference(
    value?: unknown,
): StudentMaster["placement_preference"] {
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

async function resolvePortalUserId(authProviderId: string): Promise<string> {
    const { data, error } = await (supabase as any)
        .from("user_accounts")
        .select("user_id")
        .eq("auth_provider_id", authProviderId)
        .maybeSingle();

    if (error) {
        throw error;
    }

    if (!data?.user_id) {
        throw new Error("User account not found.");
    }

    return data.user_id as string;
}

export async function createOrUpdateStudentProfileFromOnboardingDraft(
    input: CreateOrUpdateStudentProfileFromDraftInput,
): Promise<StudentMaster> {
    const userId = await resolvePortalUserId(input.authProviderId);

    const existingProfile = await studentService.getProfileByUserId(
        input.authProviderId,
    );

    const registry = (input.registrySnapshot ?? {}) as Record<string, unknown>;
    const edited = (input.editedProfile ?? {}) as Record<string, unknown>;

    const firstName =
        toText(edited.first_name) || toText(registry.first_name) || "";
    const lastName =
        toText(edited.last_name) || toText(registry.last_name) || "";
    const instituteEmail =
        toText(edited.institute_email) ||
        toText(registry.institute_email_id) ||
        toText(registry.email_address) ||
        input.emailAddress;
    const contactNumber =
        toText(edited.contact_number) || toText(registry.contact_number) || "";

    if (!firstName || !lastName || !instituteEmail || !contactNumber) {
        throw new Error("Required profile fields are missing.");
    }

    const payload = {
        user_id: userId,
        enrollment_no: input.enrollmentNo.trim().toUpperCase(),
        first_name: firstName,
        middle_name:
            nullableText(edited.middle_name) ?? nullableText(registry.middle_name),
        last_name: lastName,
        institute_email: instituteEmail,
        personal_email:
            nullableText(edited.personal_email) ??
            nullableText(registry.personal_email_id),
        contact_number: contactNumber,
        alternate_contact_number:
            nullableText(edited.alternate_contact_number) ?? null,
        gender:
            (toText(edited.gender) || toText(registry.gender) || null) as
            | "Male"
            | "Female"
            | "Other"
            | null,
        date_of_birth:
            nullableText(edited.date_of_birth) ??
            nullableText(registry.date_of_birth),
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
        throw error;
    }

    return data as StudentMaster;
}