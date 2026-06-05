import {
    useEffect,
    useState,
} from "react";

import {
    adminNocService,
} from "@/services/adminNocService";

function NocLetterBlock({
    snapshot,
    approvedAt,
    editable,
    customFields,
    setCustomFields,
}: {
    snapshot: any;
    approvedAt?: string | null;
    editable?: boolean;
    customFields?: any;
    setCustomFields?: any;
}) {
    const data = {
        ...snapshot,
        ...(customFields ?? {}),
    };

    return (
        <div
            className="mx-auto max-w-4xl bg-white px-12 py-75 text-sm leading-6"
            style={{
                fontFamily: "Arial",
            }}
        >
            <div className="flex justify-between">
                <div className="font-bold">
                    Ref.: T&amp;P/INTERNSHIPS/
                    {data.institute_name}
                    /
                    {data.branch}
                    /2025-26
                </div>

                <div className="font-bold">
                    Date:
                    {" "}
                    {approvedAt
                        ? new Date(approvedAt).toLocaleDateString("en-GB")
                        : "-"}
                </div>
            </div>

            <br />

            <div>
                {editable ? (
                    <>
                        <select
                            value={data.hr_prefix ?? "Mr."}
                            onChange={(e) =>
                                setCustomFields(
                                    (prev: any) => ({
                                        ...prev,
                                        hr_prefix: e.target.value,
                                    })
                                )
                            }
                            className="border-b outline-none bg-transparent"
                        >
                            <option value="Mr.">Mr.</option>
                            <option value="Ms.">Ms.</option>
                        </select>
                        {" "}
                        <input
                            value={data.hr_name ?? ""}
                            onChange={(e) =>
                                setCustomFields(
                                    (prev: any) => ({
                                        ...prev,
                                        hr_name: e.target.value,
                                    })
                                )
                            }
                            className="border-b outline-none bg-transparent"
                        />
                        ,
                    </>
                ) : (
                    <>
                        {data.hr_prefix} {data.hr_name},
                    </>
                )}
            </div>

            <div>
                {editable ? (
                    <input
                        value={data.hr_position ?? ""}
                        onChange={(e) =>
                            setCustomFields(
                                (prev: any) => ({
                                    ...prev,
                                    hr_position: e.target.value,
                                })
                            )
                        }
                        className="border-b outline-none bg-transparent w-full"
                    />
                ) : (
                    data.hr_position
                )}
            </div>

            <div>
                {editable ? (
                    <input
                        value={data.company_name ?? ""}
                        onChange={(e) =>
                            setCustomFields(
                                (prev: any) => ({
                                    ...prev,
                                    company_name: e.target.value,
                                })
                            )
                        }
                        className="border-b outline-none bg-transparent w-full"
                    />
                ) : (
                    data.company_name
                )}
            </div>

            <div>
                {editable ? (
                    <input
                        value={data.company_address_1 ?? ""}
                        onChange={(e) =>
                            setCustomFields(
                                (prev: any) => ({
                                    ...prev,
                                    company_address_1: e.target.value,
                                })
                            )
                        }
                        className="border-b outline-none bg-transparent w-full"
                    />
                ) : (
                    data.company_address_1
                )}
            </div>

            <div>
                {editable ? (
                    <input
                        value={data.company_address_2 ?? ""}
                        onChange={(e) =>
                            setCustomFields(
                                (prev: any) => ({
                                    ...prev,
                                    company_address_2: e.target.value,
                                })
                            )
                        }
                        className="border-b outline-none bg-transparent w-full"
                    />
                ) : (
                    data.company_address_2
                )}
            </div>

            <br />

            <div className="text-center font-bold">
                Sub.: NOC for {data.noc_type}
            </div>

            <br />

            <div>
                Dear Sir/Ma&apos;am,
            </div>

            <br />

            <div>
                Greetings!!!
            </div>

            <br />

            <div>
                <strong>
                    {data.student_prefix ?? "Mr./Ms."} {data.student_name}
                </strong>
                , currently pursuing
                {" "}
                <strong>
                    {data.branch}
                </strong>
                ,
                Semester
                {" "}
                <strong>
                    {data.semester}
                </strong>
                ,
                with Enrollment No.
                {" "}
                <strong>
                    {data.enrollment_no}
                </strong>
                {" "}
                in our constituent Institute -
                {" "}
                <strong>
                    {data.institute_name}
                </strong>
                ,
                has been selected for
                {" "}
                <strong>
                    {Math.max(
                        1,
                        (
                            (new Date(data.end_date).getFullYear() - new Date(data.start_date).getFullYear()) * 12
                        ) +
                        (
                            new Date(data.end_date).getMonth() - new Date(data.start_date).getMonth()
                        )
                    )}
                </strong>
                {" "}
                month/s internship in your organization from
                {" "}
                <strong>
                    {data.start_date}
                </strong>
                {" "}
                to
                {" "}
                <strong>
                    {data.end_date}
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
                and sealed, by the competent authorities on your organization&apos;s
                letterhead.
            </div>

            <br />

            <div>
                He/She has been instructed to strictly
                <strong>
                    {" "}
                    adhere to the rules,
                    regulations,
                    policies and guidelines of your organization
                    during the internship period.
                </strong>
            </div>

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
                    Training &amp; Placement Officer
                </div>
                <div className="font-bold">
                    Indus University, Ahmedabad
                </div>
            </div>
        </div>
    );
}

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
        reviewMode,
        setReviewMode,
    ] =
        useState<
            "VIEW"
            |
            "PRINT"
            |
            null
        >(null);

    const [
        editableSnapshot,
        setEditableSnapshot,
    ] =
        useState<any>(
            null
        );

    const [
        customFields,
        setCustomFields,
    ] =
        useState<any>(
            {}
        );

    const [
        referenceNumbers,
        setReferenceNumbers,
    ] =
        useState<
            Record<
                string,
                string
            >
        >({});

    const [
        searchTerm,
        setSearchTerm,
    ] =
        useState("");

    const [
        printing,
        setPrinting,
    ] =
        useState(false);

    const [
        pendingTenureVerification,
        setPendingTenureVerification,
    ] =
        useState<any[]>([]);

    const [
        completedTenure,
        setCompletedTenure,
    ] =
        useState<any[]>([]);

    const [
        tenureAudit,
        setTenureAudit,
    ]
        =
        useState<any[]>([]);

    async function load() {

        const [
            approval,
            printQueue,
            printedData,
            issuedData,
            cancelledData,
            tenureVerification,
            completedTenureData,
            auditTrailData,
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

                adminNocService
                    .getByStatus(
                        "COMPLETED_TENURE_PENDING_VERIFICATION"
                    ),

                adminNocService
                    .getByStatus(
                        "TENURE_COMPLETED"
                    ),

                adminNocService
                    .getCompletedTenureAudit(),

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

        setPendingTenureVerification(
            tenureVerification
        );

        setCompletedTenure(
            completedTenureData
        );

        setTenureAudit(
            auditTrailData
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

    const currentSnapshot =
    {
        ...editableSnapshot,
        ...customFields,
    };

    const editableKeys = [
        "hr_prefix",
        "hr_name",
        "hr_position",
        "company_name",
        "company_address_1",
        "company_address_2",
    ];

    const hasChanges =
        editableKeys.some(
            (key) =>
                String(
                    currentSnapshot?.[key] ?? ""
                ) !==
                String(
                    editableSnapshot?.[key] ?? ""
                )
        );

    const matchesSearch =
        (
            request: any
        ) => {

            if (
                !searchTerm.trim()
            )
                return true;

            const search =
                searchTerm
                    .toLowerCase();

            return [

                request.snapshot?.student_name,

                request.snapshot?.enrollment_no,

                request.snapshot?.company_name,

                request.reference_number,

            ]
                .join(" ")

                .toLowerCase()

                .includes(
                    search
                );

        };

    return (

        <div className="mx-auto max-w-7xl p-6">
            <h1 className="text-3xl font-bold">
                NOC Dashboard
            </h1>

            <div className="mt-6 grid gap-4 md:grid-cols-8 ">
                <div className="rounded-lg border p-4">
                    <div className="text-sm text-muted-foreground">
                        Total NOCs
                    </div>

                    <div className="text-2xl font-bold">
                        {
                            pendingApproval.length +
                            pendingPrint.length +
                            printed.length +
                            issued.length +
                            cancelled.length
                        }
                    </div>
                </div>

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

                <div className="rounded-lg border p-4">

                    <div className="text-sm text-muted-foreground">

                        Tenure Verification

                    </div>

                    <div className="text-2xl font-bold">

                        {
                            pendingTenureVerification.length
                        }

                    </div>

                </div>

                <div className="rounded-lg border p-4">

                    <div className="text-sm text-muted-foreground">

                        Completed Tenure

                    </div>

                    <div className="text-2xl font-bold">

                        {
                            completedTenure.length
                        }

                    </div>

                </div>

            </div>

            <div className="mb-6">

                <input

                    value={
                        searchTerm
                    }

                    onChange={(e) =>
                        setSearchTerm(
                            e.target.value
                        )
                    }

                    placeholder="
Search Name / Enrollment / Company / Ref No
"

                    className="
w-full
rounded-lg
border
p-3
"
                />

                <button

                    onClick={() =>
                        setSearchTerm("")
                    }

                    className="
        mt-2
        rounded
        border
        px-3
        py-1
    "

                >

                    Clear Search

                </button>

                <div className="mb-4 text-sm text-muted-foreground">

                    Search Result:

                    {" "}

                    <strong>

                        {
                            searchTerm
                                ?
                                searchTerm
                                :
                                "All Records"
                        }

                    </strong>

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
                                Student
                            </th>

                            <th className="p-3 text-left">
                                Enrollment
                            </th>

                            <th className="p-3 text-left">
                                Branch
                            </th>

                            <th className="p-3 text-left">
                                Company
                            </th>

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

                        {pendingApproval

                            .slice()

                            .sort(
                                (
                                    a,
                                    b
                                ) =>

                                    new Date(
                                        b.created_at
                                    ).getTime()

                                    -

                                    new Date(
                                        a.created_at
                                    ).getTime()

                            )

                            .filter(
                                matchesSearch
                            )

                            .map(
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
                                                request.snapshot?.student_name
                                            }

                                        </td>

                                        <td className="p-3">

                                            {
                                                request.snapshot?.enrollment_no
                                            }

                                        </td>

                                        <td className="p-3">

                                            {
                                                request.snapshot?.branch
                                            }

                                        </td>

                                        <td className="p-3">

                                            {
                                                request.snapshot?.company_name
                                            }

                                        </td>

                                        <td className="p-3">

                                            {
                                                request.noc_type
                                            }

                                        </td>

                                        <td className="p-3">

                                            {
                                                request.status === "PENDING_HOD_APPROVAL"
                                                    ? "Pending HOD"
                                                    : request.status
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

                                                    setReviewMode(
                                                        "VIEW"
                                                    );

                                                    setEditableSnapshot(
                                                        structuredClone(
                                                            request.snapshot
                                                        )
                                                    );

                                                    setCustomFields(
                                                        request.noc_customization
                                                        ??
                                                        {}
                                                    );
                                                }}

                                                className="rounded border px-3 py-1"

                                            >

                                                View

                                            </button>

                                            <button

                                                onClick={
                                                    async () => {

                                                        const confirmed =
                                                            window.confirm(
                                                                "Override HOD approval and move directly to Pending Print?"
                                                            );

                                                        if (!confirmed)
                                                            return;

                                                        await adminNocService
                                                            .moveToPendingPrint(
                                                                request.noc_request_id
                                                            );

                                                        await load();

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
                                Student
                            </th>

                            <th className="p-3 text-left">
                                Enrollment
                            </th>

                            <th className="p-3 text-left">
                                Branch
                            </th>

                            <th className="p-3 text-left">
                                Company
                            </th>

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

                        {pendingPrint

                            .slice()

                            .sort(
                                (
                                    a,
                                    b
                                ) =>

                                    new Date(
                                        b.created_at
                                    ).getTime()

                                    -

                                    new Date(
                                        a.created_at
                                    ).getTime()

                            )

                            .filter(
                                matchesSearch
                            )

                            .map(
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
                                                request.snapshot?.student_name
                                            }

                                        </td>

                                        <td className="p-3">

                                            {
                                                request.snapshot?.enrollment_no
                                            }

                                        </td>

                                        <td className="p-3">

                                            {
                                                request.snapshot?.branch
                                            }

                                        </td>

                                        <td className="p-3">

                                            {
                                                request.snapshot?.company_name
                                            }

                                        </td>

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

                                                    setReviewMode(
                                                        "PRINT"
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

                <div className="overflow-hidden rounded-lg border">

                    <table className="w-full">

                        <thead>

                            <tr className="border-b">

                                <th className="p-3 text-left">
                                    Student
                                </th>

                                <th className="p-3 text-left">
                                    Enrollment
                                </th>

                                <th className="p-3 text-left">
                                    Branch
                                </th>

                                <th className="p-3 text-left">
                                    Company
                                </th>

                                <th className="p-3 text-left">
                                    Type
                                </th>

                                <th className="p-3 text-left">
                                    Ref No
                                </th>

                                <th className="p-3 text-left">
                                    Printed At
                                </th>

                                <th className="p-3 text-left">
                                    Prints
                                </th>

                                <th className="p-3 text-left">
                                    Actions
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            {printed

                                .slice()

                                .sort(
                                    (
                                        a,
                                        b
                                    ) =>

                                        new Date(
                                            b.created_at
                                        ).getTime()

                                        -

                                        new Date(
                                            a.created_at
                                        ).getTime()

                                )

                                .filter(
                                    matchesSearch
                                )

                                .map(
                                    (
                                        request: any
                                    ) => (

                                        <tr
                                            key={
                                                request.noc_request_id
                                            }
                                        >

                                            <td className="p-3">

                                                {
                                                    request.snapshot?.student_name
                                                }

                                            </td>

                                            <td className="p-3">

                                                {
                                                    request.snapshot?.enrollment_no
                                                }

                                            </td>

                                            <td className="p-3">

                                                {
                                                    request.snapshot?.branch
                                                }

                                            </td>

                                            <td className="p-3">

                                                {
                                                    request.snapshot?.company_name
                                                }

                                            </td>

                                            <td className="p-3">

                                                {
                                                    request.noc_type
                                                }

                                            </td>

                                            <td className="p-3">

                                                <input

                                                    type="number"

                                                    min="1"

                                                    value={
                                                        referenceNumbers[
                                                        request.noc_request_id
                                                        ]
                                                        ??
                                                        request.reference_number
                                                        ??
                                                        ""
                                                    }

                                                    onChange={(e) => {

                                                        const value =
                                                            e.target.value
                                                                .replace(
                                                                    /\D/g,
                                                                    ""
                                                                );

                                                        setReferenceNumbers(
                                                            (prev) => ({

                                                                ...prev,

                                                                [
                                                                    request.noc_request_id
                                                                ]:
                                                                    value,

                                                            })
                                                        );

                                                    }}

                                                    className="rounded border p-2"

                                                />

                                            </td>

                                            <td className="p-3">

                                                {
                                                    request.printed_at
                                                        ?
                                                        new Date(
                                                            request.printed_at
                                                        ).toLocaleString()
                                                        :
                                                        "-"
                                                }

                                            </td>

                                            <td className="p-3">

                                                {
                                                    request.print_count
                                                    ??
                                                    0
                                                }

                                            </td>

                                            <td className="p-3 flex gap-2">

                                                <button

                                                    onClick={() => {

                                                        setSelectedRequest(
                                                            request
                                                        );

                                                        setReviewMode(
                                                            "VIEW"
                                                        );

                                                        setEditableSnapshot(
                                                            structuredClone(
                                                                request.snapshot
                                                            )
                                                        );

                                                        setCustomFields(
                                                            request.noc_customization
                                                            ??
                                                            {}
                                                        );

                                                    }}

                                                    className="rounded border px-3 py-1"

                                                >

                                                    View

                                                </button>

                                                <button
                                                    onClick={async () => {

                                                        setSelectedRequest(request);

                                                        setReviewMode("PRINT");

                                                        setEditableSnapshot(
                                                            structuredClone(
                                                                request.snapshot
                                                            )
                                                        );

                                                        setCustomFields(
                                                            request.noc_customization
                                                            ??
                                                            {}
                                                        );

                                                        setSelectedRequest(
                                                            request
                                                        );

                                                        setReviewMode(
                                                            "PRINT"
                                                        );

                                                        setEditableSnapshot(
                                                            structuredClone(
                                                                request.snapshot
                                                            )
                                                        );

                                                        setCustomFields(
                                                            request.noc_customization
                                                            ??
                                                            {}
                                                        );

                                                    }}

                                                    className="rounded border px-3 py-1"

                                                >

                                                    Reprint

                                                </button>

                                                <button
                                                    onClick={
                                                        async () => {

                                                            const refNumber =
                                                                referenceNumbers[
                                                                    request.noc_request_id
                                                                ]?.trim();

                                                            if (!refNumber) {

                                                                alert(
                                                                    "Enter Reference Number"
                                                                );

                                                                return;
                                                            }

                                                            await adminNocService
                                                                .saveReferenceNumber(

                                                                    request.noc_request_id,

                                                                    refNumber

                                                                );

                                                            await load();

                                                            alert(
                                                                "Reference Number Saved"
                                                            );

                                                        }
                                                    }

                                                    className="rounded border px-3 py-1"

                                                >

                                                    Save Ref

                                                </button>

                                                <button

                                                    onClick={
                                                        async () => {

                                                            const refNumber =
                                                                (
                                                                    referenceNumbers[
                                                                    request.noc_request_id
                                                                    ]
                                                                    ??
                                                                    request.reference_number
                                                                    ??
                                                                    ""
                                                                ).trim();

                                                            if (!refNumber) {

                                                                alert(
                                                                    "Save Reference Number First"
                                                                );

                                                                return;
                                                            }

                                                            if (
                                                                refNumber !==
                                                                request.reference_number
                                                            ) {

                                                                await adminNocService
                                                                    .saveReferenceNumber(
                                                                        request.noc_request_id,
                                                                        refNumber
                                                                    );

                                                            }

                                                            await adminNocService
                                                                .issueRequest(
                                                                    request.noc_request_id
                                                                );

                                                            await load();

                                                        }
                                                    }
                                                    className="rounded border px-3 py-1"
                                                >

                                                    Issue

                                                </button>

                                                <button

                                                    onClick={
                                                        async () => {

                                                            const refNumber =
                                                                (
                                                                    referenceNumbers[
                                                                    request.noc_request_id
                                                                    ]
                                                                    ??
                                                                    request.reference_number
                                                                    ??
                                                                    ""
                                                                )
                                                                    .trim();

                                                            if (!refNumber) {

                                                                alert(
                                                                    "Save Reference Number First"
                                                                );

                                                                return;

                                                            }

                                                            if (
                                                                refNumber !==
                                                                request.reference_number
                                                            ) {

                                                                await adminNocService
                                                                    .saveReferenceNumber(
                                                                        request.noc_request_id,
                                                                        refNumber
                                                                    );

                                                            }

                                                            await adminNocService
                                                                .cancelRequest(
                                                                    request.noc_request_id
                                                                );

                                                            await load();
                                                        }
                                                    }

                                                    className="rounded border px-3 py-1"

                                                >

                                                    Cancel

                                                </button>

                                            </td>

                                        </tr>

                                    )
                                )}

                        </tbody>

                    </table>

                </div>

            </div>

            <h2 className="mt-10 mb-4 text-xl font-semibold">

                Tenure Verification Pending

            </h2>

            <div className="overflow-hidden rounded-lg border">

                <table className="w-full">

                    <thead>

                        <tr className="border-b">

                            <th className="p-3 text-left">
                                Student
                            </th>

                            <th className="p-3 text-left">
                                Enrollment
                            </th>

                            <th className="p-3 text-left">
                                Company
                            </th>

                            <th className="p-3 text-left">
                                End Date
                            </th>

                            <th className="p-3 text-left">
                                HR Email
                            </th>

                            <th className="p-3 text-left">
                                HR Contact
                            </th>

                            <th className="p-3 text-left">
                                Certificate
                            </th>

                            <th className="p-3 text-left">
                                Same HR
                            </th>

                            <th className="p-3 text-left">
                                New HR Name
                            </th>

                            <th className="p-3 text-left">
                                New Designation
                            </th>

                            <th className="p-3 text-left">
                                Actions
                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        {pendingTenureVerification

                            .slice()

                            .sort(
                                (
                                    a,
                                    b
                                ) =>

                                    new Date(
                                        b.created_at
                                    ).getTime()

                                    -

                                    new Date(
                                        a.created_at
                                    ).getTime()

                            )

                            .filter(
                                matchesSearch
                            )

                            .map(
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
                                                request.snapshot?.student_name
                                            }
                                        </td>

                                        <td className="p-3">
                                            {
                                                request.snapshot?.enrollment_no
                                            }
                                        </td>

                                        <td className="p-3">
                                            {
                                                request.snapshot?.company_name
                                            }
                                        </td>

                                        <td className="p-3">
                                            {
                                                request.snapshot?.end_date
                                            }
                                        </td>

                                        <td className="p-3">
                                            {
                                                request.completion_hr_email
                                            }
                                        </td>

                                        <td className="p-3">
                                            {
                                                request.completion_hr_contact
                                            }
                                        </td>

                                        <td className="p-3">

                                            {
                                                request.completion_certificate_url
                                                    ? (
                                                        <a
                                                            href={
                                                                request.completion_certificate_url
                                                            }
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="text-blue-600 underline"
                                                        >
                                                            View
                                                        </a>
                                                    )
                                                    : "-"
                                            }

                                        </td>

                                        <td className="p-3">

                                            {
                                                request.same_hr
                                                    ? "Yes"
                                                    : "No"
                                            }

                                        </td>

                                        <td className="p-3">

                                            {
                                                request.new_hr_name
                                                ??
                                                "-"
                                            }

                                        </td>

                                        <td className="p-3">

                                            {
                                                request.new_hr_designation
                                                ??
                                                "-"
                                            }

                                        </td>

                                        <td className="p-3 flex gap-2">

                                            <button

                                                onClick={() => {

                                                    setSelectedRequest(
                                                        request
                                                    );

                                                    setReviewMode(
                                                        "VIEW"
                                                    );

                                                    setEditableSnapshot(
                                                        structuredClone(
                                                            request.snapshot
                                                        )
                                                    );

                                                    setCustomFields(
                                                        request.noc_customization
                                                        ??
                                                        {}
                                                    );

                                                }}

                                                className="rounded border px-3 py-1"

                                            >

                                                View

                                            </button>

                                            <button

                                                onClick={async () => {

                                                    await adminNocService
                                                        .approveTenureCompletion(
                                                            request.noc_request_id
                                                        );

                                                    await load();

                                                }}

                                                className="rounded border px-3 py-1"

                                            >

                                                Approve

                                            </button>

                                            <button

                                                onClick={async () => {

                                                    await adminNocService
                                                        .rejectTenureCompletion(
                                                            request.noc_request_id
                                                        );

                                                    await load();

                                                }}

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

                Issued

            </h2>

            <div className="rounded-lg border p-6 text-sm text-muted-foreground">

                <div className="overflow-hidden rounded-lg border">

                    <table className="w-full">

                        <thead>

                            <tr>

                                <th className="p-3 text-left">
                                    Student
                                </th>

                                <th className="p-3 text-left">
                                    Enrollment
                                </th>

                                <th className="p-3 text-left">
                                    Company
                                </th>

                                <th className="p-3 text-left">
                                    Duration
                                </th>

                                <th className="p-3 text-left">
                                    Type
                                </th>

                                <th className="p-3 text-left">
                                    Ref No
                                </th>

                                <th className="p-3 text-left">
                                    Issued At
                                </th>

                                <th className="p-3 text-left">
                                    Actions
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            {issued

                                .slice()

                                .sort(
                                    (
                                        a,
                                        b
                                    ) =>

                                        new Date(
                                            b.created_at
                                        ).getTime()

                                        -

                                        new Date(
                                            a.created_at
                                        ).getTime()

                                )

                                .filter(
                                    matchesSearch
                                )

                                .map(
                                    (
                                        request: any
                                    ) => (

                                        <tr
                                            key={
                                                request.noc_request_id
                                            }
                                        >

                                            <td className="p-3">

                                                {
                                                    request.snapshot?.student_name
                                                }

                                            </td>

                                            <td className="p-3">

                                                {
                                                    request.snapshot?.enrollment_no
                                                }

                                            </td>

                                            <td className="p-3">

                                                {
                                                    request.snapshot?.company_name
                                                }

                                            </td>

                                            <td className="p-3">

                                                {
                                                    getDurationMonths(
                                                        request.snapshot?.start_date,
                                                        request.snapshot?.end_date
                                                    )
                                                }

                                                Month(s)

                                            </td>

                                            <td className="p-3">

                                                {
                                                    request.noc_type
                                                }

                                            </td>

                                            <td className="p-3">

                                                {
                                                    request.reference_number
                                                }

                                            </td>

                                            <td className="p-3">

                                                {
                                                    request.issued_at
                                                        ?
                                                        new Date(
                                                            request.issued_at
                                                        ).toLocaleString()
                                                        :
                                                        "-"
                                                }

                                            </td>

                                            <td className="p-3">

                                                <button

                                                    onClick={() => {

                                                        setSelectedRequest(
                                                            request
                                                        );

                                                        setReviewMode(
                                                            "VIEW"
                                                        );

                                                        setEditableSnapshot(
                                                            structuredClone(
                                                                request.snapshot
                                                            )
                                                        );

                                                        setCustomFields(
                                                            request.noc_customization
                                                            ??
                                                            {}
                                                        );

                                                    }}

                                                    className="rounded border px-3 py-1"

                                                >

                                                    View

                                                </button>

                                            </td>
                                        </tr>
                                    )
                                )}

                        </tbody>

                    </table>

                </div>

            </div>


            <h2 className="mt-10 mb-4 text-xl font-semibold">

                Completed Tenure

            </h2>

            <div className="overflow-hidden rounded-lg border">

                <table className="w-full">

                    <thead>

                        <tr className="border-b">

                            <th className="p-3 text-left">
                                Student
                            </th>

                            <th className="p-3 text-left">
                                Enrollment
                            </th>

                            <th className="p-3 text-left">
                                Company
                            </th>

                            <th className="p-3 text-left">
                                Verified At
                            </th>

                            <th className="p-3 text-left">
                                Certificate
                            </th>

                            <th className="p-3 text-left">
                                HR Email
                            </th>

                            <th className="p-3 text-left">
                                Actions
                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        {
                            completedTenure

                                .slice()

                                .sort(
                                    (
                                        a,
                                        b
                                    ) =>

                                        new Date(
                                            b.completion_verified_at
                                        ).getTime()

                                        -

                                        new Date(
                                            a.completion_verified_at
                                        ).getTime()

                                )

                                .filter(
                                    matchesSearch
                                )

                                .map(
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
                                                    request.snapshot?.student_name
                                                }
                                            </td>

                                            <td className="p-3">
                                                {
                                                    request.snapshot?.enrollment_no
                                                }
                                            </td>

                                            <td className="p-3">
                                                {
                                                    request.snapshot?.company_name
                                                }
                                            </td>

                                            <td className="p-3">
                                                {
                                                    request.completion_verified_at
                                                        ?
                                                        new Date(
                                                            request.completion_verified_at
                                                        ).toLocaleString()
                                                        :
                                                        "-"
                                                }
                                            </td>

                                            <td className="p-3">

                                                {
                                                    request.completion_certificate_url
                                                        ? (
                                                            <a
                                                                href={
                                                                    request.completion_certificate_url
                                                                }
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="text-blue-600 underline"
                                                            >
                                                                View
                                                            </a>
                                                        )
                                                        : "-"
                                                }

                                            </td>

                                            <td className="p-3">

                                                {
                                                    request.completion_hr_email
                                                    ??
                                                    "-"
                                                }

                                            </td>

                                            <td className="p-3">

                                                <button

                                                    onClick={() => {

                                                        setSelectedRequest(
                                                            request
                                                        );

                                                        setReviewMode(
                                                            "VIEW"
                                                        );

                                                        setEditableSnapshot(
                                                            structuredClone(
                                                                request.snapshot
                                                            )
                                                        );

                                                        setCustomFields(
                                                            request.noc_customization
                                                            ??
                                                            {}
                                                        );

                                                    }}

                                                    className="rounded border px-3 py-1"

                                                >

                                                    View

                                                </button>

                                            </td>

                                        </tr>

                                    )
                                )

                        }

                    </tbody>

                </table>

            </div>

            <h2 className="mt-10 mb-4 text-xl font-semibold">

                Tenure Audit Trail

            </h2>

            <div className="overflow-hidden rounded-lg border">

                <table className="w-full">

                    <thead>

                        <tr className="border-b">

                            <th className="p-3 text-left">
                                Student
                            </th>

                            <th className="p-3 text-left">
                                Enrollment
                            </th>

                            <th className="p-3 text-left">
                                Company
                            </th>

                            <th className="p-3 text-left">
                                End Date
                            </th>

                            <th className="p-3 text-left">
                                Verified At
                            </th>

                            <th className="p-3 text-left">
                                Certificate
                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        {
                            tenureAudit.map(
                                (request: any) => (

                                    <tr
                                        key={
                                            request.noc_request_id
                                        }
                                        className="border-b"
                                    >

                                        <td className="p-3">
                                            {
                                                request.snapshot?.student_name
                                            }
                                        </td>

                                        <td className="p-3">
                                            {
                                                request.snapshot?.enrollment_no
                                            }
                                        </td>

                                        <td className="p-3">
                                            {
                                                request.snapshot?.company_name
                                            }
                                        </td>

                                        <td className="p-3">
                                            {
                                                request.snapshot?.end_date
                                            }
                                        </td>

                                        <td className="p-3">
                                            {
                                                request.completion_verified_at
                                                    ?
                                                    new Date(
                                                        request.completion_verified_at
                                                    ).toLocaleString()
                                                    :
                                                    "-"
                                            }
                                        </td>

                                        <td className="p-3">

                                            {
                                                request.completion_certificate_url
                                                    ?

                                                    <a
                                                        href={
                                                            request.completion_certificate_url
                                                        }
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-blue-600 underline"
                                                    >

                                                        Download

                                                    </a>

                                                    :

                                                    "-"
                                            }

                                        </td>

                                    </tr>

                                )
                            )
                        }

                    </tbody>

                </table>

            </div>

            <h2 className="mt-10 mb-4 text-xl font-semibold">

                Cancelled

            </h2>

            <div className="rounded-lg border p-6 text-sm text-muted-foreground">

                <div className="overflow-hidden rounded-lg border">

                    <table className="w-full">

                        <thead>

                            <tr>

                                <th className="p-3 text-left">
                                    Student
                                </th>

                                <th className="p-3 text-left">
                                    Enrollment
                                </th>

                                <th className="p-3 text-left">
                                    Company
                                </th>

                                <th className="p-3 text-left">
                                    Duration
                                </th>

                                <th className="p-3 text-left">
                                    Type
                                </th>

                                <th className="p-3 text-left">
                                    Ref No
                                </th>

                                <th className="p-3 text-left">
                                    Cancelled At
                                </th>

                                <th className="p-3 text-left">
                                    Actions
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            {cancelled

                                .slice()

                                .sort(
                                    (
                                        a,
                                        b
                                    ) =>

                                        new Date(
                                            b.created_at
                                        ).getTime()

                                        -

                                        new Date(
                                            a.created_at
                                        ).getTime()

                                )

                                .filter(
                                    matchesSearch
                                )

                                .map(
                                    (
                                        request: any
                                    ) => (

                                        <tr
                                            key={
                                                request.noc_request_id
                                            }
                                        >

                                            <td className="p-3">

                                                {
                                                    request.snapshot?.student_name
                                                }

                                            </td>

                                            <td className="p-3">

                                                {
                                                    request.snapshot?.enrollment_no
                                                }

                                            </td>

                                            <td className="p-3">

                                                {
                                                    request.snapshot?.company_name
                                                }

                                            </td>

                                            <td className="p-3">

                                                {
                                                    getDurationMonths(
                                                        request.snapshot?.start_date,
                                                        request.snapshot?.end_date
                                                    )
                                                }

                                                Month(s)

                                            </td>

                                            <td className="p-3">

                                                {
                                                    request.noc_type
                                                }

                                            </td>

                                            <td className="p-3">

                                                {
                                                    request.reference_number
                                                }

                                            </td>

                                            <td className="p-3">

                                                {
                                                    request.cancelled_at
                                                        ?
                                                        new Date(
                                                            request.cancelled_at
                                                        ).toLocaleString()
                                                        :
                                                        "-"
                                                }

                                            </td>

                                            <td className="p-3">

                                                <button

                                                    onClick={() => {

                                                        setSelectedRequest(
                                                            request
                                                        );

                                                        setReviewMode(
                                                            "VIEW"
                                                        );

                                                        setEditableSnapshot(
                                                            structuredClone(
                                                                request.snapshot
                                                            )
                                                        );

                                                        setCustomFields(
                                                            request.noc_customization
                                                            ??
                                                            {}
                                                        );

                                                    }}

                                                    className="rounded border px-3 py-1"

                                                >

                                                    View

                                                </button>

                                            </td>
                                        </tr>

                                    )
                                )}

                        </tbody>

                    </table>

                </div>

            </div>

            {selectedRequest && (
                <>
                    <style>{`
                        @media print {
                            body * { visibility: hidden !important; }
                            .print-area, .print-area * { visibility: visible !important; }
                            .print-area {
                                display: block !important;
                                position: absolute;
                                left: 0;
                                top: 0;
                                width: 100%;
                            }
                            .no-print { display: none !important; }
                        }
                    `}</style>

                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 no-print">
                        <div className="max-h-[90vh] w-full max-w-5xl overflow-auto rounded-lg bg-white p-6">
                            <h2 className="mb-4 text-2xl font-semibold no-print">
                                NOC Review
                            </h2>

                            <div className="no-print">
                                <NocLetterBlock
                                    snapshot={editableSnapshot}
                                    approvedAt={selectedRequest?.approved_at}
                                    editable={
                                        reviewMode === "PRINT"
                                    }
                                    customFields={customFields}
                                    setCustomFields={setCustomFields}
                                />
                            </div>

                            {
                                selectedRequest?.completion_submitted_at && (

                                    <div className="mb-4 rounded border p-4">

                                        <div>

                                            <strong>
                                                Completion HR Email:
                                            </strong>

                                            {" "}

                                            {
                                                selectedRequest.completion_hr_email
                                                ??
                                                "-"
                                            }

                                        </div>

                                        <div>

                                            <strong>
                                                Completion HR Contact:
                                            </strong>

                                            {" "}

                                            {
                                                selectedRequest.completion_hr_contact
                                                ??
                                                "-"
                                            }

                                        </div>

                                        <div>

                                            <strong>

                                                Completion Certificate:

                                            </strong>

                                            {" "}

                                            {
                                                selectedRequest
                                                    ?.completion_certificate_url
                                                    ?

                                                    <a

                                                        href={
                                                            selectedRequest
                                                                .completion_certificate_url
                                                        }

                                                        target="_blank"

                                                        rel="noreferrer"

                                                        className="
text-blue-600
underline
"

                                                    >

                                                        Download Certificate

                                                    </a>

                                                    :

                                                    "-"
                                            }

                                        </div>
                                    </div>

                                )
                            }

                            <div className="mt-6 flex items-center gap-3 whitespace-nowrap no-print">
                                <button
                                    disabled={!hasChanges}
                                    onClick={async () => {
                                        const diff: Record<string, any> = {};

                                        editableKeys.forEach((key) => {
                                            const currentValue = currentSnapshot?.[key] ?? "";
                                            const baseValue = editableSnapshot?.[key] ?? "";

                                            if (String(currentValue) !== String(baseValue)) {
                                                diff[key] = currentValue;
                                            }
                                        });

                                        if (Object.keys(diff).length > 0) {
                                            await adminNocService.saveCustomization(
                                                selectedRequest.noc_request_id,
                                                diff
                                            );
                                        }

                                        await load();
                                        alert("Changes Saved");
                                    }}
                                    className="rounded border px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Save Changes
                                </button>
                                {
                                    reviewMode === "PRINT" && (
                                        <button
                                            disabled={printing}
                                            onClick={async () => {

                                                if (printing)
                                                    return;

                                                setPrinting(true);

                                                const diff: Record<string, any> = {};

                                                editableKeys.forEach((key) => {
                                                    const currentValue = currentSnapshot?.[key] ?? "";
                                                    const baseValue = editableSnapshot?.[key] ?? "";

                                                    if (String(currentValue) !== String(baseValue)) {
                                                        diff[key] = currentValue;
                                                    }
                                                });

                                                if (Object.keys(diff).length > 0) {
                                                    await adminNocService.saveCustomization(
                                                        selectedRequest.noc_request_id,
                                                        diff
                                                    );
                                                }

                                                try {

                                                    await adminNocService.markPrinted(
                                                        selectedRequest.noc_request_id
                                                    );
                                                    if (
                                                        selectedRequest.status ===
                                                        "PRINTED"
                                                    ) {

                                                        await adminNocService
                                                            .incrementPrintCount(
                                                                selectedRequest.noc_request_id
                                                            );

                                                    }

                                                    window.print();

                                                    await load();

                                                    setSelectedRequest(null);

                                                }
                                                finally {

                                                    setPrinting(false);

                                                }
                                            }}
                                            className="rounded border px-4 py-2"
                                        >
                                            Print &amp; Move To Printed
                                        </button>
                                    )
                                }

                                <button
                                    onClick={() => {
                                        setSelectedRequest(null);
                                    }}
                                    className="rounded border px-4 py-2"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>

                    {
                        reviewMode ===
                        "PRINT" && (

                            <div className="print-area">
                                <NocLetterBlock
                                    snapshot={editableSnapshot}
                                    approvedAt={selectedRequest?.approved_at}
                                    editable={false}
                                    customFields={customFields}
                                />
                            </div>
                        )}
                </>
            )
            }

        </div >

    );

}