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


        } catch (error: any) {

            alert(
                error?.message
                ||
                "Application failed"
            );

        }

    }

    return (

        <div className="min-h-screen bg-background">

            <div className="mx-auto max-w-7xl px-6 py-8">

                <h1 className="text-3xl font-bold">
                    Opportunities
                </h1>

                <div
                    className="
        mt-8
        grid
        gap-6
        md:grid-cols-2
        2xl:grid-cols-3
    "
                >

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
                                    key={opportunity.opportunity_id}
                                    className="
    group
    relative
    overflow-hidden
    rounded-3xl
    border
    border-border/50
    bg-white
    p-5
    shadow-sm
    transition-all
    duration-300
    hover:-translate-y-1
    hover:shadow-xl
"
                                >
                                    <div
                                        className="
        absolute
        left-0
        top-0
        h-1
        w-full
        bg-gradient-to-r
        from-primary
        via-cyan-500
        to-emerald-500
    "
                                    />

                                    <div className="flex items-start justify-between gap-4">

                                        <div className="flex gap-3">

                                            <div
                                                className="
                flex
                h-12
                w-12
                shrink-0
                items-center
                justify-center
                rounded-2xl
                bg-primary/10
                font-bold
                text-primary
            "
                                            >
                                                {
                                                    (
                                                        opportunity
                                                            .drive_master
                                                            ?.company_master
                                                            ?.company_name?.[0] ?? "C"
                                                    ).toUpperCase()
                                                }
                                            </div>

                                            <div>
                                                <h2 className="text-base font-semibold">
                                                    {
                                                        opportunity
                                                            .drive_master
                                                            ?.company_master
                                                            ?.company_name ??
                                                        opportunity.opportunity_title
                                                    }
                                                </h2>

                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    {opportunity.opportunity_title}
                                                </p>
                                            </div>

                                        </div>

                                        <span
                                            className="
            rounded-full
            bg-emerald-50
            px-3
            py-1
            text-xs
            font-medium
            text-emerald-700
        "
                                        >
                                            Eligible
                                        </span>

                                    </div>
                                    <div className="mt-3 space-y-1.5 text-xs">

                                        <div className="flex justify-between gap-3">
                                            <span
                                                className="
        rounded-full
        bg-primary/10
        px-2.5
        py-1
        font-semibold
        text-primary
    "
                                            >
                                                Package
                                            </span>

                                            <span className="font-medium text-right">
                                                {opportunity.drive_master?.lowest_package_lpa &&
                                                    opportunity.drive_master?.highest_package_lpa
                                                    ? `${opportunity.drive_master.lowest_package_lpa} - ${opportunity.drive_master.highest_package_lpa} LPA`
                                                    : "-"}
                                            </span>
                                        </div>

                                        <div className="flex justify-between gap-3">
                                            <span className="text-muted-foreground">
                                                Drive Type
                                            </span>

                                            <span className="font-medium text-right">
                                                {opportunity.drive_master?.drive_type ?? "-"}
                                            </span>
                                        </div>

                                        <div className="flex justify-between gap-3">
                                            <span className="text-muted-foreground">
                                                Bond
                                            </span>

                                            <span className="font-medium text-right">
                                                {opportunity.drive_master?.bond_years
                                                    ? `${opportunity.drive_master.bond_years} Years`
                                                    : "None"}
                                            </span>
                                        </div>

                                        <div className="flex justify-between gap-3">
                                            <span
                                                className="
        rounded-full
        bg-amber-50
        px-2
        py-1
        font-medium
        text-amber-700
    "
                                            >
                                                Deadline
                                            </span>

                                            <span className="font-medium text-right">
                                                {new Date(
                                                    opportunity.application_end_date
                                                ).toLocaleDateString()}
                                            </span>
                                        </div>

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
                            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                                <h2>Additional Questions</h2>

                                {questions.map((q: any) => (
                                    <div key={q.question_id} className="mb-4">

                                        <label>
                                            {q.question_title}
                                            {q.is_required ? " *" : ""}
                                        </label>

                                        {q.question_type === "text" && (
                                            <input
                                                className="border w-full"
                                                onChange={(e) =>
                                                    setAnswers({ ...answers, [q.question_id]: e.target.value })
                                                }
                                            />
                                        )}
                                        {q.question_type === "number" && (
                                            <input
                                                type="number"
                                                min={
                                                    q.validation?.min
                                                }
                                                max={
                                                    q.validation?.max
                                                }
                                                className="border w-full"
                                                value={
                                                    answers[q.question_id] || ""
                                                }
                                                onChange={(e) =>
                                                    setAnswers({
                                                        ...answers,
                                                        [q.question_id]:
                                                            e.target.value
                                                    })
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
                                                min={
                                                    q.validation?.minDate
                                                }
                                                max={
                                                    q.validation?.maxDate
                                                }
                                                className="border w-full"
                                                onChange={(e) =>
                                                    setAnswers({
                                                        ...answers,
                                                        [q.question_id]:
                                                            e.target.value
                                                    })
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

                                        {q.question_type === "mcq" && (
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

                                        {q.question_type === "file" && (
                                            <input
                                                type="file"
                                                className="border w-full p-2 rounded"
                                                onChange={(e) => {

                                                    const file =
                                                        e.target.files?.[0];

                                                    if (!file) {
                                                        return;
                                                    }

                                                    setAnswers({
                                                        ...answers,
                                                        [q.question_id]:
                                                            file,
                                                    });

                                                }}
                                            />
                                        )}

                                    </div>
                                ))}

                                <div className="flex gap-3 pt-4">
                                    <button
                                        className="px-4 py-2 border rounded"
                                        disabled={pendingApply}
                                        onClick={async () => {

                                            for (const q of questions) {

                                                const answer =
                                                    answers[q.question_id];

                                                if (
                                                    q.is_required &&
                                                    (
                                                        answer === undefined ||
                                                        answer === null ||
                                                        answer === "" ||
                                                        (
                                                            Array.isArray(answer) &&
                                                            answer.length === 0
                                                        )
                                                    )
                                                ) {

                                                    alert(
                                                        `${q.question_title} is required`
                                                    );

                                                    return;
                                                }

                                                if (
                                                    q.question_type === "text"
                                                ) {

                                                    if (
                                                        q.validation?.minLength &&
                                                        answer?.length <
                                                        q.validation.minLength
                                                    ) {

                                                        alert(
                                                            `${q.question_title} is too short`
                                                        );

                                                        return;
                                                    }

                                                    if (
                                                        q.validation?.maxLength &&
                                                        answer?.length >
                                                        q.validation.maxLength
                                                    ) {

                                                        alert(
                                                            `${q.question_title} is too long`
                                                        );

                                                        return;
                                                    }

                                                    if (
                                                        q.validation?.alphaOnly &&
                                                        answer &&
                                                        !/^[A-Za-z ]+$/.test(answer)
                                                    ) {

                                                        alert(
                                                            `${q.question_title} allows only alphabets`
                                                        );

                                                        return;
                                                    }

                                                }

                                                if (
                                                    q.question_type === "paragraph"
                                                ) {

                                                    if (
                                                        q.validation?.minLength &&
                                                        answer?.length <
                                                        q.validation.minLength
                                                    ) {

                                                        alert(
                                                            `${q.question_title} is too short`
                                                        );

                                                        return;
                                                    }

                                                    if (
                                                        q.validation?.maxLength &&
                                                        answer?.length >
                                                        q.validation.maxLength
                                                    ) {

                                                        alert(
                                                            `${q.question_title} is too long`
                                                        );

                                                        return;
                                                    }

                                                }

                                                if (
                                                    q.question_type === "number"
                                                ) {

                                                    const value =
                                                        Number(answer);

                                                    const digits =
                                                        String(answer || "")
                                                            .replace(/\D/g, "")
                                                            .length;

                                                    if (
                                                        q.validation?.min !==
                                                        undefined &&
                                                        value <
                                                        q.validation.min
                                                    ) {

                                                        alert(
                                                            `${q.question_title} is below minimum value`
                                                        );

                                                        return;
                                                    }

                                                    if (
                                                        q.validation?.max !==
                                                        undefined &&
                                                        value >
                                                        q.validation.max
                                                    ) {

                                                        alert(
                                                            `${q.question_title} exceeds maximum value`
                                                        );

                                                        return;
                                                    }

                                                    if (
                                                        q.validation?.minDigits &&
                                                        digits <
                                                        q.validation.minDigits
                                                    ) {

                                                        alert(
                                                            `${q.question_title} requires more digits`
                                                        );

                                                        return;
                                                    }

                                                    if (
                                                        q.validation?.maxDigits &&
                                                        digits >
                                                        q.validation.maxDigits
                                                    ) {

                                                        alert(
                                                            `${q.question_title} exceeds allowed digits`
                                                        );

                                                        return;
                                                    }

                                                }

                                                if (
                                                    q.question_type === "checkbox"
                                                ) {

                                                    const count =
                                                        answer?.length || 0;

                                                    if (
                                                        q.validation?.minSelection &&
                                                        count <
                                                        q.validation.minSelection
                                                    ) {

                                                        alert(
                                                            `${q.question_title}: select more options`
                                                        );

                                                        return;
                                                    }
                                                    if (
                                                        q.validation?.maxSelection &&
                                                        count >
                                                        q.validation.maxSelection
                                                    ) {

                                                        alert(
                                                            `${q.question_title}: too many selections`
                                                        );

                                                        return;
                                                    }

                                                }

                                                if (
                                                    q.question_type === "file"
                                                ) {

                                                    const file =
                                                        answer as File;

                                                    if (!file)
                                                        continue;

                                                    const extension =
                                                        file.name
                                                            .split(".")
                                                            .pop()
                                                            ?.toLowerCase();

                                                    const allowed =
                                                        q.validation
                                                            ?.allowedExtensions
                                                        || [];

                                                    if (
                                                        allowed.length > 0 &&
                                                        !allowed.includes(
                                                            extension
                                                        )
                                                    ) {

                                                        alert(
                                                            `${q.question_title}: invalid file type`
                                                        );

                                                        return;
                                                    }

                                                    const maxBytes =
                                                        (
                                                            q.validation
                                                                ?.maxSizeMb
                                                            || 0
                                                        )
                                                        *
                                                        1024
                                                        *
                                                        1024;

                                                    if (
                                                        maxBytes > 0 &&
                                                        file.size >
                                                        maxBytes
                                                    ) {

                                                        alert(
                                                            `${q.question_title}: file too large`
                                                        );

                                                        return;
                                                    }

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
                                        className="px-4 py-2 border rounded"
                                        onClick={() => {
                                            setSelectedOpportunity(null);
                                            setAnswers({});
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }
            </div>
        </div>
    );
}
