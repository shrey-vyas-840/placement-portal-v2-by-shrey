import { supabase } from "@/lib/supabase";
import type { StudentMaster, StudentMasterUpdate } from "@/types/student";

/**
 * Student profile service. Reads/writes go through `student_master`
 * scoped to the signed-in user. RLS is the source of truth — these
 * helpers do NOT bypass policies.
 */
export const studentService = {
  async getProfileByUserId(
    authUserId: string,
  ): Promise<StudentMaster | null> {

    const { data: account, error: accountError } =
      await (supabase as any)
        .from("user_accounts")
        .select("user_id")
        .eq("auth_provider_id", authUserId)
        .maybeSingle();

    if (accountError) {
      throw accountError;
    }

    if (!account) {
      return null;
    }

    const { data, error } =
      await (supabase as any)
        .from("student_master")
        .select("*")
        .eq("user_id", account.user_id)
        .maybeSingle();

    if (error) {
      throw error;
    }

    return (data as StudentMaster | null) ?? null;
  },
  async updateProfile(
    id: string,
    patch: StudentMasterUpdate,
  ): Promise<StudentMaster> {
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
        recentApplications: [],
      };
    }

    const { data: profile, error: profileError } = await (supabase as any)
      .from("student_master")
      .select("student_id")
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
        recentApplications: [],
      };
    }

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
        .select(`
                application_id,
                application_status,
                applied_at,
                opportunity_master (
                    opportunity_title
                )
            `)
        .eq("student_id", profile.student_id)
        .order("applied_at", { ascending: false })
        .limit(5),
    ]);

    const applications = applicationsResult.data ?? [];
    const attendance = attendanceResult.data ?? [];
    const recentApplications = recentResult.data ?? [];

    const appliedCount = applications.length;
    const shortlistedCount = applications.filter(
      (item: any) => item.application_status === "Shortlisted"
    ).length;

    const attendancePresent = attendance.filter(
      (item: any) => item.attendance_status === "PRESENT"
    ).length;

    const attendanceAbsent = attendance.filter(
      (item: any) => item.attendance_status === "ABSENT"
    ).length;

    const attendancePercentage =
      attendancePresent + attendanceAbsent === 0
        ? 0
        : Math.round(
          (attendancePresent / (attendancePresent + attendanceAbsent)) * 100
        );

    return {
      appliedCount,
      shortlistedCount,
      attendancePresent,
      attendanceAbsent,
      attendancePercentage,
      recentApplications: recentApplications.map((item: any) => ({
        application_id: item.application_id,
        opportunity_title: item.opportunity_master?.opportunity_title ?? "",
        application_status: item.application_status ?? "",
        applied_at: item.applied_at ?? "",
      })),
    };
  },
};
