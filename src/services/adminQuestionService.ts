import {
    supabase,
}from "@/lib/supabase";

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
        await (supabase as any)
            .from(
                "opportunity_questions"
            )
            .delete()
            .eq(
                "opportunity_id",
                opportunityId
            );
        for (
            const [index, q]
            of questions.entries()
        ) {
            const {
                data: question,
                error
            }
                =
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
                        position: index,
                    })

                    .select()
                    .single();

            if (error)
                throw error;

            if (
                q.options?.length
            ) {
                await (supabase as any)
                    .from(
                        "opportunity_question_options"
                    )

                    .insert(
                        q.options.map(
                            (
                                option: string,
                                i: number
                            ) => ({

                                question_id:
                                    question.question_id,
                                option_text:
                                    option,
                                position: i

                            })
                        ));
            }
        }
    }

};