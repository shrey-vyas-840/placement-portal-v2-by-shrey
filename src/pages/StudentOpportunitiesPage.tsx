import {
    useEffect,
    useState,
} from "react";

import {
    adminQuestionService,
} from "@/services/adminQuestionService";

import { supabase } from "@/lib/supabase";

import {
    studentOpportunityService,
} from "@/services/studentOpportunityService";

export function StudentOpportunitiesPage() {

    const [opportunities,
        setOpportunities] =
        useState<any[]>([]);

    const [
        selectedOpportunity,
        setSelectedOpportunity,
    ] =
        useState<any>(null);


    const [
        questions,
        setQuestions,
    ] =
        useState<any[]>([]);


    const [
        answers,
        setAnswers,
    ] =
        useState<any>({});

    const [
        pendingApply,
        setPendingApply,
    ] =
        useState(false);

    async function load() {

        const {
            data: authData,
        } =
            await supabase.auth.getUser();

        const authUserId =
            authData.user?.id;

        if (!authUserId) {
            return;
        }

        const { data: account } =
            await (supabase as any)
                .from(
                    "user_accounts",
                )
                .select(
                    "user_id",
                )
                .eq(
                    "auth_provider_id",
                    authUserId,
                )
                .maybeSingle();

        if (!account) {
            return;
        }

        const { data: student } =
            await (supabase as any)
                .from(
                    "student_master",
                )
                .select(
                    "student_id",
                )
                .eq(
                    "user_id",
                    account.user_id,
                )
                .maybeSingle();

        if (!student) {
            return;
        }

        const data =
            await studentOpportunityService.getPublishedOpportunities(
                student.student_id,
            );

        setOpportunities(
            data,
        );
    }

    useEffect(() => {
        load();
    }, []);

    async function apply(
        opportunityId: string,
        formAnswers: any[] = []
    ) {

        const {
            data: authData,
        } =
            await supabase.auth.getUser();


        const authUserId =
            authData.user?.id;


        if (!authUserId) {

            alert(
                "User not found",
            );

            return;
        }


        const { data: account } =
            await (supabase as any)
                .from(
                    "user_accounts",
                )
                .select(
                    "user_id",
                )
                .eq(
                    "auth_provider_id",
                    authUserId,
                )
                .maybeSingle();


        if (!account) {

            alert(
                "Account not found",
            );

            return;
        }


        const { data: student } =
            await (supabase as any)
                .from(
                    "student_master",
                )
                .select(
                    "student_id",
                )
                .eq(
                    "user_id",
                    account.user_id,
                )
                .maybeSingle();

        if (!student) {

            alert(
                "Student profile not found",
            );

            return;
        }

        try {

            await studentOpportunityService.apply(
                opportunityId,
                student.student_id,

                Object.entries(
                    answers
                )
                    .map(
                        ([key, value]) => ({

                            question_id: key,

                            answer_value:
                                Array.isArray(value)
                                    ?
                                    value.join(",")
                                    :
                                    value,

                        })
                    )
            );


            alert(
                "Application submitted",
            );


            await load();


        } catch {

            alert(
                "Already applied",
            );

        }

    }

    return (

        <div className="min-h-screen bg-background">

            <div className="mx-auto max-w-7xl px-6 py-8">

                <h1 className="text-3xl font-bold">
                    Opportunities
                </h1>

                <div className="mt-8 grid gap-4">

                    {opportunities
                        .filter(
                            (
                                opportunity,
                            ) =>
                                opportunity.eligibility_status ===
                                "Eligible",
                        ).map(
                            (
                                opportunity,
                            ) => (

                                <div
                                    key={
                                        opportunity.opportunity_id
                                    }
                                    className="rounded-lg border p-5"
                                >

                                    <h2 className="text-lg font-semibold">
                                        {
                                            opportunity.opportunity_title
                                        }
                                    </h2>

                                    <p className="mt-2 text-sm text-muted-foreground">
                                        {
                                            opportunity.drive_master?.drive_name
                                        }
                                    </p>

                                    <p className="mt-4">
                                        {
                                            opportunity.opportunity_description
                                        }
                                    </p>

                                    <div className="mt-3 text-sm">

                                        <span className="rounded border px-2 py-1">

                                            {
                                                opportunity
                                                    .eligibility_status
                                            }

                                        </span>

                                    </div>

                                    <button

                                        disabled={
                                            opportunity.alreadyApplied
                                        }

                                        onClick={async () => {

                                            const qs =
                                                await adminQuestionService
                                                    .getQuestions(
                                                        opportunity.opportunity_id
                                                    );


                                            if (
                                                qs.length > 0
                                            ) {

                                                setSelectedOpportunity(
                                                    opportunity
                                                );

                                                setQuestions(
                                                    qs
                                                );

                                                return;

                                            }


                                            apply(
                                                opportunity.opportunity_id
                                            );

                                        }}

                                        className="mt-4 rounded border px-4 py-2 disabled:opacity-50"

                                    >

                                        {
                                            opportunity.alreadyApplied
                                                ?
                                                "Already Applied"
                                                :
                                                "Apply"
                                        }

                                    </button>

                                </div>
                            ),
                        )}

                </div>
                {
                    selectedOpportunity && (
                        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
                            <div className="bg-white p-6 rounded w-[500px] max-h-[80vh] overflow-auto">
                                <h2>Additional Questions</h2>

                                {questions.map((q: any) => (
                                    <div key={q.question_id} className="mb-4">

                                        <label>
                                            {q.question_title}
                                            {q.is_required ? " *" : ""}
                                        </label>

                                        {q.question_type === "short_answer" && (
                                            <input
                                                className="border w-full"
                                                onChange={(e) =>
                                                    setAnswers({ ...answers, [q.question_id]: e.target.value })
                                                }
                                            />
                                        )}

                                        {q.question_type === "number" && (
                                            <input
                                                className="border w-full"
                                                onChange={(e) =>
                                                    setAnswers({ ...answers, [q.question_id]: e.target.value })
                                                }
                                            />
                                        )}

                                        {q.question_type === "paragraph" && (
                                            <textarea
                                                className="border w-full"
                                                onChange={(e) =>
                                                    setAnswers({ ...answers, [q.question_id]: e.target.value })
                                                }
                                            />
                                        )}

                                        {q.question_type === "date" && (
                                            <input
                                                type="date"
                                                className="border w-full"
                                                onChange={(e) =>
                                                    setAnswers({ ...answers, [q.question_id]: e.target.value })
                                                }
                                            />
                                        )}

                                        {q.question_type === "dropdown" && (
                                            <select
                                                className="border w-full"
                                                onChange={(e) =>
                                                    setAnswers({ ...answers, [q.question_id]: e.target.value })
                                                }
                                            >
                                                <option value="">Select</option>

                                                {q.opportunity_question_options?.map((o: any) => (
                                                    <option
                                                        key={o.option_id}
                                                        value={o.option_text}
                                                    >
                                                        {o.option_text}
                                                    </option>
                                                ))}

                                            </select>
                                        )}

                                        {q.question_type === "multiple_choice" && (
                                            <div>
                                                {q.opportunity_question_options?.map((o: any) => (
                                                    <label
                                                        key={o.option_id}
                                                        className="block"
                                                    >
                                                        <input
                                                            type="radio"
                                                            name={q.question_id}
                                                            onChange={() =>
                                                                setAnswers({ ...answers, [q.question_id]: o.option_text })
                                                            }
                                                        />
                                                        {o.option_text}
                                                    </label>
                                                ))}
                                            </div>
                                        )}

                                        {q.question_type === "checkbox" && (
                                            <div>
                                                {q.opportunity_question_options?.map((o: any) => (
                                                    <label
                                                        key={o.option_id}
                                                        className="block"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            onChange={(e) => {
                                                                const old = answers[q.question_id] || [];

                                                                setAnswers({
                                                                    ...answers,
                                                                    [q.question_id]:
                                                                        e.target.checked
                                                                            ? [...old, o.option_text]
                                                                            : old.filter((x: string) => x !== o.option_text)
                                                                });

                                                            }}
                                                        />
                                                        {o.option_text}
                                                    </label>
                                                ))}
                                            </div>
                                        )}

                                    </div>
                                ))}


                                <button
                                    disabled={pendingApply}
                                    onClick={async () => {

                                        for (const q of questions) {

                                            if (
                                                q.is_required &&
                                                (
                                                    !answers[q.question_id] ||
                                                    answers[q.question_id].length === 0
                                                )
                                            ) {

                                                alert("Please fill required questions");
                                                return;

                                            }

                                        }

                                        setPendingApply(true);

                                        await apply(
                                            selectedOpportunity.opportunity_id
                                        );

                                        setSelectedOpportunity(null);
                                        setQuestions([]);
                                        setAnswers({});

                                        setPendingApply(false);

                                    }}
                                >
                                    Submit Application
                                </button>


                                <button
                                    onClick={() => {
                                        setSelectedOpportunity(null);
                                        setAnswers({});
                                    }}
                                >
                                    Cancel
                                </button>

                            </div>
                        </div>
                    )
                }
            </div>
        </div>
    );
}