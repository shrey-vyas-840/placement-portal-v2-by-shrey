import {
    useEffect,
    useState,
} from "react";

import {
    nocService,
    NOC_TYPES,
} from "@/services/nocService";

import { supabase } from "@/lib/supabase";

export function StudentNocPage() {

    const [
        profile,
        setProfile,
    ] = useState<any>(null);

    const [
        requests,
        setRequests,
    ] = useState<any[]>([]);

    const [
        completionRequest,
        setCompletionRequest,
    ] =
        useState<any>(
            null
        );

    const [
        selectedRequest,
        setSelectedRequest,
    ] = useState<any>(
        null
    );

    const [
        activeNoc,
        setActiveNoc,
    ] = useState<any>(
        null
    );

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        submitting,
        setSubmitting,
    ] = useState(false);

    const [
        reviewMode,
        setReviewMode,
    ] = useState(false);

    const [
        form,
        setForm,
    ] = useState({

        noc_type:
            "Internship",

        start_date:
            "",

        end_date:
            "",

        company_name:
            "",

        company_address_1:
            "",

        company_address_2:
            "",

        hr_prefix:
            "Mr.",

        hr_name:
            "",

        hr_position:
            "",

    });

    const [
        completionForm,
        setCompletionForm,
    ] =
        useState<{

            certificate:
            File | null;

            hr_email:
            string;

            hr_contact:
            string;

            same_hr:
            boolean;

            hr_name:
            string;

            hr_designation:
            string;

        }>({

            certificate:
                null,

            hr_email:
                "",

            hr_contact:
                "",

            same_hr:
                true,

            hr_name:
                "",

            hr_designation:
                "",

        });
    useEffect(() => {

        document.title =
            "NOC Request";

        loadProfile();

    }, []);

    async function loadProfile() {

        try {

            const {
                data: authData,
            } =
                await supabase.auth.getUser();

            const authUserId =
                authData.user?.id;

            if (!authUserId) {
                return;
            }

            const {
                data: account,
            } =
                await (supabase as any)

                    .from(
                        "user_accounts"
                    )

                    .select(
                        "user_id"
                    )

                    .eq(
                        "auth_provider_id",
                        authUserId
                    )

                    .maybeSingle();

            if (!account) {
                return;
            }

            const {
                data: student,
            } =
                await (supabase as any)

                    .from(
                        "student_master"
                    )

                    .select(
                        "student_id"
                    )

                    .eq(
                        "user_id",
                        account.user_id
                    )

                    .maybeSingle();

            if (!student) {
                return;
            }

            const data =
                await nocService
                    .getStudentProfileSnapshot(
                        student.student_id
                    );

            setProfile(
                data
            );

            const nocRequests =
                await nocService
                    .getStudentRequests(
                        student.student_id
                    );

            setRequests(

                nocRequests.filter(
                    (request: any) =>
                        request.status !==
                        "TENURE_COMPLETED"
                )

            );

            const pendingVerification =
                nocRequests.find(
                    (
                        request: any
                    ) =>
                        request.status ===
                        "COMPLETED_TENURE_PENDING_VERIFICATION"
                );

            setCompletionRequest(

                pendingVerification &&
                    !pendingVerification
                        .completion_submitted_at
                    ?
                    pendingVerification
                    :
                    null

            );

            const active =
                await nocService
                    .hasActiveNoc(
                        student.student_id
                    );

            setActiveNoc(
                active
            );

        } finally {

            setLoading(
                false
            );

        }

    }

    async function submitRequest() {

        if (

            new Date(
                form.end_date
            )

            <=

            new Date(
                form.start_date
            )

        ) {

            alert(
                "End Date must be after Start Date"
            );

            return;

        }

        try {

            setSubmitting(
                true
            );

            const {
                data: authData,
            } =
                await supabase.auth.getUser();

            const authUserId =
                authData.user?.id;

            if (!authUserId) {
                throw new Error(
                    "User not found"
                );
            }

            const {
                data: account,
            } =
                await (supabase as any)

                    .from(
                        "user_accounts"
                    )

                    .select(
                        "user_id"
                    )

                    .eq(
                        "auth_provider_id",
                        authUserId
                    )

                    .maybeSingle();

            if (!account) {
                throw new Error(
                    "Account not found"
                );
            }

            const {
                data: student,
            } =
                await (supabase as any)

                    .from(
                        "student_master"
                    )

                    .select(
                        "student_id"
                    )

                    .eq(
                        "user_id",
                        account.user_id
                    )

                    .maybeSingle();

            if (!student) {
                throw new Error(
                    "Student profile not found"
                );
            }

            const activeNoc =
                await nocService
                    .hasActiveNoc(
                        student.student_id
                    );

            if (
                activeNoc
            ) {

                alert(

                    `You already have an active NOC until ${activeNoc.snapshot?.end_date}`

                );

                return;

            }

            await nocService.createRequest(
                student.student_id,
                form
            );

            alert(
                "NOC Request Submitted Successfully"
            );

            await loadProfile();

            setReviewMode(
                false
            );

        } catch (
        error: any
        ) {

            alert(
                error.message
            );

        } finally {

            setSubmitting(
                false
            );

        }

    }

    if (loading) {

        return (
            <div className="p-6">
                Loading...
            </div>
        );

    }

    async function submitCompletion() {

        if (
            !completionRequest
        )
            return;

        if (
            !completionForm.certificate
        ) {

            alert(
                "Upload Completion Certificate"
            );

            return;

        }

        const certificatePath =
            await nocService
                .uploadCompletionCertificate(
                    completionForm.certificate
                );

        await nocService
            .submitCompletionDetails(

                completionRequest
                    .noc_request_id,

                {

                    completion_certificate_url:
                        certificatePath,

                    completion_hr_email:
                        completionForm.hr_email,

                    completion_hr_contact:
                        completionForm.hr_contact,

                    completion_same_hr:
                        completionForm.same_hr,

                    completion_hr_name:
                        completionForm.hr_name,

                    completion_hr_designation:
                        completionForm.hr_designation,

                }

            );

        alert(
            "Completion Details Submitted"
        );

        await loadProfile();

    }

    <button

        onClick={
            submitCompletion
        }

        className="
rounded
border
px-4
py-2
"

    >

        Submit Completion Details

    </button>

    return (

        <div className="mx-auto max-w-7xl p-6">

            <div className="mb-6">

                <h1 className="text-3xl font-bold">

                    NOC Request

                </h1>

                <p className="mt-2 text-sm text-muted-foreground">

                    Step 1: Fill Form
                    → Step 2: Review & Confirm
                    → Step 3: Wait For HOD Approval
                    → Step 4: NOC Issued
                    → Step 5: Collect From T&P Cell

                </p>

            </div>

            {
                (
                    activeNoc
                    ||
                    completionRequest
                )
                && (

                    <div
                        className="
mb-6
rounded-lg
border
border-yellow-300
bg-yellow-50
p-4
"
                    >

                        <strong>

                            Active NOC Exists

                        </strong>

                        <br />

                        You already have an active NOC until

                        {" "}

                        <strong>

                            {
                                activeNoc.snapshot?.end_date
                            }

                        </strong>

                        .

                        New NOC requests are restricted until completion.

                    </div>

                )
            }

            {
                completionRequest && (

                    <div
                        className="
mb-6
rounded-lg
border
border-red-300
bg-red-50
p-4
"
                    >

                        <strong>

                            Previous NOC Completion Required

                        </strong>

                        <br />

                        Submit internship/job completion details
                        before applying for a new NOC.

                    </div>

                )
            }

            {!reviewMode && (

                <div className="rounded-lg border p-6 space-y-4">

                    <div>

                        <label>
                            NOC Type
                        </label>

                        <select
                            className="w-full border rounded p-2"
                            value={
                                form.noc_type
                            }
                            onChange={(
                                e
                            ) =>
                                setForm(
                                    {
                                        ...form,
                                        noc_type:
                                            e
                                                .target
                                                .value,
                                    }
                                )
                            }
                        >

                            {NOC_TYPES.map(
                                (
                                    item
                                ) => (

                                    <option
                                        key={
                                            item
                                        }
                                    >

                                        {
                                            item
                                        }

                                    </option>

                                )
                            )}

                        </select>

                    </div>
                    {
                        selectedRequest && (


                            <div className="mb-6">

                                <div className="flex flex-wrap gap-2">

                                    <span
                                        className="
px-3
py-1
rounded
bg-green-100
text-green-800
"
                                    >
                                        ✓ Submitted
                                    </span>

                                    <span
                                        className={`
px-3
py-1
rounded
${[
                                                "PENDING_PRINT",
                                                "PRINTED",
                                                "ISSUED",
                                            ].includes(selectedRequest.status) ||
                                                selectedRequest.approval_source === "HOD_APPROVED"
                                                ? "bg-green-100 text-green-800"
                                                : "bg-gray-100 text-gray-600"
                                            }
`}
                                    >
                                        ✓ HOD Approved
                                    </span>

                                    <span
                                        className={`
px-3
py-1
rounded
${[
                                                "PRINTED",
                                                "ISSUED",
                                            ].includes(
                                                selectedRequest.status
                                            )
                                                ? "bg-green-100 text-green-800"
                                                : "bg-gray-100 text-gray-600"
                                            }
`}
                                    >
                                        ✓ Ready For Print
                                    </span>

                                    <span
                                        className={`
px-3
py-1
rounded
${[
                                                "ISSUED",
                                            ].includes(
                                                selectedRequest.status
                                            )
                                                ? "bg-green-100 text-green-800"
                                                : "bg-gray-100 text-gray-600"
                                            }
`}
                                    >
                                        ✓ Issued
                                    </span>

                                </div>

                            </div>

                        )}

                    <div className="grid grid-cols-2 gap-4">

                        <div>

                            <label>
                                Start Date
                            </label>

                            <input
                                type="date"
                                className="w-full border rounded p-2"
                                value={
                                    form.start_date
                                }
                                onChange={(
                                    e
                                ) =>
                                    setForm(
                                        {
                                            ...form,
                                            start_date:
                                                e
                                                    .target
                                                    .value,
                                        }
                                    )
                                }
                            />

                        </div>

                        <div>

                            <label>
                                End Date
                            </label>

                            <input
                                type="date"
                                className="w-full border rounded p-2"
                                value={
                                    form.end_date
                                }
                                onChange={(
                                    e
                                ) =>
                                    setForm(
                                        {
                                            ...form,
                                            end_date:
                                                e
                                                    .target
                                                    .value,
                                        }
                                    )
                                }
                            />

                        </div>

                    </div>{
                        form.start_date
                        &&
                        form.end_date
                        && (

                            <div className="rounded border p-3 bg-muted">

                                Duration:

                                {" "}

                                <strong>

                                    {

                                        Math.max(
                                            1,
                                            (
                                                (
                                                    new Date(
                                                        form.end_date
                                                    ).getFullYear()
                                                    -
                                                    new Date(
                                                        form.start_date
                                                    ).getFullYear()
                                                ) * 12
                                            )
                                            +
                                            (
                                                new Date(
                                                    form.end_date
                                                ).getMonth()
                                                -
                                                new Date(
                                                    form.start_date
                                                ).getMonth()
                                            )
                                        )

                                    }

                                </strong>

                                {" "}Month(s)

                            </div>

                        )
                    }

                    <div>

                        <label>
                            Company Name
                        </label>

                        <input
                            className="w-full border rounded p-2"
                            value={
                                form.company_name
                            }
                            onChange={(
                                e
                            ) =>
                                setForm(
                                    {
                                        ...form,
                                        company_name:
                                            e
                                                .target
                                                .value,
                                    }
                                )
                            }
                        />

                    </div>

                    <div>

                        <label>
                            Company Address 1
                        </label>

                        <input
                            className="w-full border rounded p-2"
                            value={
                                form.company_address_1
                            }
                            onChange={(
                                e
                            ) =>
                                setForm(
                                    {
                                        ...form,
                                        company_address_1:
                                            e
                                                .target
                                                .value,
                                    }
                                )
                            }
                        />

                    </div>

                    <div>

                        <label>
                            Company Address 2
                        </label>

                        <input
                            className="w-full border rounded p-2"
                            value={
                                form.company_address_2
                            }
                            onChange={(
                                e
                            ) =>
                                setForm(
                                    {
                                        ...form,
                                        company_address_2:
                                            e
                                                .target
                                                .value,
                                    }
                                )
                            }
                        />

                    </div>

                    <div className="grid grid-cols-3 gap-4">

                        <select
                            className="border rounded p-2"
                            value={
                                form.hr_prefix
                            }
                            onChange={(
                                e
                            ) =>
                                setForm(
                                    {
                                        ...form,
                                        hr_prefix:
                                            e
                                                .target
                                                .value,
                                    }
                                )
                            }
                        >

                            <option>
                                Mr.
                            </option>

                            <option>
                                Ms.
                            </option>

                        </select>

                        <input
                            placeholder="HR Name"
                            className="border rounded p-2"
                            value={
                                form.hr_name
                            }
                            onChange={(
                                e
                            ) =>
                                setForm(
                                    {
                                        ...form,
                                        hr_name:
                                            e
                                                .target
                                                .value,
                                    }
                                )
                            }
                        />

                        <input
                            placeholder="HR Position"
                            className="border rounded p-2"
                            value={
                                form.hr_position
                            }
                            onChange={(
                                e
                            ) =>
                                setForm(
                                    {
                                        ...form,
                                        hr_position:
                                            e
                                                .target
                                                .value,
                                    }
                                )
                            }
                        />

                    </div>

                    <button

                        disabled={
                            !!activeNoc
                        }

                        onClick={() =>
                            setReviewMode(
                                true
                            )
                        }

                        className="rounded border px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"

                    >

                        Review & Confirm

                    </button>

                </div>

            )}

            {reviewMode && (

                <div className="rounded-lg border p-6">

                    <h2 className="mb-2 text-xl font-semibold">
                        Review & Confirm
                    </h2>

                    <p className="mb-6 text-sm text-muted-foreground">
                        Please verify all details carefully before submitting.
                        Once submitted, the request will be sent for HOD approval.
                    </p>

                    <div className="grid gap-4 md:grid-cols-2">

                        <div className="rounded border p-3">
                            <p className="text-xs text-muted-foreground">
                                Student Name
                            </p>
                            <p className="font-medium">
                                {profile?.student_name}
                            </p>
                        </div>

                        <div className="rounded border p-3">
                            <p className="text-xs text-muted-foreground">
                                Enrollment Number
                            </p>
                            <p className="font-medium">
                                {profile?.enrollment_no}
                            </p>
                        </div>

                        <div className="rounded border p-3">
                            <p className="text-xs text-muted-foreground">
                                Institute Email
                            </p>
                            <p className="font-medium">
                                {profile?.institute_email}
                            </p>
                        </div>

                        <div className="rounded border p-3">
                            <p className="text-xs text-muted-foreground">
                                Institute
                            </p>
                            <p className="font-medium">
                                {profile?.institute_name}
                            </p>
                        </div>

                        <div className="rounded border p-3">
                            <p className="text-xs text-muted-foreground">
                                Course
                            </p>
                            <p className="font-medium">
                                {profile?.course}
                            </p>
                        </div>

                        <div className="rounded border p-3">
                            <p className="text-xs text-muted-foreground">
                                Semester
                            </p>
                            <p className="font-medium">
                                {profile?.semester}
                            </p>
                        </div>

                        <div className="rounded border p-3">
                            <p className="text-xs text-muted-foreground">
                                Branch
                            </p>
                            <p className="font-medium">
                                {profile?.branch}
                            </p>
                        </div>

                        <div className="rounded border p-3">
                            <p className="text-xs text-muted-foreground">
                                NOC Type
                            </p>
                            <p className="font-medium">
                                {form.noc_type}
                            </p>
                        </div>

                        <div className="rounded border p-3">
                            <p className="text-xs text-muted-foreground">
                                Start Date
                            </p>
                            <p className="font-medium">
                                {form.start_date}
                            </p>
                        </div>

                        <div className="rounded border p-3">
                            <p className="text-xs text-muted-foreground">
                                End Date
                            </p>
                            <p className="font-medium">
                                {form.end_date}
                            </p>
                        </div>

                        <div className="rounded border p-3 md:col-span-2">
                            <p className="text-xs text-muted-foreground">
                                Company Name
                            </p>
                            <p className="font-medium">
                                {form.company_name}
                            </p>
                        </div>

                        <div className="rounded border p-3 md:col-span-2">
                            <p className="text-xs text-muted-foreground">
                                Company Address 1
                            </p>
                            <p className="font-medium">
                                {form.company_address_1}
                            </p>
                        </div>

                        <div className="rounded border p-3 md:col-span-2">
                            <p className="text-xs text-muted-foreground">
                                Company Address 2
                            </p>
                            <p className="font-medium">
                                {form.company_address_2}
                            </p>
                        </div>

                        <div className="rounded border p-3">
                            <p className="text-xs text-muted-foreground">
                                HR Prefix
                            </p>
                            <p className="font-medium">
                                {form.hr_prefix}
                            </p>
                        </div>

                        <div className="rounded border p-3">
                            <p className="text-xs text-muted-foreground">
                                HR Name
                            </p>
                            <p className="font-medium">
                                {form.hr_name}
                            </p>
                        </div>

                        <div className="rounded border p-3">
                            <p className="text-xs text-muted-foreground">
                                HR Position
                            </p>
                            <p className="font-medium">
                                {form.hr_position}
                            </p>
                        </div>

                    </div>

                    <div className="mt-4 flex gap-3">

                        <button

                            onClick={() =>
                                setReviewMode(
                                    false
                                )
                            }

                            className="rounded border px-4 py-2"

                        >

                            Back

                        </button>

                        <button

                            disabled={
                                submitting
                            }

                            onClick={
                                submitRequest
                            }

                            className="rounded border px-4 py-2"

                        >

                            Submit Request

                        </button>

                    </div>

                </div>

            )}

            <div className="mt-8">

                {
                    completionRequest && (

                        <div className="mb-8 rounded-lg border p-6">

                            <h2 className="mb-4 text-xl font-semibold">

                                Complete Previous NOC

                            </h2>

                            <div className="space-y-4">

                                <input

                                    type="file"

                                    accept="
.pdf,
.jpg,
.jpeg,
.png
"

                                    onChange={(e) =>

                                        setCompletionForm({

                                            ...completionForm,

                                            certificate:
                                                e.target.files?.[0]
                                                ?? null,

                                        })

                                    }

                                />

                            </div>

                            <input

                                placeholder="HR Email"

                                className="
w-full
rounded
border
p-2
"

                                value={
                                    completionForm.hr_email
                                }

                                onChange={(e) =>

                                    setCompletionForm({

                                        ...completionForm,

                                        hr_email:
                                            e.target.value,

                                    })

                                }

                            />

                            <input

                                placeholder="HR Contact Number"

                                className="
w-full
rounded
border
p-2
"

                                value={
                                    completionForm.hr_contact
                                }

                                onChange={(e) =>

                                    setCompletionForm({

                                        ...completionForm,

                                        hr_contact:
                                            e.target.value,

                                    })

                                }

                            />

                            <label className="flex gap-2">

                                <input

                                    type="checkbox"

                                    checked={
                                        completionForm.same_hr
                                    }

                                    onChange={(e) =>

                                        setCompletionForm({

                                            ...completionForm,

                                            same_hr:
                                                e.target.checked,

                                        })

                                    }

                                />

                                Same HR as NOC

                                (
                                {
                                    completionRequest
                                        ?.snapshot
                                        ?.hr_name
                                }

                                )

                            </label>

                            {
                                !completionForm.same_hr && (

                                    <>

                                        <input

                                            placeholder="New HR Name"

                                            className="
w-full
rounded
border
p-2
"

                                            value={
                                                completionForm.hr_name
                                            }

                                            onChange={(e) =>

                                                setCompletionForm({

                                                    ...completionForm,

                                                    hr_name:
                                                        e.target.value,

                                                })

                                            }

                                        />

                                        <input

                                            placeholder="New HR Designation"

                                            className="
w-full
rounded
border
p-2
"

                                            value={
                                                completionForm.hr_designation
                                            }

                                            onChange={(e) =>

                                                setCompletionForm({

                                                    ...completionForm,

                                                    hr_designation:
                                                        e.target.value,

                                                })

                                            }

                                        />

                                    </>

                                )
                            }

                        </div>

                    )
                }

                <h2 className="mb-4 text-xl font-semibold">

                    My NOC Requests

                </h2>

                <div className="overflow-hidden rounded-lg border">

                    <table className="w-full">

                        <thead>

                            <tr className="border-b">

                                <th className="p-3 text-left">
                                    Company
                                </th>

                                <th className="p-3 text-left">
                                    Type
                                </th>

                                <th className="p-3 text-left">
                                    Duration
                                </th>

                                <th className="p-3 text-left">
                                    Applied On
                                </th>

                                <th className="p-3 text-left">
                                    Approval Deadline
                                </th>

                                <th className="p-3 text-left">
                                    Status
                                </th>

                                <th className="p-3 text-left">
                                    Actions
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            {requests.map(
                                (
                                    request
                                ) => (

                                    <tr
                                        key={
                                            request.noc_request_id
                                        }
                                        className="border-b"
                                    >

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
                                                Math.max(
                                                    1,
                                                    (
                                                        (
                                                            new Date(
                                                                request.snapshot?.end_date
                                                            ).getFullYear()
                                                            -
                                                            new Date(
                                                                request.snapshot?.start_date
                                                            ).getFullYear()
                                                        ) * 12
                                                    )
                                                    +
                                                    (
                                                        new Date(
                                                            request.snapshot?.end_date
                                                        ).getMonth()
                                                        -
                                                        new Date(
                                                            request.snapshot?.start_date
                                                        ).getMonth()
                                                    )
                                                )
                                            }

                                            {" "}Month(s)

                                        </td>

                                        <td className="p-3">

                                            {
                                                request.created_at
                                                    ?
                                                    new Date(
                                                        request.created_at
                                                    ).toLocaleDateString()
                                                    :
                                                    "-"
                                            }

                                        </td>

                                        <td className="p-3">

                                            {
                                                request.status ===
                                                    "PENDING_HOD_APPROVAL"

                                                    ?

                                                    new Date(
                                                        request.hod_approval_deadline
                                                    ).toLocaleString()

                                                    :

                                                    "-"
                                            }

                                        </td>

                                        <td className="p-3">

                                            <span
                                                className={`
            rounded-full
            px-3
            py-1
            text-xs
            font-medium
            ${request.status === "PENDING_HOD_APPROVAL"
                                                        ? "bg-yellow-100 text-yellow-800"
                                                        : request.status === "PENDING_PRINT"
                                                            ? "bg-blue-100 text-blue-800"
                                                            : request.status === "PRINTED"
                                                                ? "bg-purple-100 text-purple-800"
                                                                : request.status === "ISSUED"
                                                                    ? "bg-green-100 text-green-800"
                                                                    : request.status === "CANCELLED"
                                                                        ? "bg-red-100 text-red-800"
                                                                        : "bg-gray-100 text-gray-800"
                                                    }
        `}
                                            >

                                                {
                                                    request.status === "PENDING_HOD_APPROVAL"
                                                        ? "Pending HOD"
                                                        : request.status === "PENDING_PRINT"
                                                            ? "Pending Print"
                                                            : request.status === "PRINTED"
                                                                ? "Printed"
                                                                : request.status === "ISSUED"
                                                                    ? "Issued"
                                                                    : request.status === "CANCELLED"
                                                                        ? "Cancelled"
                                                                        : request.status === "HOD_REJECTED"
                                                                            ? "Rejected"
                                                                            : request.status
                                                }

                                            </span>

                                        </td>

                                        <td className="p-3">

                                            <button

                                                onClick={() =>
                                                    setSelectedRequest(
                                                        request
                                                    )
                                                }

                                                className="rounded border px-3 py-1"

                                            >

                                                View

                                            </button>
                                        </td>

                                    </tr>

                                )
                            )}

                            {requests.length === 0 && (

                                <tr>

                                    <td
                                        colSpan={7}
                                        className="p-6 text-center text-muted-foreground"
                                    >

                                        No NOC requests found

                                    </td>

                                </tr>

                            )}

                        </tbody>

                    </table>

                </div>

            </div>

            {selectedRequest && (

                <div
                    className="
fixed
inset-0
z-50
flex
items-center
justify-center
bg-black/50
"
                >

                    <div
                        className="
w-full
max-w-4xl
rounded-lg
bg-white
p-6
"
                    >

                        <h2 className="mb-4 text-xl font-semibold">

                            NOC Details

                        </h2>

                        <div className="grid grid-cols-2 gap-4">

                            <div>

                                <strong>
                                    Company
                                </strong>

                                <br />

                                {
                                    selectedRequest.snapshot?.company_name
                                }

                            </div>

                            <div>

                                <strong>
                                    NOC Type
                                </strong>

                                <br />

                                {
                                    selectedRequest.noc_type
                                }

                            </div>

                            <div>

                                <strong>
                                    Start Date
                                </strong>

                                <br />

                                {
                                    selectedRequest.snapshot?.start_date
                                }

                            </div>

                            <div>

                                <strong>
                                    End Date
                                </strong>

                                <br />

                                {
                                    selectedRequest.snapshot?.end_date
                                }

                            </div>

                            <div>

                                <strong>
                                    HR Name
                                </strong>

                                <br />

                                {
                                    selectedRequest.snapshot?.hr_name
                                }

                            </div>

                            <div>

                                <strong>
                                    HR Position
                                </strong>

                                <br />

                                {
                                    selectedRequest.snapshot?.hr_position
                                }

                            </div>

                            <div>

                                <strong>
                                    Approval Source
                                </strong>

                                <br />

                                {
                                    selectedRequest.approval_source
                                    ??
                                    "-"
                                }

                            </div>

                            <div>

                                <strong>
                                    Approved At
                                </strong>

                                <br />

                                {
                                    selectedRequest.approved_at
                                        ?
                                        new Date(
                                            selectedRequest.approved_at
                                        ).toLocaleString()
                                        :
                                        "-"
                                }

                            </div>

                            <div>

                                {
                                    [
                                        "ISSUED",
                                        "CANCELLED"
                                    ].includes(
                                        selectedRequest.status
                                    ) && (

                                        <>

                                            <strong>
                                                Reference Number
                                            </strong>

                                            <br />

                                            {
                                                selectedRequest.reference_number
                                                ??
                                                "-"
                                            }

                                        </>

                                    )
                                }

                            </div>
                        </div>

                        <div>

                            <strong>
                                Issued At
                            </strong>

                            <br />

                            {
                                selectedRequest.issued_at
                                    ?
                                    new Date(
                                        selectedRequest.issued_at
                                    ).toLocaleString()
                                    :
                                    "-"
                            }

                        </div>

                        <div className="mt-6">

                            <button

                                onClick={() =>
                                    setSelectedRequest(
                                        null
                                    )
                                }

                                className="
rounded
border
px-4
py-2
"

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