import {
    useEffect,
    useState,
} from "react";

import {
    adminOpportunityService,
} from "@/services/adminOpportunityService";

import {
    adminQuestionService,
} from "@/services/adminQuestionService";

import {
    Link,
} from "@tanstack/react-router";

import {
    NOC_EMAIL_CONFIG,
} from "@/config/hodMapping";

import {
    OpportunityMailWorkspaceModal,
} from "@/components/opportunities/OpportunityMailWorkspaceModal";

export function AdminOpportunitiesPage() {

    const [drives, setDrives] =
        useState<any[]>([]);

    const [opportunityCards,
        setOpportunityCards] =
        useState<any[]>([]);

    const [
        questionCounts,
        setQuestionCounts
    ] =
        useState<
            Record<string, number>
        >({});

    const [driveId,
        setDriveId] =
        useState("");

    const [title,
        setTitle] =
        useState("");

    const [description,
        setDescription] =
        useState("");

    const [registrationDeadline,
        setRegistrationDeadline] =
        useState("");

    const [publishNow, setPublishNow] =
        useState(false);

    const [
        extendOpportunity,
        setExtendOpportunity
    ] =
        useState<any>(null);


    const [
        newDeadline,
        setNewDeadline
    ] =
        useState("");

    const [
        editingOpportunity,
        setEditingOpportunity
    ] =
        useState<any>(null);

    const [
        mailWorkspaceOpportunityId,
        setMailWorkspaceOpportunityId,
    ] = useState<string | null>(null);

    const hasChanges =

        editingOpportunity
            ?

            (
                title !== editingOpportunity.opportunity_title
                ||
                description !==
                (
                    editingOpportunity.opportunity_description
                    ||
                    ""
                )
                ||
                registrationDeadline !==
                (
                    editingOpportunity.deadline
                        ?
                        editingOpportunity.deadline.slice(0, 16)
                        :
                        ""
                )

            )

            :

            true;

    async function load() {

        const drivesData =
            await adminOpportunityService
                .getDrives();


        const cardsData =
            await adminOpportunityService
                .getOpportunityCards();


        setDrives(
            drivesData
        );


        setOpportunityCards(
            cardsData
        );

        const counts:
            Record<
                string,
                number
            > = {};

        for (
            const opp
            of cardsData
        ) {

            counts[
                opp.opportunity_id
            ] =

                await
                    adminQuestionService
                        .getQuestionCount(
                            opp.opportunity_id
                        );

        }

        setQuestionCounts(
            counts
        );

    }

    useEffect(() => {
        load();
    }, []);

    async function handleSubmit(
        e: React.FormEvent,
    ) {

        e.preventDefault();

        try {
            if (
                editingOpportunity
            ) {

                await adminOpportunityService
                    .updateOpportunity(

                        editingOpportunity.opportunity_id,

                        {

                            opportunity_title:
                                title,

                            opportunity_description:
                                description,

                            application_end_date:

                                new Date(
                                    registrationDeadline
                                )
                                    .toISOString(),
                        }
                    );

                setEditingOpportunity(
                    null
                );


                setDriveId("");
                setTitle("");
                setDescription("");
                setRegistrationDeadline("");


                await load();


                return;

            }
            await adminOpportunityService.createOpportunity(
                {
                    drive_id:
                        driveId,

                    opportunity_title:
                        title,

                    opportunity_description:
                        description,

                    application_end_date:

                        new Date(
                            registrationDeadline
                        ).toISOString(),

                    publish:
                        publishNow,
                },
            );

            setDriveId("");
            setTitle("");
            setDescription("");
            setPublishNow(false);

            await load();

        } catch (err) {

            console.error(
                err,
            );

            alert(
                "Failed to create opportunity",
            );
        }
    }

    function getTimeLeft(
        deadline: string,
    ) {

        if (
            !deadline
        ) {

            return "No deadline";

        }


        const end =
            new Date(
                deadline,
            )
                .getTime();


        const now =
            Date.now();


        const diff =
            end - now;


        if (
            diff <= 0
        ) {

            return "Closed";

        }


        const days =
            Math.floor(
                diff /
                (
                    1000 *
                    60 *
                    60 *
                    24
                )
            );


        const hours =
            Math.floor(
                (
                    diff %
                    (
                        1000 *
                        60 *
                        60 *
                        24
                    )
                )
                /
                (
                    1000 *
                    60 *
                    60
                )
            );


        const minutes =
            Math.floor(
                (
                    diff %
                    (
                        1000 *
                        60 *
                        60
                    )
                )
                /
                (
                    1000 *
                    60
                )
            );


        return (
            `${days}d ${hours}h ${minutes}m left`
        );

    }

    return (

        <div className="min-h-screen bg-background">

            <div className="mx-auto max-w-7xl px-6 py-8">

                <h1 className="text-3xl font-bold">
                    Opportunities
                </h1>

                <div className="mt-4 rounded-lg border p-4">

                    <div className="grid grid-cols-4 gap-4">

                        <div className="rounded border p-3">
                            <div className="text-sm text-muted-foreground">
                                Total Opportunities
                            </div>

                            <div className="mt-2 text-2xl font-bold">
                                {opportunityCards.length}
                            </div>
                        </div>

                        <div className="rounded border p-3">
                            <div className="text-sm text-muted-foreground">
                                Published
                            </div>

                            <div className="mt-2 text-2xl font-bold">
                                {
                                    opportunityCards.filter(
                                        (item) =>
                                            item.visible_to_students === true
                                    ).length
                                }
                            </div>
                        </div>

                        <div className="rounded border p-3">
                            <div className="text-sm text-muted-foreground">
                                Draft
                            </div>

                            <div className="mt-2 text-2xl font-bold">
                                {
                                    opportunityCards.filter(
                                        (item) =>
                                            item.application_status === "Draft"
                                    ).length
                                }
                            </div>
                        </div>

                        <div className="rounded border p-3">
                            <div className="text-sm text-muted-foreground">
                                Applications
                            </div>

                            <div className="mt-2 text-2xl font-bold">
                                {
                                    opportunityCards.reduce(
                                        (
                                            total,
                                            item,
                                        ) =>
                                            total +
                                            item.appliedCount,
                                        0,
                                    )
                                }
                            </div>
                        </div>

                    </div>

                </div>

                <p className="mt-2 text-sm text-muted-foreground">
                    Create opportunities from approved drives and publish them to students.
                </p>

                <div className="mt-8 rounded-lg border p-4">

                    <h2 className="font-semibold">
                        Opportunity Workflow
                    </h2>

                    <div className="mt-3 flex gap-3 text-sm">

                        <span>
                            Draft
                        </span>

                        <span>
                            →
                        </span>

                        <span>
                            Open
                        </span>

                        <span>
                            →
                        </span>

                        <span>
                            Closed
                        </span>

                        <span>
                            →
                        </span>

                        <span>
                            Completed
                        </span>

                    </div>

                </div>

                <div className="mt-8 rounded border p-4">

                    <h2 className="font-semibold">
                        Draft Opportunities
                    </h2>


                    {opportunityCards
                        .filter(
                            x =>
                                x.application_status === "Draft"
                        )
                        .slice(0, 5)
                        .map(
                            opp => (

                                <div
                                    key={opp.opportunity_id}
                                    className="mt-3 flex justify-between border p-3"
                                >

                                    <div>

                                        <b>
                                            {opp.opportunity_title}
                                        </b>

                                        <p>
                                            {opp.company}
                                        </p>

                                    </div>

                                    <div
                                        className="
text-sm
text-muted-foreground
mb-2
"
                                    >

                                        Questions:
                                        {" "}

                                        {
                                            questionCounts[
                                            opp.opportunity_id
                                            ]
                                            ||
                                            0
                                        }

                                    </div>

                                    <button

                                        disabled={
                                            (
                                                questionCounts[
                                                opp.opportunity_id
                                                ]
                                                ||
                                                0
                                            ) === 0
                                        }

                                        onClick={
                                            async () => {

                                                await adminOpportunityService
                                                    .publishOpportunity(
                                                        opp.opportunity_id
                                                    );

                                                await load();

                                            }
                                        }

                                        className="rounded border px-3"

                                    >

                                        Publish Now

                                    </button>

                                    <Link
                                        to="/admin/questions/$opportunityId"
                                        params={{
                                            opportunityId:
                                                opp.opportunity_id,
                                        }}
                                        className="rounded border px-3 py-2"
                                    >
                                        Questions
                                    </Link>

                                    <button

                                        className="rounded border px-3"

                                        onClick={
                                            () => {

                                                setEditingOpportunity(
                                                    opp
                                                );


                                                setDriveId(
                                                    opp.drive_id
                                                );


                                                setTitle(
                                                    opp.opportunity_title
                                                );


                                                setDescription(
                                                    opp.opportunity_description
                                                    ||
                                                    ""
                                                );


                                                setRegistrationDeadline(
                                                    opp.deadline
                                                        ?
                                                        opp.deadline.slice(0, 16)
                                                        :
                                                        ""
                                                );

                                            }
                                        }

                                    >

                                        Edit

                                    </button>

                                </div>

                            )
                        )}

                </div>

                <form
                    onSubmit={
                        handleSubmit
                    }
                    className="mt-8 rounded-lg border p-5 space-y-4"
                >

                    <div>

                        <label className="mb-1 block font-medium">
                            Drive
                        </label>

                        <select
                            value={
                                driveId
                            }
                            onChange={(
                                e,
                            ) =>
                                setDriveId(
                                    e.target
                                        .value,
                                )
                            }
                            className="w-full rounded border px-4 py-2"
                            required
                        >

                            <option value="">
                                Select Drive
                            </option>

                            {drives.map(
                                (
                                    drive,
                                ) => (
                                    <option
                                        key={
                                            drive.drive_id
                                        }
                                        value={
                                            drive.drive_id
                                        }
                                    >
                                        {drive.company_master?.company_name}
                                        {" - "}
                                        {drive.drive_name}
                                    </option>
                                ),
                            )}

                        </select>

                    </div>

                    <div>

                        <label className="mb-1 block font-medium">
                            Opportunity Title
                        </label>

                        <input
                            value={
                                title
                            }
                            onChange={(
                                e,
                            ) =>
                                setTitle(
                                    e.target
                                        .value,
                                )
                            }
                            className="w-full rounded border px-4 py-2"
                            required
                        />

                    </div>

                    <div>

                        <label className="mb-1 block font-medium">
                            Description
                        </label>

                        <textarea
                            rows={10}
                            value={
                                description
                            }
                            onChange={(
                                e,
                            ) =>
                                setDescription(
                                    e.target
                                        .value,
                                )
                            }
                            className="w-full rounded border px-4 py-2"
                        />

                    </div>

                    <div>

                        <label className="mb-1 block font-medium">
                            Registration Deadline
                        </label>

                        <input
                            type="datetime-local"
                            value={
                                registrationDeadline
                            }
                            onChange={(
                                e,
                            ) =>
                                setRegistrationDeadline(
                                    e.target.value,
                                )
                            }
                            className="w-full rounded border px-4 py-2"
                            required
                        />

                        <div className="flex items-center gap-2 mt-3">

                        </div>

                    </div>

                    <label className="flex gap-2">

                        <input

                            type="checkbox"

                            checked={
                                publishNow
                            }

                            onChange={
                                (e) =>
                                    setPublishNow(
                                        e.target.checked
                                    )
                            }

                        />

                        Publish immediately to students

                    </label>

                    <button
                        type="submit"
                        disabled={
                            !hasChanges
                        }
                        className="rounded border px-4 py-2"
                    >
                        {
                            editingOpportunity
                                ?
                                "Save Changes"
                                :
                                "Create Opportunity"
                        }
                    </button>
                    {
                        editingOpportunity
                        &&

                        <button

                            type="button"

                            onClick={
                                () => {

                                    setEditingOpportunity(
                                        null
                                    );

                                    setDriveId("");
                                    setTitle("");
                                    setDescription("");
                                    setRegistrationDeadline("");

                                }
                            }

                        >

                            Cancel Edit

                        </button>

                    }
                </form>

                <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">

                    {
                        opportunityCards
                            .filter(
                                x =>
                                    x.application_status !== "Draft"
                            ).slice(0, 5)
                            .map(
                                (opportunity) => (

                                    <div
                                        key={
                                            opportunity.opportunity_id
                                        }
                                        className="rounded-xl border bg-background p-5 shadow-sm"
                                    >

                                        <h2 className="text-xl font-semibold">

                                            {opportunity.company}

                                        </h2>


                                        <p className="mt-1">

                                            {opportunity.opportunity_title}

                                        </p>


                                        <div className="mt-5 space-y-2 text-sm">

                                            <p>
                                                Role:
                                                {" "}
                                                {
                                                    opportunity.drive_master
                                                        ?.drive_name
                                                }
                                            </p>


                                            <p>
                                                Eligible Candidates:
                                                {" "}
                                                <b>
                                                    {
                                                        opportunity.eligibleCount
                                                    }
                                                </b>
                                            </p>


                                            <p>
                                                Applied Students:
                                                {" "}
                                                <b>
                                                    {
                                                        opportunity.appliedCount
                                                    }
                                                </b>
                                            </p>


                                            <p>
                                                Not Applied:
                                                {" "}
                                                <b>
                                                    {
                                                        opportunity.unappliedCount
                                                    }
                                                </b>
                                            </p>


                                            <p>
                                                Deadline:
                                                {" "}
                                                {
                                                    opportunity.deadline
                                                        ?
                                                        new Date(
                                                            opportunity.deadline
                                                        )
                                                            .toLocaleString()
                                                        :
                                                        "-"
                                                }
                                            </p>


                                            <p className="font-semibold text-red-600">

                                                {
                                                    getTimeLeft(
                                                        opportunity.deadline
                                                    )
                                                }

                                            </p>


                                        </div>

                                        <Link

                                            to="/admin/opportunities/$opportunityId"

                                            params={{
                                                opportunityId:
                                                    opportunity.opportunity_id,
                                            }}

                                            className="mt-5 inline-block rounded-lg border px-4 py-2"

                                        >

                                            View Applicants

                                        </Link>

                                        <button

                                            className="
mt-3 block
rounded-lg border
px-4 py-2
"

                                            onClick={() => {

                                                setExtendOpportunity(
                                                    opportunity
                                                );

                                                setNewDeadline(
                                                    opportunity.deadline
                                                        ?
                                                        opportunity.deadline.slice(0, 16)
                                                        :
                                                        ""
                                                );

                                            }}

                                        >

                                            Extend Application

                                        </button>

                                        <button
                                            type="button"
                                            className="
mt-3 block
rounded-lg border
px-4 py-2
"
                                            onClick={() =>
                                                setMailWorkspaceOpportunityId(
                                                    opportunity.opportunity_id
                                                )
                                            }
                                        >
                                            Mail Workspace
                                        </button>

                                    </div>

                                ),
                            )}{
                        opportunityCards.length > 5
                        &&

                        <Link

                            to="/admin/all-opportunities"

                            className="
rounded-xl
border
p-5
shadow-sm
flex
items-center
justify-center
font-semibold
"

                        >
                            View All (
                            {
                                opportunityCards.filter(
                                    x =>
                                        x.application_status !== "Draft"
                                ).length - 5
                            }
                            )

                        </Link>
                    }

                </div>

            </div>

            <OpportunityMailWorkspaceModal
                open={
                    mailWorkspaceOpportunityId !== null
                }
                opportunityId={
                    mailWorkspaceOpportunityId
                }
                onClose={() =>
                    setMailWorkspaceOpportunityId(
                        null
                    )
                }
            />

            {
                extendOpportunity && (

                    <div className="
fixed inset-0 
flex items-center justify-center
bg-black/40
">

                        <div className="
bg-white rounded-lg p-6
space-y-4 w-96
">

                            <h2 className="font-bold text-lg">

                                Extend Deadline

                            </h2>


                            <input

                                type="datetime-local"

                                className="
border rounded px-3 py-2 w-full
"

                                value={
                                    newDeadline
                                }

                                onChange={
                                    (e) =>
                                        setNewDeadline(
                                            e.target.value
                                        )
                                }

                            />


                            <div className="flex gap-3">


                                <button

                                    className="border px-4 py-2 rounded"

                                    onClick={
                                        async () => {
                                            {
                                                await adminOpportunityService
                                                    .extendDeadline(
                                                        extendOpportunity.opportunity_id,
                                                        new Date(
                                                            newDeadline
                                                        )
                                                            .toISOString()
                                                    );

                                                setExtendOpportunity(null);
                                                await load();
                                            }
                                        }
                                    }
                                > Save

                                </button>

                                <button

                                    className="border px-4 py-2 rounded"

                                    onClick={
                                        () => setExtendOpportunity(null)
                                    }

                                >

                                    Cancel

                                </button>


                            </div>


                        </div>

                    </div>
                )
            }

        </div>
    );
}