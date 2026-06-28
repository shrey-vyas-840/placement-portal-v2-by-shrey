import { supabase } from "@/lib/supabase";
import type { StudentMaster, StudentMasterUpdate } from "@/types/student";
import {
  getRegistryStudentByEmail,
  type StudentMasterRegistryRow,
} from "@/services/studentRegistryService";

/**
 * Student profile service. Reads/writes go through `student_master`
 * scoped to the signed-in user. RLS is the source of truth — these
 * helpers do NOT bypass policies.
 */

function mapRegistryPlacementPreference(
  value?: string | null,
): StudentMaster["placement_preference"] {
  const normalized = (value ?? "").trim().toLowerCase();

  if (normalized.includes("higher") || normalized.includes("master")) {
    return "Higher Studies";
  }

  if (normalized.includes("entrepreneur") || normalized.includes("startup")) {
    return "Entrepreneurship";
  }

  if (normalized.includes("not") || normalized.includes("out")) {
    return "Not Interested";
  }

  return "Interested";
}

async function resolvePortalUserId(authUserId: string): Promise<string | null> {
  const { data, error } = await (supabase as any)
    .from("user_accounts")
    .select("user_id")
    .eq("auth_provider_id", authUserId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.user_id ?? null;
}

export const studentService = {
  async getProfileByUserId(authUserId: string): Promise<StudentMaster | null> {
    const userId = await resolvePortalUserId(authUserId);

    if (!userId) {
      return null;
    }

    const { data, error } = await (supabase as any)
      .from("student_master")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return (data as StudentMaster | null) ?? null;
  },

  async getProfileByPortalUserId(portalUserId: string): Promise<StudentMaster | null> {
    const { data, error } = await (supabase as any)
      .from("student_master")
      .select("*")
      .eq("user_id", portalUserId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return (data as StudentMaster | null) ?? null;
  },

  async createProfileFromRegistry(
    authUserId: string,
    registry: StudentMasterRegistryRow,
  ): Promise<StudentMaster> {
    const userId = await resolvePortalUserId(authUserId);

    if (!userId) {
      throw new Error("User account not found.");
    }

    const { data: existingProfile, error: existingError } = await (supabase as any)
      .from("student_master")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (existingProfile) {
      return existingProfile as StudentMaster;
    }

    const instituteEmail = registry.institute_email_id || registry.email_address;

    const { data, error } = await (supabase as any)
      .from("student_master")
      .insert({
        user_id: userId,
        enrollment_no: registry.enrollment_no,
        first_name: registry.first_name,
        middle_name: null,
        last_name: registry.last_name,
        institute_email: instituteEmail,
        personal_email: registry.personal_email_id ?? null,
        contact_number: registry.contact_number,
        alternate_contact_number: null,
        gender: registry.gender ?? null,
        date_of_birth: registry.date_of_birth ?? null,
        profile_photo_document_id: null,
        placement_preference: mapRegistryPlacementPreference(registry.placement_preference_text),
        placement_status: "Unplaced",
        created_by_type: "Auto Generated",
        is_active: true,
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return data as StudentMaster;
  },

  async ensureStudentProfileFromRegistry(
    authUserId: string,
    email?: string | null,
  ): Promise<StudentMaster | null> {
    const existing = await this.getProfileByUserId(authUserId);

    if (existing) {
      return existing;
    }

    if (!email) {
      return null;
    }

    const registry = await getRegistryStudentByEmail(email);

    if (!registry) {
      return null;
    }

    return this.createProfileFromRegistry(authUserId, registry);
  },

  async updateProfile(id: string, patch: StudentMasterUpdate): Promise<StudentMaster> {
    const { data, error } = await (supabase as any)
      .from("student_master")
      .update(patch)
      .eq("student_id", id)
      .select("*")
      .single();

    if (error) throw error;
    return data as StudentMaster;
  },

  async getDashboardMetrics(authUserId: string) {
    const { data: account, error: accountError } = await (supabase as any)
      .from("user_accounts")
      .select("user_id")
      .eq("auth_provider_id", authUserId)
      .maybeSingle();

    if (accountError) throw accountError;
    if (!account?.user_id) {
      return {
        appliedCount: 0,
        shortlistedCount: 0,
        attendancePresent: 0,
        attendanceAbsent: 0,
        attendancePercentage: 0,

        placementStatus: "Unplaced",
        placementPreference: "Interested",
        placedCompany: null,
        placedPackage: null,
        placementType: null,
        placedAt: null,

        restrictionActive: false,
        restrictionType: null,
        restrictionReason: null,

        recentApplications: [],
      };
    }

    const { data: profile, error: profileError } = await (supabase as any)
      .from("student_master")
      .select(
        `
      student_id,
      placement_status,
      placement_preference
  `,
      )
      .eq("user_id", account.user_id)
      .maybeSingle();

    if (profileError) throw profileError;
    if (!profile?.student_id) {
      return {
        appliedCount: 0,
        shortlistedCount: 0,
        attendancePresent: 0,
        attendanceAbsent: 0,
        attendancePercentage: 0,

        placementStatus: "Unplaced",
        placementPreference: "Interested",
        placedCompany: null,
        placedPackage: null,
        placementType: null,
        placedAt: null,

        restrictionActive: false,
        restrictionType: null,
        restrictionReason: null,

        recentApplications: [],
      };
    }

const { data: placement } = await (supabase as any)
  .from("student_placement_history")
  .select(`
      company_name,
      package_lpa,
      placement_type,
      placed_at
  `)
  .eq("student_id", profile.student_id)
  .eq("is_current", true)
  .maybeSingle();

    const { data: restriction } = await (supabase as any)
      .from("student_restrictions")
      .select(
        `
      restriction_type,
      restriction_reason,
      is_active
  `,
      )
      .eq("student_id", profile.student_id)
      .eq("is_active", true)
      .maybeSingle();

    const [applicationsResult, attendanceResult, recentResult] = await Promise.all([
      (supabase as any)
        .from("student_opportunity_applications")
        .select("application_status")
        .eq("student_id", profile.student_id),

      (supabase as any)
        .from("attendance_records")
        .select("attendance_status")
        .eq("student_id", profile.student_id),

      (supabase as any)
        .from("student_opportunity_applications")
        .select(
          `
                application_id,
                application_status,
                applied_at,
                opportunity_master (
                    opportunity_title
                )
            `,
        )
        .eq("student_id", profile.student_id)
        .order("applied_at", { ascending: false })
        .limit(5),
    ]);

    const applications = applicationsResult.data ?? [];
    const attendance = attendanceResult.data ?? [];
    const recentApplications = recentResult.data ?? [];

    const appliedCount = applications.length;
    const shortlistedCount = applications.filter(
      (item: any) => item.application_status === "Shortlisted",
    ).length;

    const attendancePresent = attendance.filter(
      (item: any) => item.attendance_status === "PRESENT",
    ).length;

    const attendanceAbsent = attendance.filter(
      (item: any) => item.attendance_status === "ABSENT",
    ).length;

    const attendancePercentage =
      attendancePresent + attendanceAbsent === 0
        ? 0
        : Math.round((attendancePresent / (attendancePresent + attendanceAbsent)) * 100);

    return {
      appliedCount,
      shortlistedCount,
      attendancePresent,
      attendanceAbsent,
      attendancePercentage,

      placementStatus: profile.placement_status,

      placementPreference: profile.placement_preference,

      placedCompany: placement?.company_name ?? null,

      placedPackage: placement?.package_lpa ?? null,

      placementType: placement?.placement_type ?? null,

      placedAt: placement?.placed_at ?? null,
      restrictionActive: restriction?.is_active ?? false,

      restrictionType: restriction?.restriction_type ?? null,

      restrictionReason: restriction?.restriction_reason ?? null,

      recentApplications: recentApplications.map((item: any) => ({
        application_id: item.application_id,
        opportunity_title: item.opportunity_master?.opportunity_title ?? "",
        application_status: item.application_status ?? "",
        applied_at: item.applied_at ?? "",
      })),
    };
  },
};
