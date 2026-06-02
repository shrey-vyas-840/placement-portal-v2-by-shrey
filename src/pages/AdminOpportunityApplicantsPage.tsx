import {
    useEffect,
    useState,
} from "react";

import {
    Link,
} from "@tanstack/react-router";

import {
    adminOpportunityService,
} from "@/services/adminOpportunityService";


export function AdminOpportunityApplicantsPage({
    opportunityId,
}: {
    opportunityId: string;
}) {


    const [apps, setApps] =
        useState<any[]>([]);

    const [opportunity, setOpportunity] =
        useState<any>(null);

    const [search, setSearch] =
        useState("");

    const [instituteFilter, setInstituteFilter] =
        useState("All");

    const [branchFilter, setBranchFilter] =
        useState("All");

    const [statusFilter, setStatusFilter] =
        useState("All");

    const [cgpaFilter, setCgpaFilter] =
        useState("All");


    async function load() {

        const applicantData =
            await adminOpportunityService
                .getOpportunityApplicants(
                    opportunityId
                );


        const opportunityData =
            await adminOpportunityService
                .getOpportunityById(
                    opportunityId
                );


        setApps(applicantData);

        setOpportunity(opportunityData);

    }


    useEffect(() => {

        load();

    }, []);

    const filteredApplicants =
        apps.filter(
            (app) => {


                const enrollment =
                    app.student_master
                        ?.enrollment_no
                        ?.replace("IU", "")
                    ?? "";


                const searchMatch =
                    search === "" ||
                    enrollment.includes(
                        search
                    );


                const instituteMatch =
                    instituteFilter === "All" ||
                    app.academic
                        ?.current_institute_name
                    ===
                    instituteFilter;


                const branchMatch =
                    branchFilter === "All" ||
                    app.academic
                        ?.current_branch_name
                    ===
                    branchFilter;


                const statusMatch =
                    statusFilter === "All" ||
                    app.application_status
                    ===
                    statusFilter;


                let cgpaMatch = true;


                const cgpa =
                    Number(
                        app.academic
                            ?.current_cgpa ?? 0
                    );


                if (
                    cgpaFilter === "9+"
                ) {
                    cgpaMatch =
                        cgpa >= 9;
                }


                if (
                    cgpaFilter === "8+"
                ) {
                    cgpaMatch =
                        cgpa >= 8;
                }


                if (
                    cgpaFilter === "7+"
                ) {
                    cgpaMatch =
                        cgpa >= 7;
                }



                return (
                    searchMatch &&
                    instituteMatch &&
                    branchMatch &&
                    statusMatch &&
                    cgpaMatch
                );


            }
        );

    return (

        <div className="mx-auto max-w-7xl p-6">


            <div className="rounded-xl border p-5">


                <h1 className="text-2xl font-bold">

                    {
                        opportunity?.company_name
                    }

                </h1>


                <p className="mt-1">

                    {
                        opportunity?.opportunity_title
                    }

                </p>


                <div className="mt-3 flex items-center justify-between">

                    <p className="text-sm">

                        Total Applications:
                        {" "}
                        <b>
                            {apps.length}
                        </b>

                    </p>

                    <Link

                        to="/admin/export/$opportunityId"

                        params={{
                            opportunityId,
                        }}

                        className="rounded-lg border px-4 py-2 text-sm hover:bg-muted"

                    >

                        Export Data

                    </Link>

                </div>


            </div>

            <div className="mt-6">


                <div className="flex items-center">

                    <div className="rounded-l-lg border border-r-0 bg-muted px-4 py-2 font-medium">
                        IU
                    </div>


                    <input

                        value={search}

                        onChange={(e) => {

                            const value =
                                e.target.value
                                    .replace(/\D/g, "")
                                    .slice(0, 13);


                            setSearch(value);

                        }}

                        placeholder="Enter enrollment number"

                        className="w-full rounded-r-lg border px-4 py-2"

                    />


                </div>


            </div>



            <div className="mt-4 flex flex-wrap gap-3">


                <select

                    value={instituteFilter}

                    onChange={(e) =>
                        setInstituteFilter(
                            e.target.value
                        )
                    }

                    className="rounded-lg border px-4 py-2"

                >

                    <option value="All">
                        All Institutes
                    </option>


                    {
                        [
                            ...new Set(
                                apps.map(
                                    x => x.academic
                                        ?.current_institute_name
                                )
                            )
                        ]
                            .filter(Boolean)
                            .map(
                                x =>

                                    <option key={x}>
                                        {x}
                                    </option>

                            )
                    }


                </select>



                <select

                    value={branchFilter}

                    onChange={(e) =>
                        setBranchFilter(
                            e.target.value
                        )
                    }

                    className="rounded-lg border px-4 py-2"

                >

                    <option value="All">
                        All Branches
                    </option>


                    {
                        [
                            ...new Set(
                                apps.map(
                                    x => x.academic
                                        ?.current_branch_name
                                )
                            )
                        ]
                            .filter(Boolean)
                            .map(
                                x =>

                                    <option key={x}>
                                        {x}
                                    </option>

                            )
                    }

                </select>



                <select

                    value={statusFilter}

                    onChange={(e) =>
                        setStatusFilter(
                            e.target.value
                        )
                    }

                    className="rounded-lg border px-4 py-2"

                >


                    <option value="All">
                        All Status
                    </option>

                    <option value="Applied">
                        Applied
                    </option>

                    <option value="Shortlisted">
                        Shortlisted
                    </option>

                    <option value="Interview Scheduled">
                        Interview Scheduled
                    </option>

                    <option value="Selected">
                        Selected
                    </option>

                    <option value="Rejected">
                        Rejected
                    </option>


                </select>



                <select

                    value={cgpaFilter}

                    onChange={(e) =>
                        setCgpaFilter(
                            e.target.value
                        )
                    }

                    className="rounded-lg border px-4 py-2"

                >

                    <option value="All">
                        All CGPA
                    </option>

                    <option value="9+">
                        9+
                    </option>

                    <option value="8+">
                        8+
                    </option>

                    <option value="7+">
                        7+
                    </option>


                </select>


                <button

                    onClick={() => {

                        setSearch("");

                        setInstituteFilter("All");

                        setBranchFilter("All");

                        setStatusFilter("All");

                        setCgpaFilter("All");

                    }}

                    className="rounded-lg border px-4 py-2"

                >

                    Reset

                </button>


            </div>

            <div className="mt-6 overflow-x-auto rounded-xl border">


                <table className="w-full min-w-[900px]">


                    <thead>


                        <tr className="border-b">


                            <th className="p-3 text-left">
                                Sr
                            </th>


                            <th className="p-3 text-left">
                                Enrollment
                            </th>


                            <th className="p-3 text-left">
                                Name
                            </th>


                            <th className="p-3 text-left">
                                Institute
                            </th>


                            <th className="p-3 text-left">
                                Branch
                            </th>

                            <th className="p-3 text-left">
                                CGPA
                            </th>


                            <th className="p-3 text-left">
                                Applied Date
                            </th>


                            <th className="p-3 text-left">
                                Status
                            </th>


                        </tr>


                    </thead>



                    <tbody>


                        {
                            filteredApplicants.map(
                                (app, index) => (


                                    <tr
                                        key={
                                            app.application_id
                                        }
                                        className="border-b"
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
                                                        ?.enrollment_no
                                                }

                                            </Link>


                                        </td>


                                        <td className="p-3">

                                            {
                                                app.student_master?.first_name
                                            }
                                            {" "}
                                            {
                                                app.student_master?.last_name
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
                                                    ?.current_cgpa
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

                                        <td className="p-3">


                                            <select

                                                value={
                                                    app.application_status
                                                }

                                                onChange={async (e) => {


                                                    await adminOpportunityService
                                                        .updateApplicationStatus(
                                                            app.application_id,
                                                            e.target.value
                                                        );


                                                    await load();


                                                }}

                                                className="rounded border px-2 py-1"

                                            >


                                                <option value="Applied">
                                                    Applied
                                                </option>

                                                <option value="Shortlisted">
                                                    Shortlisted
                                                </option>

                                                <option value="Interview Scheduled">
                                                    Interview Scheduled
                                                </option>

                                                <option value="Selected">
                                                    Selected
                                                </option>

                                                <option value="Rejected">
                                                    Rejected
                                                </option>


                                            </select>


                                        </td>


                                    </tr>


                                )
                            )
                        }


                    </tbody>


                </table>


            </div>


        </div>

    );

}