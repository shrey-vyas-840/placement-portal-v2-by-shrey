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

    const [
        selectedRequest,
        setSelectedRequest,
    ] =
        useState<any>(
            null
        );

    return (

        <div className="mx-auto max-w-7xl p-6">

            <h1 className="text-3xl font-bold">

                NOC Dashboard

            </h1>

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

                                            onClick={() =>
                                                setSelectedRequest(
                                                    request
                                                )
                                            }

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

            {selectedRequest && (

                <div className="fixed inset-0 flex items-center justify-center bg-black/40">

                    <div className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-lg bg-white p-6">

                        <h2 className="mb-4 text-2xl font-semibold">

                            NOC Review

                        </h2>

                        <div className="grid gap-3 md:grid-cols-2">

                            {Object.entries(
                                selectedRequest.snapshot
                            ).map(
                                ([key, value]) => (

                                    <div
                                        key={key}
                                        className="rounded border p-3"
                                    >

                                        <div className="text-xs text-muted-foreground">

                                            {key}

                                        </div>

                                        <div>

                                            {String(
                                                value
                                            )}

                                        </div>

                                    </div>

                                )
                            )}

                        </div>

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