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
                        drive_master(
                            drive_name
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