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
            application_end_date: string;
            publish: boolean;
        },
    ) {

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
                        payload.opportunity_description
                        || null,

                    application_start_date:
                        new Date()
                            .toISOString(),

                    application_end_date:
                        payload.application_end_date,

                    application_status:
                        payload.publish
                            ?
                            "Open"
                            :
                            "Draft",

                    visible_to_students:
                        payload.publish,

                })
                .select()
                .single();


        if (error) {
            throw error;
        }


        return data;
    },

    async publishOpportunity(
        opportunityId: string,
    ) {

        const { error } =
            await (supabase as any)
                .from(
                    "opportunity_master"
                )
                .update({

                    visible_to_students: true,

                    application_status:
                        "Open",

                    application_start_date:
                        new Date()
                            .toISOString(),

                })
                .eq(
                    "opportunity_id",
                    opportunityId
                );


        if (error) {
            throw error;
        }

    },


    async extendDeadline(
        opportunityId: string,
        newDeadline: string
    ) {

        const { error } =
            await (supabase as any)

                .from(
                    "opportunity_master"
                )

                .update({

                    application_end_date:
                        newDeadline,

                    application_status:
                        "Open",

                    visible_to_students:
                        true,

                })

                .eq(
                    "opportunity_id",
                    opportunityId
                );


        if (error)
            throw error;

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
                    "student_opportunity_applications",
                )
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
                .order(
                    "applied_at",
                    {
                        ascending: false,
                    },
                );

        if (error) throw error;

        return data || [];
    },

    async updateApplicationStatus(
        applicationId: string,
        status: string,
    ) {

        const { error } =
            await (supabase as any)
                .from(
                    "student_opportunity_applications",
                )
                .update({
                    application_status:
                        status,
                })
                .eq(
                    "application_id",
                    applicationId,
                );

        if (error) throw error;
    },

    async getApplicantDetails() {

        const { data, error } =
            await (supabase as any)
                .from(
                    "student_opportunity_applications",
                )
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
                .order(
                    "applied_at",
                    {
                        ascending: false,
                    },
                );

        if (error) throw error;

        const applications =
            data || [];

        const studentIds =
            applications.map(
                (x: any) =>
                    x.student_id,
            );

        const {
            data: academics,
        } =
            await (supabase as any)
                .from(
                    "student_academic_details",
                )
                .select(`
                student_id,
                current_branch_name,
                current_cgpa,
                graduation_year
            `)
                .in(
                    "student_id",
                    studentIds,
                );

        const {
            data: resumes,
        } =
            await (supabase as any)
                .from(
                    "student_documents",
                )
                .select(`
                student_id,
                document_metadata(
                    storage_url,
                    document_type
                )
            `)
                .eq(
                    "is_active",
                    true,
                );

        return applications.map(
            (
                application: any,
            ) => {

                const academic =
                    academics?.find(
                        (a: any) =>
                            a.student_id ===
                            application.student_id,
                    );

                const resume =
                    resumes?.find(
                        (r: any) =>
                            r.student_id ===
                            application.student_id &&
                            r.document_metadata
                                ?.document_type ===
                            "Resume",
                    );

                return {
                    ...application,
                    academic,
                    resumeUrl:
                        resume?.document_metadata
                            ?.storage_url || "",
                };
            },
        );
    },

    async getOpportunityCards() {

        const { data: opportunities, error } =
            await (supabase as any)
                .from("opportunity_master")
                .select(`
                *,
                drive_master(
    drive_id,
    drive_name,
    company_id
)
            `)
                .order(
                    "created_at",
                    {
                        ascending: false,
                    },
                );


        if (error) throw error;


        const companyIds =
            opportunities
                ?.map(
                    (x: any) =>
                        x.drive_master?.company_id
                )
                .filter(Boolean)
            ?? [];


        const { data: companies } =
            await (supabase as any)
                .from(
                    "company_master"
                )
                .select(
                    "company_id, company_name"
                )
                .in(
                    "company_id",
                    companyIds
                );


        const { data: students } =
            await (supabase as any)
                .from(
                    "student_academic_details"
                )
                .select(`
            student_id,
            current_institute_name,
            current_branch_name,
            current_degree_level,
            current_cgpa,
            active_backlogs,
            graduation_year
        `);


        const { data: applications } =
            await (supabase as any)
                .from(
                    "student_opportunity_applications"
                )
                .select(
                    `
    opportunity_id,
    student_id
    `
                );

        const { data: eligibilityRules } =
            await (supabase as any)
                .from(
                    "drive_eligibility"
                )
                .select("*");

        return (
            opportunities ?? []
        ).map(
            (opp: any) => {


                const company =
                    companies?.find(
                        (c: any) =>
                            c.company_id ===
                            opp.drive_master
                                ?.company_id
                    );


                const applied =
                    [
                        ...new Set(
                            applications
                                ?.filter(
                                    (a: any) =>
                                        a.opportunity_id
                                        ===
                                        opp.opportunity_id
                                )
                                .map(
                                    (a: any) =>
                                        a.student_id
                                )
                            ??
                            []
                        )
                    ].length;


                const rule =
                    eligibilityRules?.find(
                        (r: any) =>
                            r.drive_id
                            ===
                            opp.drive_id
                    );


                const eligible =
                    (
                        students ?? []
                    )
                        .filter(
                            (student: any) => {


                                if (!rule) {
                                    return true;
                                }


                                const institutes =
                                    rule.allowed_institutes
                                        ?.split(",")
                                        .map(
                                            (x: string) => x.trim()
                                        )
                                    ?? [];


                                const branches =
                                    rule.allowed_branches
                                        ?.split(",")
                                        .map(
                                            (x: string) => x.trim()
                                        )
                                    ?? [];


                                const degrees =
                                    rule.allowed_degrees
                                        ?.split(",")
                                        .map(
                                            (x: string) => x.trim()
                                        )
                                    ?? [];


                                const batches =
                                    rule.passing_out_batches
                                        ?.split(",")
                                        .map(
                                            (x: string) => x.trim()
                                        )
                                    ?? [];



                                return (

                                    (
                                        institutes.length === 0 ||
                                        institutes.includes(
                                            student.current_institute_name
                                        )
                                    )

                                    &&

                                    (
                                        branches.length === 0 ||
                                        branches.includes(
                                            student.current_branch_name
                                        )
                                    )

                                    &&

                                    (
                                        degrees.length === 0 ||
                                        degrees.includes(
                                            student.current_degree_level
                                        )
                                    )

                                    &&

                                    (
                                        batches.length === 0 ||
                                        batches.includes(
                                            String(student.graduation_year)
                                        )
                                    )

                                    &&

                                    Number(
                                        student.current_cgpa
                                    )
                                    >=
                                    Number(
                                        rule.minimum_cgpa || 0
                                    )

                                    &&

                                    Number(
                                        student.active_backlogs
                                    )
                                    <=
                                    Number(
                                        rule.maximum_active_backlogs || 0
                                    )


                                );


                            }
                        ).length;


                return {

                    ...opp,

                    company:
                        company?.company_name,

                    deadline:
                        opp.application_end_date,

                    eligibleCount:
                        eligible,

                    appliedCount:
                        applied,

                    unappliedCount:
                        eligible - applied,

                };

            }
        );

    },

    async getOpportunityApplicants(
        opportunityId: string,
    ) {


        const { data: applications, error } =
            await (supabase as any)
                .from(
                    "student_opportunity_applications"
                )
                .select("*")
                .eq(
                    "opportunity_id",
                    opportunityId
                )
                .order(
                    "applied_at",
                    {
                        ascending: false,
                    }
                );


        if (error) {
            throw error;
        }


        const studentIds =
            applications?.map(
                (x: any) =>
                    x.student_id
            ) ?? [];



        const { data: students } =
            await (supabase as any)
                .from(
                    "student_master"
                )
                .select(`
            student_id,
            enrollment_no,
            first_name,
            last_name
        `)
                .in(
                    "student_id",
                    studentIds
                );



        const { data: academics } =
            await (supabase as any)
                .from(
                    "student_academic_details"
                )
                .select(`
            student_id,
            current_institute_name,
            current_branch_name,
            current_cgpa,
            graduation_year
        `)
                .in(
                    "student_id",
                    studentIds
                );



        return (
            applications ?? []
        ).map(
            (app: any) => ({

                ...app,


                student_master:

                    students?.find(
                        (s: any) =>
                            s.student_id
                            ===
                            app.student_id
                    ),



                academic:

                    academics?.find(
                        (a: any) =>
                            a.student_id
                            ===
                            app.student_id
                    ),

            })
        );

    },

    async getOpportunityById(
        opportunityId: string,
    ) {

        const { data, error } =
            await (supabase as any)
                .from(
                    "opportunity_master"
                )
                .select(`
                *,
                drive_master(
                    drive_id,
                    drive_name,
                    company_id
                )
            `)
                .eq(
                    "opportunity_id",
                    opportunityId
                )
                .single();


        if (error) {
            throw error;
        }


        const { data: company } =
            await (supabase as any)
                .from(
                    "company_master"
                )
                .select(
                    "company_name"
                )
                .eq(
                    "company_id",
                    data.drive_master.company_id
                )
                .single();


        return {

            ...data,

            company_name:
                company?.company_name,

        };

    },

    async updateOpportunity(
        opportunityId: string,
        payload: {
            opportunity_title: string;
            opportunity_description?: string;
            application_end_date: string;
        }
    ) {

        const { error } =
            await (supabase as any)
                .from(
                    "opportunity_master"
                )
                .update({

                    opportunity_title:
                        payload.opportunity_title,

                    opportunity_description:
                        payload.opportunity_description,

                    application_end_date:
                        payload.application_end_date,

                })
                .eq(
                    "opportunity_id",
                    opportunityId
                );


        if (error) {
            throw error;
        }

    },



};