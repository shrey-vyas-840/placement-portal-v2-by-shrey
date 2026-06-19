import { supabase } from "@/lib/supabase";

export const studentApplicationService = {

    async getMyApplications(
        studentId: string,
    ) {

        const { data, error } =
            await (supabase as any)
                .from(
                    "student_opportunity_applications",
                )
                .select(`
                    *,
                   opportunity_master(
    opportunity_title,
    opportunity_description,
    drive_master(
        drive_name,
        drive_type,
        lowest_package_lpa,
        highest_package_lpa,
        company_master(
            company_name
        )
    )
)
                `)
                .eq(
                    "student_id",
                    studentId,
                )
                .order(
                    "applied_at",
                    {
                        ascending: false,
                    },
                );

        if (error) throw error;

        return data || [];
    },
};