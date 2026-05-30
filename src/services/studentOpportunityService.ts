import { supabase } from "@/lib/supabase";

export const studentOpportunityService = {

    async getPublishedOpportunities() {

        const { data, error } =
            await (supabase as any)
                .from(
                    "opportunity_master",
                )
                .select(`
                    *,
                    drive_master(
                        drive_name
                    )
                `)
                .eq(
                    "visible_to_students",
                    true,
                )
                .eq(
                    "application_status",
                    "Open",
                )
                .order(
                    "created_at",
                    {
                        ascending: false,
                    },
                );

        if (error) throw error;

        return data || [];
    },

    async apply(
        opportunityId: string,
        studentId: string,
    ) {

        const { error } =
            await (supabase as any)
                .from(
                    "student_opportunity_applications",
                )
                .insert({
                    opportunity_id:
                        opportunityId,

                    student_id:
                        studentId,
                });

        if (error) throw error;
    },
};