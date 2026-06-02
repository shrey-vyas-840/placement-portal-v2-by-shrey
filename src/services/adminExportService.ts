import { supabase } from "@/lib/supabase";

export const adminExportService = {

    async getOpportunityExportData(
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
                (x: any) => x.student_id
            ) ?? [];

        if (
            studentIds.length === 0
        ) {

            return {
                rows: [],
                dynamicQuestions: [],
            };

        }

        const {
            data: profiles,
        } =
            await (supabase as any)

                .from(
                    "student_master"
                )

                .select("*")

                .in(
                    "student_id",
                    studentIds
                );

        const {
            data: academics,
        } =
            await (supabase as any)

                .from(
                    "student_academic_details"
                )

                .select("*")

                .in(
                    "student_id",
                    studentIds
                );

        const {
            data: skills,
        } =
            await (supabase as any)

                .from(
                    "student_skill_profile"
                )

                .select("*")

                .in(
                    "student_id",
                    studentIds
                );

        const {
            data: documents,
        } =
            await (supabase as any)

                .from(
                    "student_documents"
                )

                .select(`
                    *,
                    document_metadata:document_metadata_id (
                        document_name,
                        document_type,
                        storage_url
                    )
                `)

                .in(
                    "student_id",
                    studentIds
                )

                .eq(
                    "is_active",
                    true
                );

        const {
            data: questions,
        } =
            await (supabase as any)

                .from(
                    "opportunity_questions"
                )

                .select("*")

                .eq(
                    "opportunity_id",
                    opportunityId
                )

                .order(
                    "position"
                );

        const applicationIds =
            applications.map(
                (x: any) =>
                    x.application_id
            );

        const {
            data: answers,
        } =
            await (supabase as any)

                .from(
                    "opportunity_question_answers"
                )

                .select("*")

                .in(
                    "application_id",
                    applicationIds
                );

        const rows =
            applications.map(
                (
                    application: any
                ) => {

                    const profile =
                        profiles?.find(
                            (x: any) =>
                                x.student_id
                                ===
                                application.student_id
                        );

                    const academic =
                        academics?.find(
                            (x: any) =>
                                x.student_id
                                ===
                                application.student_id
                        );

                    const skill =
                        skills?.find(
                            (x: any) =>
                                x.student_id
                                ===
                                application.student_id
                        );

                    const resume =
                        documents?.find(
                            (x: any) =>
                                x.student_id
                                ===
                                application.student_id
                                &&
                                x.document_metadata
                                    ?.document_type
                                ===
                                "Resume"
                        );

                    const answerMap: any =
                        {};

                    questions?.forEach(
                        (
                            q: any
                        ) => {

                            const answer =
                                answers?.find(
                                    (
                                        a: any
                                    ) =>

                                        a.application_id
                                        ===
                                        application.application_id

                                        &&

                                        a.question_id
                                        ===
                                        q.question_id
                                );

                            if (!answer) {

                                answerMap[
                                    q.question_title
                                ] = "";

                                return;
                            }

                            const value =
                                answer.answer?.value;

                            if (
                                value
                                &&
                                typeof value
                                ===
                                "object"
                                &&
                                value.fileUrl
                            ) {

                                answerMap[
                                    q.question_title
                                ] =
                                    value.fileUrl;

                            } else {

                                answerMap[
                                    q.question_title
                                ] =
                                    value ?? "";

                            }

                        });

                    return {

                        application,

                        profile,

                        academic,

                        skill,

                        resumeUrl:
                            resume
                                ?.document_metadata
                                ?.storage_url
                            || "",

                        answers:
                            answerMap,

                    };

                }
            );

        return {

            rows,

            dynamicQuestions:
                questions?.map(
                    (
                        q: any
                    ) =>
                        q.question_title
                ) || [],

        };

    },

};