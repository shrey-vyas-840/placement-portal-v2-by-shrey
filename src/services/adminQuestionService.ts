import {
    supabase,
} from "@/lib/supabase";

export const adminQuestionService = {

    async getQuestions(
        opportunityId: string
    ) {

        const {
            data,
            error
        }
            =
            await (supabase as any)

                .from(
                    "opportunity_questions"
                )
                .select(`
*,
opportunity_question_options(*)
`)
                .eq(
                    "opportunity_id",
                    opportunityId
                )
                .order(
                    "position"
                );
        if (error)
            throw error;
        return data || [];

    },
    async saveQuestions(
        opportunityId: string,
        questions: any[]
    ) {

        const {
            data: existingQuestions
        } =
            await (supabase as any)
                .from(
                    "opportunity_questions"
                )
                .select(
                    "question_id"
                )
                .eq(
                    "opportunity_id",
                    opportunityId
                );

        const keepIds =
            questions
                .filter(
                    (q) => q.question_id
                )
                .map(
                    (q) => q.question_id
                );

        const deleteIds =
            existingQuestions
                ?.filter(
                    (q: any) =>
                        !keepIds.includes(
                            q.question_id
                        )
                )
                .map(
                    (q: any) =>
                        q.question_id
                ) || [];

        if (deleteIds.length) {

            await (supabase as any)
                .from(
                    "opportunity_question_options"
                )
                .delete()
                .in(
                    "question_id",
                    deleteIds
                );

            await (supabase as any)
                .from(
                    "opportunity_questions"
                )
                .delete()
                .in(
                    "question_id",
                    deleteIds
                );

        }

        for (
            const [index, q]
            of questions.entries()
        ) {

            let questionId =
                q.question_id;

            if (questionId) {

                const { error } =
                    await (supabase as any)
                        .from(
                            "opportunity_questions"
                        )
                        .update({

                            question_title:
                                q.question_title,

                            question_type:
                                q.question_type,

                            is_required:
                                q.is_required,

                            validation:
                                q.validation || {},

                            position:
                                index,

                        })
                        .eq(
                            "question_id",
                            questionId
                        );

                if (error)
                    throw error;

            } else {

                const {
                    data,
                    error
                } =
                    await (supabase as any)
                        .from(
                            "opportunity_questions"
                        )
                        .insert({

                            opportunity_id:
                                opportunityId,

                            question_title:
                                q.question_title,

                            question_type:
                                q.question_type,

                            is_required:
                                q.is_required,

                            validation:
                                q.validation || {},

                            position:
                                index,

                        })
                        .select()
                        .single();

                if (error)
                    throw error;

                questionId =
                    data.question_id;

            }

            await (supabase as any)
                .from(
                    "opportunity_question_options"
                )
                .delete()
                .eq(
                    "question_id",
                    questionId
                );

            if (
                q.options &&
                q.options.length
            ) {

                const options =
                    q.options.map(
                        (
                            option: string,
                            i: number
                        ) => ({

                            question_id:
                                questionId,

                            option_text:
                                option,

                            position:
                                i,

                        })
                    );

                const { error } =
                    await (supabase as any)
                        .from(
                            "opportunity_question_options"
                        )
                        .insert(
                            options
                        );

                if (error)
                    throw error;

            }

        }

    }

};