import { supabase } from "@/lib/supabase";

export const adminOpportunityService = {

    async getDrives() {

        const { data, error } =
            await (supabase as any)
                .from("drive_master")
                .select(`
                    *,
                    company_master(
                        company_name
                    )
                `)
                .eq(
                    "is_active",
                    true,
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

    async getOpportunities() {

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
                .order(
                    "created_at",
                    {
                        ascending: false,
                    },
                );

        if (error) throw error;

        return data || [];
    },

    async createOpportunity(
        payload: {
            drive_id: string;
            opportunity_title: string;
            opportunity_description?: string;
            registration_deadline: string;
        },
    ) {

        const { error: driveError } =
            await (supabase as any)
                .from(
                    "drive_master",
                )
                .update({
                    registration_deadline:
                        payload.registration_deadline,
                })
                .eq(
                    "drive_id",
                    payload.drive_id,
                );

        if (driveError)
            throw driveError;

        const { data, error } =
            await (supabase as any)
                .from(
                    "opportunity_master",
                )
                .insert({
                    drive_id:
                        payload.drive_id,

                    opportunity_title:
                        payload.opportunity_title,

                    opportunity_description:
                        payload.opportunity_description ||
                        null,

                    application_status:
                        "Draft",

                    visible_to_students:
                        false,
                })
                .select()
                .single();

        if (error)
            throw error;

        return data;
    },

    async updateOpportunityStatus(
        opportunityId: string,
        status: string,
    ) {

        const { error } =
            await (supabase as any)
                .from(
                    "opportunity_master",
                )
                .update({
                    application_status:
                        status,
                })
                .eq(
                    "opportunity_id",
                    opportunityId,
                );

        if (error) throw error;
    },

    async toggleVisibility(
        opportunityId: string,
        visible: boolean,
    ) {

        const { error } =
            await (supabase as any)
                .from(
                    "opportunity_master",
                )
                .update({
                    visible_to_students:
                        visible,
                })
                .eq(
                    "opportunity_id",
                    opportunityId,
                );

        if (error) throw error;
    },

    async getApplications() {

        const { data, error } =
            await (supabase as any)
                .from(
                    "student_applications",
                )
                .select("*")
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