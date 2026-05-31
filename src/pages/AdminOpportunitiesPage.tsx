import {
    useEffect,
    useState,
} from "react";

import {
    adminOpportunityService,
} from "@/services/adminOpportunityService";

import {
    Link,
} from "@tanstack/react-router";

export function AdminOpportunitiesPage() {

    const [drives, setDrives] =
        useState<any[]>([]);

    const [opportunityCards,
        setOpportunityCards] =
        useState<any[]>([]);

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

    }

    useEffect(() => {
        load();
    }, []);

    async function handleSubmit(
        e: React.FormEvent,
    ) {

        e.preventDefault();

        try {

            await adminOpportunityService.createOpportunity(
                {
                    drive_id:
                        driveId,

                    opportunity_title:
                        title,

                    opportunity_description:
                        description,

                    registration_deadline:
                        registrationDeadline,
                },
            );

            setDriveId("");
            setTitle("");
            setDescription("");
            setRegistrationDeadline("");

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

        if (!deadline) {
            return "No deadline";
        }


        const diff =
            new Date(deadline).getTime()
            -
            new Date().getTime();


        if (diff <= 0) {
            return "Closed";
        }


        const days =
            Math.floor(
                diff /
                (1000 * 60 * 60 * 24)
            );


        const hours =
            Math.floor(
                diff /
                (1000 * 60 * 60)
            ) % 24;


        return `${days}d ${hours}h left`;
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
                            rows={4}
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

                    </div>

                    <button
                        type="submit"
                        className="rounded border px-4 py-2"
                    >
                        Create Opportunity
                    </button>
                </form>

                <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">

                    {opportunityCards.map(
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


                            </div>

                        ),
                    )}

                </div>

            </div>
        </div>
    );
}