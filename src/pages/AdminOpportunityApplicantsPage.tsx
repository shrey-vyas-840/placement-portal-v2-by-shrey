import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { adminOpportunityService } from "@/services/adminOpportunityService";


export function AdminOpportunityApplicantsPage({
    opportunityId,
}: {
    opportunityId: string;
}) {


    const [apps, setApps] = useState<any[]>([]);


    useEffect(() => {

        adminOpportunityService
            .getOpportunityApplicants(
                opportunityId
            )
            .then(setApps);

    }, []);



    return (

        <div className="min-h-screen">

            <div className="mx-auto max-w-7xl p-6">


                <h1 className="text-3xl font-bold">
                    Applicants
                </h1>


                <div className="mt-6 overflow-auto rounded border">


                    <table className="w-full">

                        <thead>

                            <tr className="border-b bg-muted">

                                <th className="p-3">
                                    #
                                </th>

                                <th className="p-3">
                                    Enrollment
                                </th>

                                <th className="p-3">
                                    Name
                                </th>

                                <th className="p-3">
                                    Institute
                                </th>

                                <th className="p-3">
                                    Branch
                                </th>

                                <th className="p-3">
                                    Applied
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            {apps.map(
                                (app, index) => (

                                    <tr
                                        className="border-b"
                                        key={app.application_id}
                                    >

                                        <td className="p-3">
                                            {index + 1}
                                        </td>


                                        <td className="p-3">

                                            <Link

                                                to="/admin/$studentId"

                                                params={{
                                                    studentId:
                                                        app.student_id
                                                }}

                                                className="underline"

                                            >

                                                {
                                                    app.student_master
                                                        .enrollment_no
                                                }

                                            </Link>

                                        </td>


                                        <td className="p-3">

                                            {
                                                app.student_master.first_name
                                            }
                                            {" "}
                                            {
                                                app.student_master.last_name
                                            }

                                        </td>


                                        <td className="p-3">

                                            {
                                                app.academic
                                                    ?.current_institute_name
                                            }

                                        </td>


                                        <td className="p-3">

                                            {
                                                app.academic
                                                    ?.current_branch_name
                                            }

                                        </td>


                                        <td className="p-3">

                                            {
                                                new Date(
                                                    app.applied_at
                                                )
                                                    .toLocaleString()
                                            }

                                        </td>


                                    </tr>

                                )

                            )}

                        </tbody>


                    </table>


                </div>

            </div>

        </div>

    );

}