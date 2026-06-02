import { supabase } from "@/lib/supabase";

export const NOC_TYPES = [
    "Internship",
    "Off Campus Placement",
    "On Campus Placement",
] as const;

export const NOC_STATUSES = {

    PENDING_HOD_APPROVAL:
        "PENDING_HOD_APPROVAL",

    HOD_REJECTED:
        "HOD_REJECTED",

    PENDING_PRINT:
        "PENDING_PRINT",

    PRINTED:
        "PRINTED",

    ISSUED:
        "ISSUED",

    CANCELLED:
        "CANCELLED",

} as const;

export type NocType =
    typeof NOC_TYPES[number];

export const nocService = {

    async getStudentProfileSnapshot(
        studentId: string
    ) {

        const {
            data: profile,
            error: profileError,
        } =
            await (supabase as any)

                .from(
                    "student_master"
                )

                .select("*")

                .eq(
                    "student_id",
                    studentId
                )

                .single();

        if (profileError)
            throw profileError;

        const {
            data: academics,
        } =
            await (supabase as any)

                .from(
                    "student_academic_details"
                )

                .select("*")

                .eq(
                    "student_id",
                    studentId
                )

                .maybeSingle();

        return {

            student_id:
                studentId,

            student_name:
                `${profile.first_name ?? ""}
                 ${profile.middle_name ?? ""}
                 ${profile.last_name ?? ""}`
                    .replace(
                        /\s+/g,
                        " "
                    )
                    .trim(),

            enrollment_no:
                profile.enrollment_no,

            institute_email:
                profile.institute_email,

            institute_name:
                academics?.current_institute_name,

            course:
                academics?.current_degree_level,

            semester:
                academics?.current_semester,

            branch:
                academics?.current_branch_name,

        };

    },

    async createRequest(

        studentId: string,

        payload: {

            noc_type: string;

            start_date: string;

            end_date: string;

            company_name: string;

            company_address_1: string;

            company_address_2: string;

            hr_prefix: string;

            hr_name: string;

            hr_position: string;

        }

    ) {

        const snapshot =
            await this
                .getStudentProfileSnapshot(
                    studentId
                );

        const {
            data: hod,
        } =
            await (supabase as any)

                .from(
                    "branch_hod_mapping"
                )

                .select("*")

                .eq(
                    "branch_name",
                    snapshot.branch
                )

                .eq(
                    "is_active",
                    true
                )

                .maybeSingle();

        const deadline =
            new Date();

        deadline.setHours(
            deadline.getHours()
            + 36
        );

        const finalSnapshot = {

            ...snapshot,

            noc_type:
                payload.noc_type,

            start_date:
                payload.start_date,

            end_date:
                payload.end_date,

            company_name:
                payload.company_name,

            company_address_1:
                payload.company_address_1,

            company_address_2:
                payload.company_address_2,

            hr_prefix:
                payload.hr_prefix,

            hr_name:
                payload.hr_name,

            hr_position:
                payload.hr_position,

        };

        const {
            data,
            error,
        } =
            await (supabase as any)

                .from(
                    "noc_requests"
                )

                .insert({

                    student_id:
                        studentId,

                    noc_type:
                        payload.noc_type,

                    hod_email:
                        hod?.hod_email
                        ??
                        "shrey36870@gmail.com",

                    status:
                        "PENDING_HOD_APPROVAL",

                    snapshot:
                        finalSnapshot,

                    hod_approval_deadline:
                        deadline.toISOString(),

                })

                .select()

                .single();

        if (error)
            throw error;

        return data;

    },

    async getStudentRequests(
        studentId: string
    ) {

        const {
            data,
            error,
        } =
            await (supabase as any)

                .from(
                    "noc_requests"
                )

                .select("*")

                .eq(
                    "student_id",
                    studentId
                )

                .order(
                    "created_at",
                    {
                        ascending:
                            false,
                    }
                );

        if (error)
            throw error;

        return data ?? [];

    },

};