import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { hodService } from "@/services/hodService";

function formatDateTime(value?: string | null) {
    return value ? new Date(value).toLocaleString() : "-";
}

function DetailCard({
    label,
    value,
}: {
    label: string;
    value: React.ReactNode;
}) {
    return (
        <div className="rounded-lg border bg-white p-4">
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="mt-1 font-medium">{value}</div>
        </div>
    );
}

export function HodReviewPage({ token }: { token: string }) {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [context, setContext] = useState<any>(null);
    const [submitting, setSubmitting] = useState(false);

    async function load() {
        setLoading(true);
        setError(null);

        try {
            const data = await hodService.getReviewContext(token);
            setContext(data);
        } catch (err: any) {
            setError(err?.message ?? "Unable to load HOD review page.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, [token]);

    async function approve() {
        if (!context?.request) return;
        if (context.isExpired) return;

        const ok = window.confirm("Approve this NOC request?");
        if (!ok) return;

        setSubmitting(true);
        try {
            await hodService.approveByToken(token);
            alert("NOC approved.");
            navigate({ to: "/hod" });
        } catch (err: any) {
            alert(err?.message ?? "Failed to approve.");
        } finally {
            setSubmitting(false);
        }
    }

    async function reject() {
        if (!context?.request) return;
        if (context.isExpired) return;

        const reason = window.prompt("Enter rejection reason");
        if (!reason || !reason.trim()) return;

        setSubmitting(true);
        try {
            await hodService.rejectByToken(token, reason.trim());
            alert("NOC rejected.");
            navigate({ to: "/hod" });
        } catch (err: any) {
            alert(err?.message ?? "Failed to reject.");
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) {
        return <div className="p-6">Loading...</div>;
    }

    if (error) {
        return (
            <div className="mx-auto max-w-7xl p-6">
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
                    {error}
                </div>
                <div className="mt-4">
                    <Link to="/hod" className="rounded border px-4 py-2">
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    const request = context?.request;
    const expired = !!context?.isExpired || !!context?.tokenRow?.used_at;

    return (
        <div className="mx-auto max-w-7xl p-6">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-3xl font-bold">HOD Review</h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Approval deadline: {formatDateTime(request?.hod_approval_deadline ?? context?.expiresAt)}
                    </p>
                </div>

                <div className="flex gap-2">
                    <Link to="/hod" className="rounded border px-4 py-2">
                        Back
                    </Link>
                </div>
            </div>

            {expired && (
                <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
                    This approval link is expired or already used.
                </div>
            )}

            <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <DetailCard label="Student Name" value={request?.snapshot?.student_name ?? "-"} />
                <DetailCard label="Enrollment No." value={request?.snapshot?.enrollment_no ?? "-"} />
                <DetailCard label="Institute Email" value={request?.snapshot?.institute_email ?? "-"} />
                <DetailCard label="Institute" value={request?.snapshot?.institute_name ?? "-"} />
                <DetailCard label="Course" value={request?.snapshot?.course ?? "-"} />
                <DetailCard label="Semester" value={request?.snapshot?.semester ?? "-"} />
                <DetailCard label="Branch" value={request?.snapshot?.branch ?? "-"} />
                <DetailCard label="NOC Type" value={request?.noc_type ?? "-"} />
                <DetailCard label="Opportunity Mode" value={request?.snapshot?.opportunity_mode ?? "-"} />
                <DetailCard label="Company Name" value={request?.snapshot?.company_name ?? "-"} />
                <DetailCard label="Start Date" value={request?.snapshot?.start_date ?? "-"} />
                <DetailCard label="End Date" value={request?.snapshot?.end_date ?? "-"} />
                <DetailCard label="HR Name" value={`${request?.snapshot?.hr_prefix ?? ""} ${request?.snapshot?.hr_name ?? "-"}`.trim()} />
                <DetailCard label="HR Position" value={request?.snapshot?.hr_position ?? "-"} />
                <DetailCard label="Company Address 1" value={request?.snapshot?.company_address_1 ?? "-"} />
                <DetailCard label="Company Address 2" value={request?.snapshot?.company_address_2 ?? "-"} />
                <DetailCard label="Submitted At" value={formatDateTime(request?.created_at)} />
                <DetailCard label="Approval Deadline" value={formatDateTime(request?.hod_approval_deadline)} />
                <DetailCard label="Token Status" value={context?.tokenRow?.used_at ? "Used" : context?.isExpired ? "Expired" : "Active"} />
            </div>

            <div className="mb-6 rounded-lg border bg-slate-50 p-4">
                <div className="text-sm text-muted-foreground">Review Notes</div>
                <div className="mt-2 text-sm leading-6">
                    {request?.snapshot?.student_name} is requesting NOC for {request?.noc_type} at {request?.snapshot?.company_name}.
                </div>
            </div>

            <div className="flex flex-wrap gap-3">
                <button
                    disabled={submitting || expired}
                    onClick={approve}
                    className="rounded border px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Approve
                </button>

                <button
                    disabled={submitting || expired}
                    onClick={reject}
                    className="rounded border px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Reject
                </button>
            </div>
        </div>
    );
}