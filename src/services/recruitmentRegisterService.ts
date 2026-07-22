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
    drive_role_name,
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

return (data ?? []).map((item: any) => {
    const roles = Array.isArray(item.roles)
        ? item.roles
        : [];

    const eligibility = Array.isArray(item.eligibility)
        ? item.eligibility
        : [];

    const opportunity = Array.isArray(item.opportunity)
        ? item.opportunity
        : [];

    const projection =
        item.projection ?? null;

    const company =
        item.company ?? null;

    const roleNames = Array.from(
        new Set(
            roles
                .map(
                    (role: any) =>
                        role.drive_role_name ??
                        role.role_name ??
                        role.role_title ??
                        role.role_type,
                )
                .filter(Boolean),
        ),
    );

    const eligibleBranches = Array.from(
        new Set(
            eligibility.flatMap((rule: any) => {
                const value =
                    rule.allowed_branches ??
                    rule.branch_names ??
                    rule.branches ??
                    [];

                if (Array.isArray(value)) {
                    return value;
                }

                if (typeof value === "string") {
                    return value
                        .split(",")
                        .map((x: string) => x.trim());
                }

                return [];
            }),
        ),
    );

    const currentOpportunity =
        opportunity[0] ?? null;

    let lifecycleStatus =
        item.drive_status ?? "Unknown";

    if (currentOpportunity) {
        switch (currentOpportunity.application_status) {
            case "Upcoming":
                lifecycleStatus = "Upcoming";
                break;

            case "Open":
                lifecycleStatus = "Registration Open";
                break;

            case "Closed":
                lifecycleStatus = "Registration Closed";
                break;
        }
    }

    return {
        ...item,

        company,

        roles,

        eligibility,

        opportunity,

        projection,

        roleNames,

        eligibleBranches,

        lifecycleStatus,
    };
});
  },
};
