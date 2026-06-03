import {
    useEffect,
    useState,
} from "react";

import {
    adminNocService,
} from "@/services/adminNocService";

export function AdminNocDashboardPage() {

    const [
        pendingApproval,
        setPendingApproval,
    ] =
        useState<any[]>([]);

    const [
        pendingPrint,
        setPendingPrint,
    ] =
        useState<any[]>([]);

    const [
        printed,
        setPrinted,
    ] =
        useState<any[]>([]);

    const [
        issued,
        setIssued,
    ] =
        useState<any[]>([]);

    const [
        cancelled,
        setCancelled,
    ] =
        useState<any[]>([]);

    const [
        selectedRequest,
        setSelectedRequest,
    ] =
        useState<any>(
            null
        );

    const [
        editableSnapshot,
        setEditableSnapshot,
    ] =
        useState<any>(
            null
        );

    async function load() {

        const [
            approval,
            printQueue,
            printedData,
            issuedData,
            cancelledData,
        ] =
            await Promise.all([

                adminNocService
                    .getByStatus(
                        "PENDING_HOD_APPROVAL"
                    ),

                adminNocService
                    .getByStatus(
                        "PENDING_PRINT"
                    ),

                adminNocService
                    .getByStatus(
                        "PRINTED"
                    ),

                adminNocService
                    .getByStatus(
                        "ISSUED"
                    ),

                adminNocService
                    .getByStatus(
                        "CANCELLED"
                    ),

            ]);

        setPendingApproval(
            approval
        );

        setPendingPrint(
            printQueue
        );

        setPrinted(
            printedData
        );

        setIssued(
            issuedData
        );

        setCancelled(
            cancelledData
        );

    }

    useEffect(() => {
        load();
    }, []);

    function getDurationMonths(
        startDate: string,
        endDate: string
    ) {

        const start =
            new Date(startDate);

        const end =
            new Date(endDate);

        const months =
            (
                (end.getFullYear() - start.getFullYear()) * 12
            ) +
            (
                end.getMonth() - start.getMonth()
            );

        return Math.max(
            1,
            months || 1
        );

    }

    return (

        <div className="mx-auto max-w-7xl p-6">

            <h1 className="text-3xl font-bold">

                NOC Dashboard

            </h1>

            <div className="mt-6 grid gap-4 md:grid-cols-5">

                <div className="rounded-lg border p-4">

                    <div className="text-sm text-muted-foreground">

                        Pending Approval

                    </div>

                    <div className="text-2xl font-bold">

                        {pendingApproval.length}

                    </div>

                </div>

                <div className="rounded-lg border p-4">

                    <div className="text-sm text-muted-foreground">

                        Pending Print

                    </div>

                    <div className="text-2xl font-bold">

                        {pendingPrint.length}

                    </div>

                </div>

                <div className="rounded-lg border p-4">

                    <div className="text-sm text-muted-foreground">

                        Printed

                    </div>

                    <div className="text-2xl font-bold">

                        {printed.length}

                    </div>

                </div>

                <div className="rounded-lg border p-4">

                    <div className="text-sm text-muted-foreground">

                        Issued

                    </div>

                    <div className="text-2xl font-bold">

                        {issued.length}

                    </div>

                </div>

                <div className="rounded-lg border p-4">

                    <div className="text-sm text-muted-foreground">

                        Cancelled

                    </div>

                    <div className="text-2xl font-bold">

                        {cancelled.length}

                    </div>

                </div>

            </div>

            <h2 className="mt-8 mb-4 text-xl font-semibold">

                Pending HOD Approval

            </h2>

            <div className="mt-6 overflow-hidden rounded-lg border">

                <table className="w-full">

                    <thead>

                        <tr className="border-b">

                            <th className="p-3 text-left">
                                Type
                            </th>

                            <th className="p-3 text-left">
                                Status
                            </th>

                            <th className="p-3 text-left">
                                Approval Source
                            </th>

                            <th className="p-3 text-left">
                                Actions
                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        {pendingApproval.map(
                            (
                                request: any
                            ) => (

                                <tr
                                    key={
                                        request.noc_request_id
                                    }
                                    className="border-b"
                                >

                                    <td className="p-3">

                                        {
                                            request.noc_type
                                        }

                                    </td>

                                    <td className="p-3">

                                        {
                                            request.status
                                        }

                                    </td>

                                    <td className="p-3">

                                        {
                                            request.approval_source
                                            ||
                                            "-"
                                        }

                                    </td>

                                    <td className="p-3 flex gap-2">

                                        <button

                                            onClick={() => {

                                                setSelectedRequest(
                                                    request
                                                );

                                                setEditableSnapshot(
                                                    structuredClone(
                                                        request.snapshot
                                                    )
                                                );

                                            }}

                                            className="rounded border px-3 py-1"

                                        >

                                            View

                                        </button>

                                        <button

                                            onClick={
                                                async () => {

                                                    await adminNocService
                                                        .moveToPendingPrint(
                                                            request.noc_request_id
                                                        );

                                                    load();

                                                }
                                            }

                                            className="rounded border px-3 py-1"

                                        >

                                            Override

                                        </button>

                                        <button

                                            onClick={
                                                async () => {

                                                    await adminNocService
                                                        .rejectRequest(
                                                            request.noc_request_id
                                                        );

                                                    load();

                                                }
                                            }

                                            className="rounded border px-3 py-1"

                                        >

                                            Reject

                                        </button>

                                    </td>

                                </tr>

                            )
                        )}

                    </tbody>

                </table>

            </div>

            <h2 className="mt-10 mb-4 text-xl font-semibold">

                Pending Print

            </h2>

            <div className="overflow-hidden rounded-lg border">

                <table className="w-full">

                    <thead>

                        <tr className="border-b">

                            <th className="p-3 text-left">
                                Type
                            </th>

                            <th className="p-3 text-left">
                                Approval Source
                            </th>

                            <th className="p-3 text-left">
                                Actions
                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        {pendingPrint.map(
                            (
                                request: any
                            ) => (

                                <tr
                                    key={
                                        request.noc_request_id
                                    }
                                    className="border-b"
                                >

                                    <td className="p-3">

                                        {
                                            request.noc_type
                                        }

                                    </td>

                                    <td className="p-3">

                                        {
                                            request.approval_source
                                            ||
                                            "-"
                                        }

                                    </td>

                                    <td className="p-3">

                                        <button

                                            onClick={() => {

                                                setSelectedRequest(
                                                    request
                                                );

                                                setEditableSnapshot(
                                                    structuredClone(
                                                        request.snapshot
                                                    )
                                                );

                                            }}

                                            className="rounded border px-3 py-1"

                                        >

                                            Review

                                        </button>

                                    </td>

                                </tr>

                            )
                        )}

                    </tbody>

                </table>

            </div>

            <h2 className="mt-10 mb-4 text-xl font-semibold">

                Printed

            </h2>

            <div className="rounded-lg border p-6 text-sm text-muted-foreground">

                Printed NOCs will appear here.

            </div>

            <h2 className="mt-10 mb-4 text-xl font-semibold">

                Issued

            </h2>

            <div className="rounded-lg border p-6 text-sm text-muted-foreground">

                Issued NOCs will appear here.

            </div>

            <h2 className="mt-10 mb-4 text-xl font-semibold">

                Cancelled

            </h2>

            <div className="rounded-lg border p-6 text-sm text-muted-foreground">

                Cancelled NOCs will appear here.

            </div>

            {selectedRequest && (

                <div className="fixed inset-0 flex items-center justify-center bg-black/40">

                    <div className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-lg bg-white p-6">

                        <h2 className="mb-4 text-2xl font-semibold">

                            NOC Review

                        </h2>

                        {editableSnapshot && (

                            <div className="mx-auto max-w-4xl bg-white px-16 py-8 text-sm leading-6"
                                style={{
                                    fontFamily: "Arial"
                                }}>

                                <div className="flex justify-between">

                                    <div className="font-bold">

                                        Ref.: T&P/INTERNSHIPS/

                                        {editableSnapshot.institute_name}

                                        /

                                        {editableSnapshot.branch}

                                        /2025-26

                                    </div>

                                    <div className="font-bold">

                                        Date:

                                        {" "}

                                        {
                                            selectedRequest?.approved_at
                                                ?
                                                new Date(
                                                    selectedRequest.approved_at
                                                ).toLocaleDateString(
                                                    "en-GB"
                                                )
                                                :
                                                "-"
                                        }

                                    </div>

                                </div>

                                <br />

                                <div>

                                    {editableSnapshot.hr_prefix}

                                    {" "}

                                    {editableSnapshot.hr_name},

                                </div>

                                <div>

                                    {editableSnapshot.hr_position}

                                </div>

                                <div>

                                    {editableSnapshot.company_name}

                                </div>

                                <div>

                                    {editableSnapshot.company_address_1}

                                </div>

                                <div>

                                    {editableSnapshot.company_address_2}

                                </div>

                                <br />

                                <div className="text-center font-bold">

                                    Sub.: NOC for {editableSnapshot.noc_type}

                                </div>

                                <br />

                                <div>

                                    Dear Sir/Ma'am,

                                </div>

                                <br />

                                <div>

                                    Greetings!!!

                                </div>

                                <br />

                                <div>

                                    <strong>
                                        Mr./Ms. {editableSnapshot.student_name}
                                    </strong>

                                    , currently pursuing

                                    {" "}

                                    <strong>
                                        {editableSnapshot.branch}
                                    </strong>

                                    ,

                                    Semester

                                    {" "}

                                    <strong>
                                        {editableSnapshot.semester}
                                    </strong>

                                    ,

                                    with Enrollment No.

                                    {" "}

                                    <strong>
                                        {editableSnapshot.enrollment_no}
                                    </strong>

                                    {" "}

                                    in our constituent Institute -

                                    {" "}

                                    <strong>
                                        {editableSnapshot.institute_name}
                                    </strong>

                                    ,

                                    has been selected for

                                    {" "}

                                    <strong>
                                        {getDurationMonths(
                                            editableSnapshot.start_date,
                                            editableSnapshot.end_date
                                        )}
                                    </strong>
                                    {" "}
                                    month/s internship in your organization from

                                    {" "}

                                    <strong>
                                        {editableSnapshot.start_date}
                                    </strong>

                                    {" "}

                                    to

                                    {" "}

                                    <strong>
                                        {editableSnapshot.end_date}
                                    </strong>

                                    .

                                    As per our University (NAAC Accredited, UGC & AICTE approved)
                                    academic policy, students must do the internship.

                                    The Internship project is monitored by the HOD and a Faculty Member regularly.

                                    Students are required to attend all Practical, Mid-Semester,
                                    and End-Semester examinations conducted by the university
                                    during the internship period.

                                </div>

                                <br />

                                <div>

                                    <strong>
                                        The Institute/Indus University will have NO OBJECTION for the student
                                        doing his/her Internship.
                                    </strong>

                                    Your organization is requested to give him/her a project
                                    (which he/she can submit it to the University authorities)
                                    as a part fulfillment of his/her course curriculum.

                                    Kindly note that the Student must be issued a Certificate
                                    confirming the successful completion of the project duly signed
                                    and sealed, by the competent authorities on your organization's
                                    letterhead.

                                </div>

                                <br />

                                He/She has been instructed to strictly

                                <strong>

                                    adhere to the rules,
                                    regulations,
                                    policies and guidelines of your organization
                                    during the internship period.

                                </strong>

                                <br />

                                <div>

                                    We solicit your kind support in this regard.

                                </div>

                                <br />

                                <div>

                                    Best regards

                                </div>

                                <br />
                                <br />

                                <div className="text-right">
                                    <div className="font-bold">

                                        Training & Placement Officer

                                    </div>

                                    <div className="font-bold">

                                        Indus University, Ahmedabad

                                    </div>

                                </div>
                            </div>

                        )}

                        <div className="mt-6">

                            <button

                                onClick={() =>
                                    setSelectedRequest(
                                        null
                                    )
                                }

                                className="rounded border px-4 py-2"

                            >

                                Close

                            </button>

                        </div>

                    </div>

                </div>

            )}

        </div>

    );

}