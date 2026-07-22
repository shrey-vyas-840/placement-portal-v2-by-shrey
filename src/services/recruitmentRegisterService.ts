import { supabase } from "@/integrations/supabase/client";

export const recruitmentRegisterService = {
  async getRecruitments() {
    const { data, error } = await (supabase as any)
      .from("drive_master")
      .select(
        `
        drive_id,
        drive_name,
        drive_status,
        created_at,

        company:company_master(
          company_id,
          company_name
        ),

        opportunity:opportunity_master(
          opportunity_id,
          application_status,
          application_start_date,
          application_end_date
        ),

        projection:recruitment_projection(
          eligible_students,
          registered_students,
          total_applications,
          present_students,
          absent_students,
          shortlisted_students,
          interviewed_students,
          selected_students,
          rejected_students
        ),

      roles:drive_roles(
  drive_role_id,
  role_type
),

        eligibility:drive_eligibility(
          allowed_branches
        )
      `,
      )
      .order("created_at", {
        ascending: false,
      });

    if (error) throw error;

    return data ?? [];
  },
};
