import {
    useEffect,
    useState,
} from "react";

import { supabase } from "@/lib/supabase";

import {
    studentOpportunityService,
} from "@/services/studentOpportunityService";

export function StudentOpportunitiesPage() {

    const [opportunities,
        setOpportunities] =
        useState<any[]>([]);

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
    ) {

        const {
            data: authData,
        } =
            await supabase.auth.getUser();

        const studentId =
            authData.user?.id;

        if (!studentId) {

            alert(
                "User not found",
            );

            return;
        }

        try {

            await studentOpportunityService.apply(
                opportunityId,
                studentId,
            );

            alert(
                "Application submitted",
            );

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
                                        onClick={() =>
                                            apply(
                                                opportunity.opportunity_id,
                                            )
                                        }
                                        className="mt-4 rounded border px-4 py-2"
                                    >
                                        Apply
                                    </button>

                                </div>
                            ),
                        )}

                </div>

            </div>

        </div>
    );
}