import { supabase } from "@/lib/supabase";

export const adminApplicationService = {

    async getApplications() {

        const { data, error } =
            await (supabase as any)
                .from("student_opportunity_applications")
                .select(`
                    *,
                    student_master(
                        student_id,
                        first_name,
                        last_name,
                        enrollment_no
                    ),
                    opportunity_master(
                        opportunity_id,
                        opportunity_title
                    )
                `)
                .order("applied_at", {
                    ascending: false,
                });

        if (error) throw error;

        return data || [];
    },

    async updateApplicationStatus(
        applicationId: string,
        status: string,
    ) {

        const { error } =
            await (supabase as any)
                .from("student_opportunity_applications")
                .update({
                    application_status: status,
                })
                .eq(
                    "application_id",
                    applicationId,
                );

        if (error) throw error;
    },
};