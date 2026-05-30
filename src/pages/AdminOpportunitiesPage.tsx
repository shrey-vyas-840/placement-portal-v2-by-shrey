import {
    useEffect,
    useState,
} from "react";

import {
    adminOpportunityService,
} from "@/services/adminOpportunityService";

export function AdminOpportunitiesPage() {

    const [drives, setDrives] =
        useState<any[]>([]);

    const [opportunities,
        setOpportunities] =
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

    const [startDate,
        setStartDate] =
        useState("");

    const [endDate,
        setEndDate] =
        useState("");

    const [applications,
        setApplications] =
        useState<any[]>([]);

    async function load() {

        const drivesData =
            await adminOpportunityService.getDrives();

        const opportunitiesData =
            await adminOpportunityService.getOpportunities();

        const applicationsData =
            await adminOpportunityService.getApplications();

        setDrives(
            drivesData,
        );

        setOpportunities(
            opportunitiesData,
        );
        setApplications(
            applicationsData,
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

                    application_start_date:
                        startDate,

                    application_end_date:
                        endDate,
                },
            );

            setDriveId("");
            setTitle("");
            setDescription("");
            setStartDate("");
            setEndDate("");

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
                {opportunities.length}
            </div>
        </div>

        <div className="rounded border p-3">
            <div className="text-sm text-muted-foreground">
                Published
            </div>

            <div className="mt-2 text-2xl font-bold">
                {
                    opportunities.filter(
                        (x) =>
                            x.visible_to_students,
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
                    opportunities.filter(
                        (x) =>
                            x.application_status ===
                            "Draft",
                    ).length
                }
            </div>
        </div>

        <div className="rounded border p-3">
            <div className="text-sm text-muted-foreground">
                Applications
            </div>

            <div className="mt-2 text-2xl font-bold">
                {applications.length}
            </div>
        </div>

    </div>

</div>

                <p className="mt-2 text-sm text-muted-foreground">
                    Create opportunities from approved drives and publish them to students.
                </p>

                <div className="mt-6 overflow-hidden rounded-lg border">

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
                                    Visible
                                </th>

                                <th className="p-3 text-left">
                                    Action
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            {opportunities.map(
                                (
                                    opportunity,
                                ) => (

                                    <tr
                                        key={
                                            opportunity.opportunity_id
                                        }
                                        className="border-b"
                                    >

                                        <td className="p-3">
                                            {
                                                opportunity.opportunity_title
                                            }
                                        </td>

                                        <td className="p-3">
                                            {
                                                opportunity.drive_master
                                                    ?.drive_name
                                            }
                                        </td>

                                        <td className="p-3">

                                            <select
                                                value={
                                                    opportunity.application_status
                                                }
                                                onChange={async (e) => {

                                                    await adminOpportunityService.updateOpportunityStatus(
                                                        opportunity.opportunity_id,
                                                        e.target.value,
                                                    );

                                                    await load();
                                                }}
                                                className="rounded border px-2 py-1"
                                            >

                                                <option value="Draft">
                                                    Draft
                                                </option>

                                                <option value="Open">
                                                    Open
                                                </option>

                                                <option value="Closed">
                                                    Closed
                                                </option>

                                                <option value="Completed">
                                                    Completed
                                                </option>

                                            </select>

                                        </td>

                                        <td className="p-3">

                                            <input
                                                type="checkbox"
                                                checked={
                                                    opportunity.visible_to_students
                                                }
                                                onChange={async (e) => {

                                                    await adminOpportunityService.toggleVisibility(
                                                        opportunity.opportunity_id,
                                                        e.target.checked,
                                                    );

                                                    await load();
                                                }}
                                            />

                                        </td>

                                        <td className="p-3">

                                            {opportunity.visible_to_students
                                                ? "Published"
                                                : "Hidden"}

                                        </td>

                                    </tr>
                                ),
                            )}

                        </tbody>

                    </table>

                </div>



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
                            Application Start
                        </label>

                        <input
                            type="datetime-local"
                            value={
                                startDate
                            }
                            onChange={(
                                e,
                            ) =>
                                setStartDate(
                                    e.target
                                        .value,
                                )
                            }
                            className="w-full rounded border px-4 py-2"
                        />

                    </div>

                    <div>

                        <label className="mb-1 block font-medium">
                            Application End
                        </label>

                        <input
                            type="datetime-local"
                            value={
                                endDate
                            }
                            onChange={(
                                e,
                            ) =>
                                setEndDate(
                                    e.target
                                        .value,
                                )
                            }
                            className="w-full rounded border px-4 py-2"
                        />

                    </div>

                    <button
                        type="submit"
                        className="rounded border px-4 py-2"
                    >
                        Create Opportunity
                    </button>

                </form>

            </div>

            <div className="mt-8 overflow-hidden rounded-lg border">

                <div className="border-b p-4 font-semibold">
                    Applications
                </div>

                <table className="w-full">

                    <thead>

                        <tr className="border-b">

                            <th className="p-3 text-left">
                                Application ID
                            </th>

                            <th className="p-3 text-left">
                                Status
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
                                            application.application_id
                                        }
                                    </td>

                                    <td className="p-3">
                                        {
                                            application.application_status
                                        }
                                    </td>

                                </tr>
                            ),
                        )}

                    </tbody>

                </table>

            </div>

        </div>
    );
}