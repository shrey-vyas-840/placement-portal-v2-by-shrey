import { supabase } from "@/lib/supabase";

export const studentOpportunityService = {

    async getPublishedOpportunities(
        studentId: string,
    ) {

        const { data: academic } =
            await (supabase as any)
                .from(
                    "student_academic_details",
                )
                .select("*")
                .eq(
                    "student_id",
                    studentId,
                )
                .maybeSingle();

        if (!academic) {
            return [];
        }

        const { data: opportunities, error } =
            await (supabase as any)
                .from(
                    "opportunity_master",
                )
                .select(`
    *,
    drive_master(
        drive_name
    ),
   student_opportunity_applications(
    student_id,
    application_status
)
`)
                .eq(
                    "visible_to_students",
                    true,
                )
                .eq(
                    "application_status",
                    "Open",
                ).gt(
                    "application_end_date",
                    new Date()
                        .toISOString()
                )
                .order(
                    "created_at",
                    {
                        ascending: false,
                    },
                );

        if (error) throw error;

        const processedOpportunities =
            [];

        for (const opportunity of opportunities || []) {

            const { data: eligibility } =
                await (supabase as any)
                    .from(
                        "drive_eligibility",
                    )
                    .select("*")
                    .eq(
                        "drive_id",
                        opportunity.drive_id,
                    )
                    .maybeSingle();

            if (!eligibility) {
                const alreadyApplied =
                    opportunity
                        .student_opportunity_applications
                        ?.some(
                            (app: any) =>
                                app.student_id
                                ===
                                studentId
                        )
                    ||
                    false;
                processedOpportunities.push({
                    ...opportunity,
                    alreadyApplied:
                        alreadyApplied,
                    eligibility_status:
                        "Eligible",
                    eligibility_reason:
                        "",
                });

                continue;
            }

            const institutes =
                eligibility.allowed_institutes
                    ?.split(",")
                    .map(
                        (x: string) =>
                            x.trim(),
                    ) || [];

            const degrees =
                eligibility.allowed_degrees
                    ?.split(",")
                    .map(
                        (x: string) =>
                            x.trim(),
                    ) || [];

            const branches =
                eligibility.allowed_branches
                    ?.split(",")
                    .map(
                        (x: string) =>
                            x.trim(),
                    ) || [];

            const instituteMatch =
                institutes.length === 0 ||
                institutes.includes(
                    academic.current_institute_name,
                );

            const degreeMatch =
                degrees.length === 0 ||
                degrees.includes(
                    academic.current_degree_level,
                );

            const branchMatch =
                branches.length === 0 ||
                branches.includes(
                    academic.current_branch_name,
                );

            const cgpaMatch =
                Number(
                    academic.current_cgpa,
                ) >=
                Number(
                    eligibility.minimum_cgpa || 0,
                );

            const backlogMatch =
                Number(
                    academic.active_backlogs,
                ) <=
                Number(
                    eligibility.maximum_active_backlogs || 0,
                );

            const batches =
                eligibility.passing_out_batches
                    ?.split(",")
                    .map(
                        (x: string) =>
                            x.trim()
                    )
                ||
                [];


            const batchMatch =
                batches.length === 0
                ||
                batches.includes(
                    String(
                        academic.graduation_year
                    )
                );

            let reason = "";

            if (!instituteMatch) {
                reason =
                    "Institute not eligible";
            }
            else if (!degreeMatch) {
                reason =
                    "Degree not eligible";
            }
            else if (!branchMatch) {
                reason =
                    "Branch not eligible";
            }
            else if (!cgpaMatch) {
                reason =
                    "CGPA below requirement";
            }
            else if (!backlogMatch) {
                reason =
                    "Backlog criteria not met";
            }
            else if (!batchMatch) {
                reason =
                    "Graduation batch not eligible";
            }
            const alreadyApplied =
                opportunity
                    .student_opportunity_applications
                    ?.some(
                        (app: any) =>
                            app.student_id
                            ===
                            studentId
                    )
                ||
                false;
            processedOpportunities.push({
                ...opportunity,
                alreadyApplied:
                    alreadyApplied,
                eligibility_status:
                    instituteMatch &&
                        degreeMatch &&
                        branchMatch &&
                        cgpaMatch &&
                        backlogMatch &&
                        batchMatch
                        ? "Eligible"
                        : "Not Eligible",

                eligibility_reason:
                    reason,
            });
        }

        return processedOpportunities;
    },

    async apply(
        opportunityId: string,
        studentId: string,
        answers: any[] = [],
    ) {

        const {
            data: opportunity,
            error: opportunityError,
        } =
            await (supabase as any)
                .from(
                    "opportunity_master",
                )
                .select(`
                application_status,
                application_end_date,
                visible_to_students
            `)
                .eq(
                    "opportunity_id",
                    opportunityId,
                )
                .single();


        if (opportunityError)
            throw opportunityError;


        const deadlinePassed =
            opportunity.application_end_date
            &&
            new Date(
                opportunity.application_end_date,
            )
            <
            new Date();


        if (
            opportunity.application_status !== "Open"
            ||
            opportunity.visible_to_students !== true
            ||
            deadlinePassed
        ) {

            throw new Error(
                "Application closed",
            );

        }


        const {
            data: existingApplication,
        } =
            await (supabase as any)
                .from(
                    "student_opportunity_applications",
                )
                .select(
                    "application_id",
                )
                .eq(
                    "opportunity_id",
                    opportunityId,
                )
                .eq(
                    "student_id",
                    studentId,
                )
                .maybeSingle();


        if (existingApplication) {

            throw new Error(
                "Already applied",
            );

        }


        const {
            data: application,
            error,
        } =
            await (supabase as any)
                .from(
                    "student_opportunity_applications",
                )
                .insert({

                    opportunity_id:
                        opportunityId,

                    student_id:
                        studentId,

                })
                .select(
                    "application_id",
                )
                .single();


        if (error)
            throw error;



        if (
            answers.length > 0
        ) {

            const {
                error: answerError,
            } =
                await (supabase as any)
                    .from(
                        "opportunity_question_answers",
                    )
                    .insert(

                        answers.map(
                            (answer) => ({

                                application_id:
                                    application.application_id,

                                question_id:
                                    answer.question_id,

                                answer_value:
                                    answer.answer_value,

                            }),
                        ),

                    );


            if (answerError)
                throw answerError;

        }


        return application;

    },

};