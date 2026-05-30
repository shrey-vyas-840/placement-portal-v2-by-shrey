import { supabase } from "@/lib/supabase";

export const adminDriveService = {
    async getCompanies() {
        const { data, error } =
            await (supabase as any)
                .from("company_master")
                .select("*")
                .eq("is_deleted", false)
                .order("company_name");

        if (error) throw error;

        return data ?? [];
    },

    async createCompany(payload: {
        company_name: string;
        company_website?: string;
        hiring_location: string;
        industry_type?: string;
        company_description?: string;
        company_size?: string;
    }) {
        const { data, error } =
            await (supabase as any)
                .from("company_master")
                .insert({
                    company_name:
                        payload.company_name,
                    company_website:
                        payload.company_website ||
                        null,
                    hiring_location:
                        payload.hiring_location,
                    industry_type:
                        payload.industry_type ||
                        null,
                    company_description:
                        payload.company_description ||
                        null,
                    company_size:
                        payload.company_size ||
                        null,
                })
                .select()
                .single();

        if (error) throw error;

        return data;
    },

    async getDrives() {
        const { data, error } =
            await (supabase as any)
                .from("drive_master")
                .select(`
                *,
                company_master (
                    company_name
                )
            `)
                .eq("is_deleted", false)
                .order("created_at", {
                    ascending: false,
                });

        if (error) throw error;

        return data ?? [];
    },

    async createDrive(payload: {
        company_id: string;
        drive_name: string;
        drive_type: string;
        drive_mode: string;
        registration_deadline: string;
        drive_date?: string;
        lowest_package_lpa?: number;
        highest_package_lpa?: number;
        bond_years?: number;
        remarks?: string;
    }) {
        const { data, error } =
            await (supabase as any)
                .from("drive_master")
                .insert({
                    company_id:
                        payload.company_id,

                    drive_name:
                        payload.drive_name,

                    drive_type:
                        payload.drive_type,

                    drive_mode:
                        payload.drive_mode,

                    drive_status:
                        "Created",

                    registration_deadline:
                        payload.registration_deadline,

                    drive_date:
                        payload.drive_date,

                    lowest_package_lpa:
                        payload.lowest_package_lpa,

                    highest_package_lpa:
                        payload.highest_package_lpa,

                    bond_years:
                        payload.bond_years,

                    remarks:
                        payload.remarks,
                })
                .select()
                .single();

        if (error) throw error;

        return data;
    },

    async updateCompany(
        companyId: string,
        payload: {
            company_name: string;
            company_website?: string;
            hiring_location: string;
            industry_type?: string;
            company_description?: string;
            company_size?: string;
        },
    ) {
        const { data, error } =
            await (supabase as any)
                .from("company_master")
                .update({
                    company_name:
                        payload.company_name,

                    company_website:
                        payload.company_website ||
                        null,

                    hiring_location:
                        payload.hiring_location,

                    industry_type:
                        payload.industry_type ||
                        null,

                    company_description:
                        payload.company_description ||
                        null,

                    company_size:
                        payload.company_size ||
                        null,
                })
                .eq(
                    "company_id",
                    companyId,
                )
                .select()
                .single();

        if (error) throw error;

        return data;
    },

    async updateDrive(
        driveId: string,
        payload: {
            company_id: string;
            drive_name: string;
            drive_type: string;
            drive_mode: string;
            registration_deadline: string;
            drive_date?: string;
            lowest_package_lpa?: number;
            highest_package_lpa?: number;
            bond_years?: number;
            remarks?: string;
        },
    ) {
        const { data, error } =
            await (supabase as any)
                .from("drive_master")
                .update({
                    company_id:
                        payload.company_id,

                    drive_name:
                        payload.drive_name,

                    drive_type:
                        payload.drive_type,

                    drive_mode:
                        payload.drive_mode,

                    registration_deadline:
                        payload.registration_deadline,

                    drive_date:
                        payload.drive_date ||
                        null,

                    lowest_package_lpa:
                        payload.lowest_package_lpa,

                    highest_package_lpa:
                        payload.highest_package_lpa,

                    bond_years:
                        payload.bond_years,

                    remarks:
                        payload.remarks,
                })
                .eq(
                    "drive_id",
                    driveId,
                )
                .select()
                .single();

        if (error) throw error;

        return data;
    },

    async deactivateDrive(
        driveId: string,
    ) {
        const { error } =
            await (supabase as any)
                .from("drive_master")
                .update({
                    is_active: false,
                })
                .eq(
                    "drive_id",
                    driveId,
                );

        if (error) throw error;
    },

    async restoreDrive(
        driveId: string,
    ) {
        const { error } =
            await (supabase as any)
                .from("drive_master")
                .update({
                    is_active: true,
                })
                .eq(
                    "drive_id",
                    driveId,
                );

        if (error) throw error;
    },

    async updateDriveStatus(
        driveId: string,
        status: string,
    ) {
        const { error } =
            await (supabase as any)
                .from("drive_master")
                .update({
                    drive_status:
                        status,
                })
                .eq(
                    "drive_id",
                    driveId,
                );

        if (error) throw error;
    },
    async getEligibility(
        driveId: string,
    ) {
        const { data, error } =
            await (supabase as any)
                .from("drive_eligibility")
                .select("*")
                .eq("drive_id", driveId)
                .maybeSingle();

        if (error) throw error;

        return data;
    },

    async saveEligibility(
        payload: {
            drive_id: string;
            allowed_institutes: string;
            allowed_branches: string;
            allowed_degrees: string;
            additional_requirements?: string;
            passing_out_batch: number;
            minimum_cgpa: number;
            maximum_active_backlogs: number;
            willing_to_relocate_required: boolean;
        },
    ) {
        const { data: existing } =
            await (supabase as any)
                .from("drive_eligibility")
                .select("eligibility_id")
                .eq(
                    "drive_id",
                    payload.drive_id,
                )
                .maybeSingle();

        if (existing) {

            const { error } =
                await (supabase as any)
                    .from(
                        "drive_eligibility",
                    )
                    .update(payload)
                    .eq(
                        "drive_id",
                        payload.drive_id,
                    );

            if (error) throw error;

            return;
        }

        const { error } =
            await (supabase as any)
                .from("drive_eligibility")
                .insert(payload);

        if (error) throw error;
    },



};