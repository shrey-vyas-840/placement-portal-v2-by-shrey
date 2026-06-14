import { useMemo } from "react";
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
} from "recharts";

import type { StudentDrilldownReport } from "@/services/adminDashboardAnalyticsService";

const CHART_COLORS = [
    "#1d4ed8",
    "#7c3aed",
    "#059669",
    "#f59e0b",
];

function formatNumber(value: number) {
    return new Intl.NumberFormat("en-IN").format(value);
}

function clampPercent(value: number) {
    if (Number.isNaN(value) || !Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(100, Math.round(value)));
}

function percent(part: number, total: number) {
    if (!total) return 0;
    return clampPercent((part / total) * 100);
}

function MetricCard({
    title,
    value,
    subtitle,
}: {
    title: string;
    value: number | string;
    subtitle?: string;
}) {
    return (
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
            <div className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                {title}
            </div>
            <div className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">
                {value}
            </div>
            {subtitle ? (
                <div className="mt-2 text-xs text-muted-foreground">
                    {subtitle}
                </div>
            ) : null}
        </div>
    );
}

function SectionCard({
    title,
    subtitle,
    children,
}: {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
}) {
    return (
        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h3 className="text-base font-semibold text-foreground sm:text-lg">
                        {title}
                    </h3>
                    {subtitle ? (
                        <p className="mt-1 text-sm text-muted-foreground">
                            {subtitle}
                        </p>
                    ) : null}
                </div>
            </div>
            <div className="mt-5">{children}</div>
        </section>
    );
}

function StatusPill({
    label,
    value,
}: {
    label: string;
    value: string | number;
}) {
    return (
        <div className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-foreground">
            {label}: {value}
        </div>
    );
}

function EmptyState({
    title,
    description,
}: {
    title: string;
    description: string;
}) {
    return (
        <div className="rounded-2xl border border-dashed border-border bg-background p-6 text-sm text-muted-foreground">
            <div className="font-medium text-foreground">{title}</div>
            <div className="mt-1">{description}</div>
        </div>
    );
}

function LoadingSkeleton() {
    return (
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="h-24 animate-pulse rounded-2xl border border-border bg-card" />
                <div className="h-24 animate-pulse rounded-2xl border border-border bg-card" />
                <div className="h-24 animate-pulse rounded-2xl border border-border bg-card" />
                <div className="h-24 animate-pulse rounded-2xl border border-border bg-card" />
            </div>
            <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
                <div className="h-[360px] animate-pulse rounded-2xl border border-border bg-card" />
                <div className="h-[360px] animate-pulse rounded-2xl border border-border bg-card" />
            </div>
        </div>
    );
}

export function StudentAnalyticsSection({
    report,
    loading,
}: {
    report: StudentDrilldownReport | null;
    loading?: boolean;
}) {
    const summary = useMemo(() => {
        if (!report) {
            return null;
        }

        const totalDrives =
            report.total_active_drives ??
            report.drive_breakdown.length;

        const eligibleDrives =
            report.eligible_drives ?? totalDrives;

        const registeredRate = percent(
            report.registered_drives,
            Math.max(eligibleDrives, 1)
        );

        const attendanceRateVsRegistered = percent(
            report.present_drives,
            Math.max(report.registered_drives, 1)
        );

        const selectionRate = percent(
            report.selected_count,
            Math.max(report.applications_count, 1)
        );

        const shortlistingRate = percent(
            report.shortlisted_count,
            Math.max(report.applications_count, 1)
        );

        const participationCoverage = percent(
            report.registered_drives,
            Math.max(totalDrives, 1)
        );

        return {
            totalDrives,
            eligibleDrives,
            registeredRate,
            attendanceRateVsRegistered,
            selectionRate,
            shortlistingRate,
            participationCoverage,
        };
    }, [report]);

    const pieData = useMemo(() => {
        if (!report) return [];

        return [
            { label: "Registered", value: report.registered_drives },
            { label: "Present", value: report.present_drives },
            { label: "Absent", value: report.absent_drives },
            { label: "Unregistered", value: report.unregistered_drives },
        ].filter((item) => item.value > 0 || report.registered_drives > 0);
    }, [report]);

    if (loading) {
        return <LoadingSkeleton />;
    }

    if (!report) {
        return (
            <EmptyState
                title="No analytics available"
                description="No student drilldown data is available for this account yet."
            />
        );
    }

    const totalDrives = summary?.totalDrives ?? report.drive_breakdown.length;

    return (
        <section className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                    title="Registered Drives"
                    value={formatNumber(report.registered_drives)}
                    subtitle="Drive-wise participation"
                />
                <MetricCard
                    title="Present Drives"
                    value={formatNumber(report.present_drives)}
                    subtitle="Marked present"
                />
                <MetricCard
                    title="Absent Drives"
                    value={formatNumber(report.absent_drives)}
                    subtitle="Marked absent"
                />
                <MetricCard
                    title="Attendance %"
                    value={`${clampPercent(report.attendance_percentage)}%`}
                    subtitle="Present / participated"
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <MetricCard
                    title="Total Drives"
                    value={formatNumber(totalDrives)}
                    subtitle="Active drives considered"
                />
                <MetricCard
                    title="Eligible Drives"
                    value={formatNumber(summary?.eligibleDrives ?? totalDrives)}
                    subtitle="Eligible for this student"
                />
                <MetricCard
                    title="Shortlisted"
                    value={formatNumber(report.shortlisted_count)}
                    subtitle="Pipeline progress"
                />
                <MetricCard
                    title="Selected"
                    value={formatNumber(report.selected_count)}
                    subtitle="Final selections"
                />
                <MetricCard
                    title="Applications"
                    value={formatNumber(report.applications_count)}
                    subtitle="All submitted applications"
                />
            </div>

            <SectionCard
                title="Student Analytics Overview"
                subtitle="All analytics below are restricted to the logged-in student only."
            >
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-border bg-background p-4">
                        <div className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
                            Participation Coverage
                        </div>
                        <div className="mt-2 text-2xl font-bold">
                            {summary?.participationCoverage ?? 0}%
                        </div>
                        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                            <div
                                className="h-full bg-primary"
                                style={{
                                    width: `${summary?.participationCoverage ?? 0}%`,
                                }}
                            />
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
                            Registered drives out of total active drives
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-background p-4">
                        <div className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
                            Registration Success
                        </div>
                        <div className="mt-2 text-2xl font-bold">
                            {summary?.registeredRate ?? 0}%
                        </div>
                        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                            <div
                                className="h-full bg-emerald-500"
                                style={{
                                    width: `${summary?.registeredRate ?? 0}%`,
                                }}
                            />
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
                            Registered drives against eligible drives
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-background p-4">
                        <div className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
                            Attendance Success
                        </div>
                        <div className="mt-2 text-2xl font-bold">
                            {summary?.attendanceRateVsRegistered ?? 0}%
                        </div>
                        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                            <div
                                className="h-full bg-violet-500"
                                style={{
                                    width: `${summary?.attendanceRateVsRegistered ?? 0}%`,
                                }}
                            />
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
                            Present drives against registered drives
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-background p-4">
                        <div className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
                            Shortlist / Selection
                        </div>
                        <div className="mt-2 text-2xl font-bold">
                            {summary?.shortlistingRate ?? 0}% / {summary?.selectionRate ?? 0}%
                        </div>
                        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                            <div
                                className="h-full bg-amber-500"
                                style={{
                                    width: `${summary?.selectionRate ?? 0}%`,
                                }}
                            />
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
                            Shortlisted and selected from all applications
                        </div>
                    </div>
                </div>
            </SectionCard>

            <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
                <SectionCard
                    title="Student Status"
                    subtitle="Drive participation breakdown"
                >
                    <div className="h-[320px] w-full">
                        {pieData.length ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        dataKey="value"
                                        nameKey="label"
                                        outerRadius={120}
                                        innerRadius={78}
                                        paddingAngle={3}
                                        stroke="transparent"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell
                                                key={entry.label}
                                                fill={CHART_COLORS[index % CHART_COLORS.length]}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: number) => formatNumber(value)} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-border text-sm text-muted-foreground">
                                No data to chart
                            </div>
                        )}
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                        <StatusPill label="Registered" value={report.registered_drives} />
                        <StatusPill label="Present" value={report.present_drives} />
                        <StatusPill label="Absent" value={report.absent_drives} />
                        <StatusPill label="Unregistered" value={report.unregistered_drives} />
                    </div>
                </SectionCard>

                <SectionCard
                    title="Participation History"
                    subtitle="Drive-by-drive breakdown for the logged-in student"
                >
                    <div className="hidden w-full overflow-x-auto md:block">
                        <table className="min-w-[1100px] w-full text-sm">
                            <thead className="border-b border-border bg-muted/20 text-left text-xs uppercase tracking-[0.08em] text-muted-foreground">
                                <tr>
                                    <th className="px-3 py-3">Drive</th>
                                    <th className="px-3 py-3">Company</th>
                                    <th className="px-3 py-3">Status</th>
                                    <th className="px-3 py-3">Applications</th>
                                    <th className="px-3 py-3">Eligible</th>
                                    <th className="px-3 py-3">Registered</th>
                                    <th className="px-3 py-3">Present</th>
                                    <th className="px-3 py-3">Shortlisted</th>
                                    <th className="px-3 py-3">Selected</th>
                                </tr>
                            </thead>

                            <tbody>
                                {report.drive_breakdown.map((row) => (
                                    <tr
                                        key={row.drive_id}
                                        className="border-b border-border last:border-b-0"
                                    >
                                        <td className="px-3 py-3 font-medium text-foreground">
                                            {row.drive_name}
                                        </td>
                                        <td className="px-3 py-3 text-muted-foreground">
                                            {row.company_name ?? "-"}
                                        </td>
                                        <td className="px-3 py-3">
                                            <span className="rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium">
                                                {row.status}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3">
                                            {formatNumber(row.application_count)}
                                        </td>
                                        <td className="px-3 py-3">
                                            {row.eligible ? "Yes" : "No"}
                                        </td>
                                        <td className="px-3 py-3">
                                            {row.registered ? "Yes" : "No"}
                                        </td>
                                        <td className="px-3 py-3">
                                            {row.present ? "Yes" : "No"}
                                        </td>
                                        <td className="px-3 py-3">
                                            {row.shortlisted ? "Yes" : "No"}
                                        </td>
                                        <td className="px-3 py-3">
                                            {row.selected ? "Yes" : "No"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="grid gap-3 md:hidden">
                        {report.drive_breakdown.map((row) => (
                            <div
                                key={row.drive_id}
                                className="rounded-2xl border border-border bg-background p-4"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="font-semibold text-foreground">
                                            {row.drive_name}
                                        </div>
                                        <div className="mt-1 text-xs text-muted-foreground">
                                            {row.company_name ?? "-"}
                                        </div>
                                    </div>
                                    <span className="rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium">
                                        {row.status}
                                    </span>
                                </div>

                                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <div className="text-xs text-muted-foreground">Applications</div>
                                        <div className="font-medium">{formatNumber(row.application_count)}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-muted-foreground">Eligible</div>
                                        <div className="font-medium">{row.eligible ? "Yes" : "No"}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-muted-foreground">Registered</div>
                                        <div className="font-medium">{row.registered ? "Yes" : "No"}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-muted-foreground">Present</div>
                                        <div className="font-medium">{row.present ? "Yes" : "No"}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-muted-foreground">Shortlisted</div>
                                        <div className="font-medium">{row.shortlisted ? "Yes" : "No"}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-muted-foreground">Selected</div>
                                        <div className="font-medium">{row.selected ? "Yes" : "No"}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </SectionCard>
            </div>
        </section>
    );
}