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

        } finally {

            setLoading(
                false
            );

        }

    }

    async function submitRequest() {

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

            await nocService.createRequest(
                student.student_id,
                form
            );

            alert(
                "NOC Request Submitted Successfully"
            );

            window.location.reload();

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

                    </div>

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

                        onClick={() =>
                            setReviewMode(
                                true
                            )
                        }

                        className="rounded border px-4 py-2"

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

        </div>

    );

}