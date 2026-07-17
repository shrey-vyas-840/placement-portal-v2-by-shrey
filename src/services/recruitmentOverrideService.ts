import { supabase } from "@/integrations/supabase/client";

export interface RecruitmentOverrideStudent {
  studentId: string;
  enrollmentNumber: string;
  fullName: string;
  instituteName: string | null;
  branchName: string | null;
  cgpa: number | null;

  restrictionReason?: string | null;

  placementCompany?: string | null;
  placementPackage?: number | null;

  overrideId?: string;
  overrideType?: "RESTRICTED" | "PLACED";
  overrideActive?: boolean;
}

class RecruitmentOverrideService {

    async getRestrictedStudents(
  opportunityId: string,
): Promise<RecruitmentOverrideStudent[]> {
  const { data, error } = await (supabase as any)
    .from("student_restrictions")
    .select(`
      restriction_reason,
      student_master(
        student_id,
        enrollment_number,
        full_name,
        institute_name,
        branch_name,
        student_academic_details(
          current_cgpa
        )
      )
    `)
    .eq("is_active", true);

  if (error) {
    throw error;
  }

  const studentIds =
    (data ?? []).map((item: any) => item.student_master?.student_id);

  const { data: overrides } = await (supabase as any)
    .from("student_placement_overrides")
    .select(`
      override_id,
      student_id,
      override_type,
      is_active
    `)
    .eq("opportunity_id", opportunityId)
    .eq("override_type", "RESTRICTED")
    .eq("is_active", true)
    .in("student_id", studentIds.length ? studentIds : ["00000000-0000-0000-0000-000000000000"]);

  const overrideMap = new Map<string, any>(
  (overrides ?? []).map((o: any) => [
    String(o.student_id),
    o,
  ]),
);

  return (data ?? []).map((row: any) => {
    const student = row.student_master;
    const override = overrideMap.get(student.student_id);

    return {
      studentId: student.student_id,
      enrollmentNumber: student.enrollment_number,
      fullName: student.full_name,
      instituteName: student.institute_name,
      branchName: student.branch_name,
      cgpa:
        student.student_academic_details?.[0]?.current_cgpa ??
        null,

      restrictionReason: row.restriction_reason,

      overrideId: override?.override_id,
      overrideType: override?.override_type,
      overrideActive: override?.is_active ?? false,
    };
  });
}

}

export const recruitmentOverrideService =
  new RecruitmentOverrideService();

