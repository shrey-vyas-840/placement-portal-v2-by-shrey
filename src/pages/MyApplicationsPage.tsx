import {
    useEffect,
    useState,
} from "react";

import { supabase } from "@/lib/supabase";

import {
    studentApplicationService,
} from "@/services/studentApplicationService";

export function MyApplicationsPage() {

    const [applications,
        setApplications] =
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
            await studentApplicationService.getMyApplications(
                student.student_id,
            );

        setApplications(
            data,
        );
    }

    useEffect(() => {
        load();
    }, []);

    return (

        <div className="min-h-screen bg-background">

            <div className="mx-auto max-w-7xl px-6 py-8">

                <h1 className="text-3xl font-bold">
                    My Applications
                </h1>

                <div className="mt-8 overflow-hidden rounded-lg border">

                    <table className="w-full">

                        <thead>

                            <tr className="border-b">

                                <th className="p-3 text-left">
                                    Opportunity
                                </th>

                                <th className="p-3 text-left">
                                    Drive
                                </th>

                                <th className="p-3 text-left">
                                    Status
                                </th>

                                <th className="p-3 text-left">
                                    Applied On
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            {applications.map(
                                (
                                    application,
                                ) => (

                                    <tr
                                        key={
                                            application.application_id
                                        }
                                        className="border-b"
                                    >

                                        <td className="p-3">
                                            {
                                                application
                                                    .opportunity_master
                                                    ?.opportunity_title
                                            }
                                        </td>

                                        <td className="p-3">
                                            {
                                                application
                                                    .opportunity_master
                                                    ?.drive_master
                                                    ?.drive_name
                                            }
                                        </td>

                                        <td className="p-3">
                                            {
                                                application
                                                    .application_status
                                            }
                                        </td>

                                        <td className="p-3">
                                            {
                                                new Date(
                                                    application.applied_at,
                                                ).toLocaleDateString()
                                            }
                                        </td>

                                    </tr>
                                ),
                            )}

                        </tbody>

                    </table>

                </div>

            </div>

        </div>
    );
}