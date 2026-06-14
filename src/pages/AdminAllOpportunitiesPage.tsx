import { useEffect, useMemo, useState } from "react";
import { NOC_EMAIL_CONFIG } from "@/config/hodMapping";
import { Link } from "@tanstack/react-router";
import { adminOpportunityService } from "@/services/adminOpportunityService";
import {
    OpportunityMailWorkspaceModal,
} from "@/components/opportunities/OpportunityMailWorkspaceModal";

type OpportunityCard = {
    opportunity_id: string;
    drive_id: string;
    opportunity_title: string;
    opportunity_description?: string | null;
    application_status?: string | null;
    visible_to_students?: boolean | null;
    created_at?: string | null;
    deadline?: string | null;
    company?: string | null;
    eligibleCount?: number;
    appliedCount?: number;
    unappliedCount?: number;
    drive_master?: {
        drive_id?: string;
        drive_name?: string;
        company_id?: string;
        registration_deadline?: string | null;
    } | null;
};

type FilterStatus = "All" | "Open" | "Closed";
type FilterPeriod = "All" | "1 Month" | "3 Months" | "6 Months" | "1 Year";

function getTimeLeft(deadline?: string | null) {
    if (!deadline) return "No deadline";

    const diff = new Date(deadline).getTime() - Date.now();
    if (diff <= 0) return "Closed";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${days}d ${hours}h ${minutes}m left`;
}

function parsePeriodToCutoff(period: FilterPeriod): Date | null {
    const now = new Date();
    if (period === "All") return null;

    const cutoff = new Date(now);
    if (period === "1 Month") cutoff.setMonth(cutoff.getMonth() - 1);
    if (period === "3 Months") cutoff.setMonth(cutoff.getMonth() - 3);
    if (period === "6 Months") cutoff.setMonth(cutoff.getMonth() - 6);
    if (period === "1 Year") cutoff.setFullYear(cutoff.getFullYear() - 1);

    return cutoff;
}

export function AdminAllOpportunitiesPage() {
    const [opportunities, setOpportunities] = useState<OpportunityCard[]>([]);
    const [statusFilter, setStatusFilter] = useState<FilterStatus>("All");
    const [periodFilter, setPeriodFilter] = useState<FilterPeriod>("All");
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [
        mailWorkspaceOpportunityId,
        setMailWorkspaceOpportunityId,
    ] = useState<string | null>(null);
    const [extendOpportunity, setExtendOpportunity] = useState<OpportunityCard | null>(null);
    const [newDeadline, setNewDeadline] = useState("");

    useEffect(() => {
        void load();
    }, []);

    async function load() {
        setLoading(true);
        try {
            const cardsData = (await adminOpportunityService.getOpportunityCards()) as OpportunityCard[];
            setOpportunities(cardsData || []);
        } finally {
            setLoading(false);
        }
    }

    const filteredOpportunities = useMemo(() => {
        const searchText = search.trim().toLowerCase();
        const cutoff = parsePeriodToCutoff(periodFilter);

        return (opportunities || []).filter((opp) => {
            const status = opp.application_status || "";
            const company = (opp.company || "").toLowerCase();
            const title = (opp.opportunity_title || "").toLowerCase();
            const createdAt = opp.created_at ? new Date(opp.created_at) : null;

            const searchMatch =
                !searchText ||
                company.includes(searchText) ||
                title.includes(searchText);

            const statusMatch =
                statusFilter === "All" ||
                (statusFilter === "Open" && status === "Open") ||
                (statusFilter === "Closed" && status !== "Open");

            const periodMatch =
                !cutoff || (createdAt ? createdAt >= cutoff : true);

            return searchMatch && statusMatch && periodMatch;
        });
    }, [opportunities, search, statusFilter, periodFilter]);

    async function handleExtendDeadline() {
        if (!extendOpportunity) return;
        if (!newDeadline) return;

        await adminOpportunityService.extendDeadline(
            extendOpportunity.opportunity_id,
            new Date(newDeadline).toISOString()
        );

        setExtendOpportunity(null);
        setNewDeadline("");
        await load();
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="mx-auto max-w-7xl px-6 py-8">
                <h1 className="text-3xl font-bold">All Opportunities</h1>

                <div className="mt-5 flex flex-wrap gap-3">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
                        className="rounded border px-3 py-2"
                    >
                        <option value="All">All</option>
                        <option value="Open">Open</option>
                        <option value="Closed">Closed</option>
                    </select>

                    <select
                        value={periodFilter}
                        onChange={(e) => setPeriodFilter(e.target.value as FilterPeriod)}
                        className="rounded border px-3 py-2"
                    >
                        <option value="All">All</option>
                        <option value="1 Month">1 Month</option>
                        <option value="3 Months">3 Months</option>
                        <option value="6 Months">6 Months</option>
                        <option value="1 Year">1 Year</option>
                    </select>

                    <input
                        type="text"
                        placeholder="Search company or opportunity..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="min-w-[260px] rounded border px-3 py-2"
                    />
                </div>

                {loading ? (
                    <div className="mt-10 rounded border p-6">Loading...</div>
                ) : (
                    <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {filteredOpportunities.map((opportunity) => (
                            <div
                                key={opportunity.opportunity_id}
                                className="rounded-xl border bg-background p-5 shadow-sm"
                            >
                                <h2 className="text-xl font-semibold">
                                    {opportunity.company}
                                </h2>

                                <p className="mt-1">{opportunity.opportunity_title}</p>

                                <div className="mt-5 space-y-2 text-sm">
                                    <p>
                                        Role:{" "}
                                        {opportunity.drive_master?.drive_name}
                                    </p>

                                    <p>
                                        Eligible Candidates:{" "}
                                        <b>{opportunity.eligibleCount ?? 0}</b>
                                    </p>

                                    <p>
                                        Applied Students:{" "}
                                        <b>{opportunity.appliedCount ?? 0}</b>
                                    </p>

                                    <p>
                                        Not Applied:{" "}
                                        <b>{opportunity.unappliedCount ?? 0}</b>
                                    </p>

                                    <p>
                                        Deadline:{" "}
                                        {opportunity.deadline
                                            ? new Date(opportunity.deadline).toLocaleString()
                                            : "-"}
                                    </p>

                                    <p className="font-semibold text-red-600">
                                        {getTimeLeft(opportunity.deadline)}
                                    </p>
                                </div>

                                <div className="mt-5 flex flex-wrap gap-3">
                                    <Link
                                        to="/admin/opportunities/$opportunityId"
                                        params={{ opportunityId: opportunity.opportunity_id }}
                                        className="inline-block rounded-lg border px-4 py-2"
                                    >
                                        View Applicants
                                    </Link>

                                    <button
                                        type="button"
                                        className="rounded-lg border px-4 py-2"
                                        onClick={() => {
                                            setExtendOpportunity(opportunity);
                                            setNewDeadline(
                                                opportunity.deadline
                                                    ? opportunity.deadline.slice(0, 16)
                                                    : ""
                                            );
                                        }}
                                    >
                                        Extend Application
                                    </button>

                                    <button
                                        type="button"
                                        className="rounded-lg border px-4 py-2"
                                        onClick={() =>
                                            setMailWorkspaceOpportunityId(
                                                opportunity.opportunity_id
                                            )
                                        }
                                    >
                                        Mail Workspace
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
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
            {extendOpportunity && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/40">
                    <div className="w-96 space-y-4 rounded-lg bg-white p-6">
                        <h2 className="text-lg font-bold">Extend Deadline</h2>

                        <input
                            type="datetime-local"
                            className="w-full rounded border px-3 py-2"
                            value={newDeadline}
                            onChange={(e) => setNewDeadline(e.target.value)}
                        />

                        <div className="flex gap-3">
                            <button
                                type="button"
                                className="rounded border px-4 py-2"
                                onClick={handleExtendDeadline}
                            >
                                Save
                            </button>

                            <button
                                type="button"
                                className="rounded border px-4 py-2"
                                onClick={() => {
                                    setExtendOpportunity(null);
                                    setNewDeadline("");
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
