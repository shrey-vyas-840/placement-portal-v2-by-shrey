import { Link } from "@tanstack/react-router";
import {
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";

import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    Cell,
} from "recharts";

import {
    adminDashboardAnalyticsService,
    type DashboardSnapshot,
    type DriveBranchDistributionPoint,
    type DriveTrendPoint,
    type OpportunityPipelineReport,
    type RecentActivityItem,
    type StudentDrilldownReport,
} from "@/services/adminDashboardAnalyticsService";

type DashboardMetrics = DashboardSnapshot["kpis"];

type NavItem = {
    to: string;
    label: string;
    description: string;
    badge?: string;
};

const NAV_ITEMS: NavItem[] = [
    {
        to: "/admin",
        label: "Dashboard",
        description: "Live overview and KPIs.",
        badge: "D",
    },
    {
        to: "/admin/students",
        label: "Students",
        description: "Search and manage students.",
        badge: "S",
    },
    {
        to: "/admin/companies",
        label: "Companies",
        description: "Company master records.",
        badge: "C",
    },
    {
        to: "/admin/drives",
        label: "Drives",
        description: "Drive lifecycle and eligibility.",
        badge: "Dr",
    },
    {
        to: "/admin/opportunities",
        label: "Opportunities",
        description: "Roles, questions and applicants.",
        badge: "O",
    },
    {
        to: "/admin/attendance",
        label: "Attendance",
        description: "Rounds, bulk marking and exports.",
        badge: "A",
    },
    {
        to: "/admin/noc",
        label: "NOC",
        description: "NOC workflow and approvals.",
        badge: "N",
    },
];

const CHART_COLORS = [
    "#1d4ed8",
    "#7c3aed",
    "#059669",
    "#f59e0b",
    "#ef4444",
    "#0891b2",
    "#0f766e",
    "#8b5cf6",
    "#475569",
    "#db2777",
];

const EMPTY_KPIS: DashboardMetrics = {
    totalStudents: 0,
    interestedStudents: 0,
    unplacedStudents: 0,
    placedStudents: 0,
    totalDrives: 0,
    totalApplications: 0,
    shortlistedApplications: 0,
    openOpportunities: 0,
    attendanceRecords: 0,
    attendancePresent: 0,
    attendanceAbsent: 0,
    attendanceRate: 0,
    placementRate: 0,
    applicationConversionRate: 0,
    opportunityUtilizationRate: 0,
};

function formatTimestamp(value: Date | null) {
    if (!value) return "Not refreshed yet";
    return new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(value);
}

function formatDateTime(value: string | null) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";

    return new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
}

function formatRelativeTime(value: string | null) {
    if (!value) return "just now";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "just now";

    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.max(1, Math.round(diffMs / 60000));

    if (diffMinutes < 60) return `${diffMinutes}m ago`;

    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.round(diffHours / 24);
    return `${diffDays}d ago`;
}

function percent(part: number, total: number) {
    if (!total) return 0;
    return Math.min(100, Math.round((part / total) * 100));
}

function formatNumber(value: number) {
    return new Intl.NumberFormat("en-IN").format(value);
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
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="text-sm text-muted-foreground">{title}</div>
            <div className="mt-2 text-3xl font-bold text-foreground">{value}</div>
            {subtitle ? (
                <div className="mt-2 text-xs text-muted-foreground">{subtitle}</div>
            ) : null}
        </div>
    );
}

function SmallStatCard({
    title,
    value,
    subtitle,
}: {
    title: string;
    value: number | string;
    subtitle?: string;
}) {
    return (
        <div className="rounded-2xl border border-border bg-background p-4 shadow-sm">
            <div className="text-xs text-muted-foreground">{title}</div>
            <div className="mt-1 text-2xl font-bold">{value}</div>
            {subtitle ? (
                <div className="mt-1 text-[11px] text-muted-foreground">{subtitle}</div>
            ) : null}
        </div>
    );
}

function ProgressRow({
    label,
    value,
    total,
    tone = "bg-primary",
}: {
    label: string;
    value: number;
    total: number;
    tone?: string;
}) {
    const pct = percent(value, total);

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{label}</span>
                <span className="text-muted-foreground">
                    {formatNumber(value)} / {formatNumber(total)} ({pct}%)
                </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className={`h-full ${tone}`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}

function SidebarLink({
    item,
    compact,
    onNavigate,
}: {
    item: NavItem;
    compact: boolean;
    onNavigate?: () => void;
}) {
    return (
        <Link
            to={item.to}
            onClick={onNavigate}
            className="group flex items-start gap-3 rounded-2xl border border-border px-3 py-3 transition hover:border-primary/40 hover:bg-muted/40"
            activeProps={{
                className: "border-primary bg-primary/10 text-foreground",
            }}
        >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-sm font-bold text-foreground">
                {item.badge}
            </div>

            {!compact ? (
                <div className="min-w-0">
                    <div className="font-semibold text-foreground">{item.label}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                        {item.description}
                    </div>
                </div>
            ) : null}
        </Link>
    );
}

function SectionCard({
    title,
    subtitle,
    right,
    children,
}: {
    title: string;
    subtitle?: string;
    right?: ReactNode;
    children: ReactNode;
}) {
    return (
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 className="text-lg font-semibold">{title}</h2>
                    {subtitle ? (
                        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
                    ) : null}
                </div>
                {right ? <div>{right}</div> : null}
            </div>
            <div className="mt-5">{children}</div>
        </section>
    );
}

function DonutChart({
    items,
    centerTitle,
    centerValue,
    emptyText = "No data available",
}: {
    items: Array<{ label: string; value: number; color?: string }>;
    centerTitle: string;
    centerValue: string;
    emptyText?: string;
}) {
    const validItems = items.filter((item) => item.value > 0);
    const total = validItems.reduce((sum, item) => sum + item.value, 0);

    if (!total) {
        return (
            <div className="rounded-2xl border border-dashed border-border bg-background p-6 text-sm text-muted-foreground">
                {emptyText}
            </div>
        );
    }

    let cursor = 0;
    const segments = validItems.map((item, index) => {
        const share = (item.value / total) * 100;
        const start = cursor;
        const end = cursor + share;
        cursor = end;

        const color = item.color ?? CHART_COLORS[index % CHART_COLORS.length];
        return `${color} ${start}% ${end}%`;
    });

    return (
        <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-center">
            <div className="flex justify-center">
                <div className="relative h-64 w-64">
                    <div
                        className="h-full w-full rounded-full"
                        style={{ background: `conic-gradient(${segments.join(", ")})` }}
                    />
                    <div className="absolute inset-[18%] rounded-full bg-card shadow-inner" />
                    <div className="absolute inset-0 flex items-center justify-center p-8 text-center">
                        <div>
                            <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                                {centerTitle}
                            </div>
                            <div className="mt-2 text-2xl font-bold">{centerValue}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                {validItems.map((item, index) => {
                    const color = item.color ?? CHART_COLORS[index % CHART_COLORS.length];
                    const itemPct = percent(item.value, total);
                    return (
                        <div
                            key={item.label}
                            className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background px-4 py-3"
                        >
                            <div className="flex items-center gap-3">
                                <span
                                    className="h-3 w-3 rounded-full"
                                    style={{ backgroundColor: color }}
                                />
                                <div>
                                    <div className="font-medium">{item.label}</div>
                                    <div className="text-xs text-muted-foreground">
                                        {formatNumber(item.value)} students
                                    </div>
                                </div>
                            </div>
                            <div className="text-sm font-semibold text-muted-foreground">
                                {itemPct}%
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function StatusChip({
    label,
    value,
    tone = "border-border bg-background text-foreground",
}: {
    label: string;
    value: string | number;
    tone?: string;
}) {
    return (
        <div className={`rounded-full border px-3 py-1 text-xs font-medium ${tone}`}>
            {label}: {value}
        </div>
    );
}

function ActivityBadge({ type }: { type: RecentActivityItem["type"] }) {
    const label =
        type === "APPLICATION"
            ? "Ap"
            : type === "ATTENDANCE"
                ? "At"
                : type === "DRIVE"
                    ? "Dr"
                    : type === "OPPORTUNITY"
                        ? "Op"
                        : type === "ROUND"
                            ? "Rn"
                            : "N";

    return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-xs font-bold text-foreground">
            {label}
        </div>
    );
}

export function AdminDashboardPage() {
    const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [selectedDriveId, setSelectedDriveId] = useState<string | null>(null);
    const [studentSearchValue, setStudentSearchValue] = useState("");
    const [activeEnrollmentNo, setActiveEnrollmentNo] = useState("");
    const [activityFilter, setActivityFilter] = useState("ALL");

    const loadDashboard = async (silent = false) => {
        if (silent) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        try {
            const data = await adminDashboardAnalyticsService.getDashboardSnapshot({
                selectedDriveId: selectedDriveId ?? undefined,
                enrollmentNo: activeEnrollmentNo.trim() || undefined,
                driveTrendLimit: 10,
                recentActivityLimit: 15,
            });

            setSnapshot(data);
            setLastRefreshedAt(new Date());
            setError(null);

            if (!selectedDriveId) {
                const firstDriveId = data.driveTrend[0]?.drive_id ?? null;
                if (firstDriveId) {
                    setSelectedDriveId(firstDriveId);
                }
            } else if (
                data.driveTrend.length > 0 &&
                !data.driveTrend.some((item) => item.drive_id === selectedDriveId)
            ) {
                setSelectedDriveId(data.driveTrend[0]?.drive_id ?? null);
            }
        } catch (err) {
            console.error(err);
            setError("Failed to load dashboard analytics.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        void loadDashboard(false);

        const timer = window.setInterval(() => {
            void loadDashboard(true);
        }, 60000);

        return () => window.clearInterval(timer);
        // selectedDriveId and activeEnrollmentNo intentionally omitted from the interval lifecycle
        // so that the refresh cadence stays stable while changes are handled by effect re-runs.
    }, [selectedDriveId, activeEnrollmentNo]);

    const kpis = snapshot?.kpis ?? EMPTY_KPIS;
    const driveTrend = snapshot?.driveTrend ?? [];
    const selectedDrive = useMemo(() => {
        if (!driveTrend.length) return null;
        return driveTrend.find((item) => item.drive_id === selectedDriveId) ?? driveTrend[0];
    }, [driveTrend, selectedDriveId]);

    const selectedDriveAnalyticsReady =
        Boolean(selectedDrive) && snapshot?.selectedDriveId === selectedDrive?.drive_id;

    const branchDistribution: DriveBranchDistributionPoint[] =
        selectedDriveAnalyticsReady && snapshot?.branchDistribution
            ? snapshot.branchDistribution
            : [];

    const pipeline: OpportunityPipelineReport | null =
        selectedDriveAnalyticsReady ? snapshot?.pipeline ?? null : null;

    const studentReport: StudentDrilldownReport | null = snapshot?.studentDrilldown ?? null;

    const filteredActivity =
        (snapshot?.recentActivity ?? []).filter(
            (item) =>
                activityFilter === "ALL"
                    ? true
                    : item.type === activityFilter
        );

    const studentPieData = useMemo(() => {
        if (studentReport) {
            return [
                { label: "Registered Drives", value: studentReport.registered_drives },
                { label: "Present Drives", value: studentReport.present_drives },
                { label: "Absent Drives", value: studentReport.absent_drives },
                { label: "Unregistered Drives", value: studentReport.unregistered_drives },
            ];
        }

        if (pipeline) {
            const registered = pipeline.registered_students;
            const present = pipeline.present_students;
            const absent = Math.max(registered - present, 0);
            const unregistered = pipeline.eligible_students != null
                ? Math.max(pipeline.eligible_students - registered, 0)
                : 0;

            return [
                { label: "Registered", value: registered },
                { label: "Present", value: present },
                { label: "Absent", value: absent },
                { label: "Unregistered", value: unregistered },
            ].filter((item) => item.value > 0 || pipeline.registered_students > 0);
        }

        return [];
    }, [pipeline, studentReport]);

    const studentStatusData = useMemo(() => {

        if (!studentReport) return [];

        return [
            {
                label: "Applied",
                value: studentReport.applications_count,
            },
            {
                label: "Shortlisted",
                value: studentReport.shortlisted_count,
            },
            {
                label: "Selected",
                value: studentReport.selected_count,
            },
        ];

    }, [studentReport]);

    const selectedDriveLabel = selectedDrive
        ? `${selectedDrive?.drive_name}${selectedDrive?.company_name ? ` • ${selectedDrive?.company_name}` : ""}`
        : "Click a bar to select a drive";

    const trendMax = Math.max(...driveTrend.map((item) => item.registered_students), 1);
    const refreshLabel = loading
        ? "Loading..."
        : refreshing
            ? "Refreshing..."
            : lastRefreshedAt
                ? `Last updated ${formatTimestamp(lastRefreshedAt)}`
                : "Ready";

    const driveTrendFallback = driveTrend.length === 0;
    const eligibleStudents = pipeline?.eligible_students ?? null;
    const registrationBase = eligibleStudents ?? pipeline?.registered_students ?? 0;
    const eligibleGap = eligibleStudents != null
        ? Math.max(eligibleStudents - (pipeline?.registered_students ?? 0), 0)
        : null;

    return (
        <div className="min-h-screen bg-background text-foreground lg:flex">
            {sidebarOpen ? (
                <button
                    type="button"
                    aria-label="Close menu overlay"
                    onClick={() => setSidebarOpen(false)}
                    className="fixed inset-0 z-30 bg-black/40 lg:hidden"
                />
            ) : null}

            <aside
                className={[
                    "fixed inset-y-0 left-0 z-40 flex w-80 flex-col border-r border-border bg-card p-4 shadow-xl transition-transform duration-200 lg:relative lg:z-0 lg:h-auto lg:translate-x-0 lg:shadow-none",
                    sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
                    sidebarCollapsed ? "lg:w-24" : "lg:w-80",
                ].join(" ")}
            >
                <div className="flex items-center justify-between gap-3">
                    {!sidebarCollapsed ? (
                        <div>
                            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                                Placement Portal
                            </div>
                            <div className="mt-1 text-lg font-bold">Admin Control Center</div>
                        </div>
                    ) : (
                        <div className="text-lg font-bold">AP</div>
                    )}

                    <button
                        type="button"
                        onClick={() => setSidebarCollapsed((current) => !current)}
                        className="hidden rounded-xl border border-border px-3 py-2 text-sm font-medium lg:inline-flex"
                        title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        {sidebarCollapsed ? "⟶" : "⟵"}
                    </button>

                    <button
                        type="button"
                        onClick={() => setSidebarOpen(false)}
                        className="rounded-xl border border-border px-3 py-2 text-sm font-medium lg:hidden"
                    >
                        Close
                    </button>
                </div>

                <div className="mt-6 space-y-3 overflow-auto pr-1">
                    {NAV_ITEMS.map((item) => (
                        <SidebarLink
                            key={item.to}
                            item={item}
                            compact={sidebarCollapsed}
                            onNavigate={() => setSidebarOpen(false)}
                        />
                    ))}
                </div>

                {!sidebarCollapsed ? (
                    <div className="mt-auto rounded-2xl border border-border bg-background p-4">
                        <div className="text-sm font-semibold">Auto Refresh</div>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Analytics refresh every 60 seconds.
                        </p>
                        <button
                            type="button"
                            onClick={() => void loadDashboard(true)}
                            className="mt-3 rounded-xl border border-border px-3 py-2 text-sm font-medium"
                        >
                            Refresh now
                        </button>
                    </div>
                ) : null}
            </aside>

            <div className="flex-1">
                <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
                    <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setSidebarOpen(true)}
                                className="rounded-xl border border-border px-3 py-2 text-sm font-medium lg:hidden"
                            >
                                ☰ Menu
                            </button>

                            <div>
                                <h1 className="text-xl font-bold sm:text-2xl">Admin Dashboard</h1>
                                <p className="text-xs text-muted-foreground">{refreshLabel}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => void loadDashboard(true)}
                                className="rounded-xl border border-border px-4 py-2 text-sm font-medium"
                            >
                                Refresh
                            </button>
                        </div>
                    </div>
                </header>

                <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                    {error ? (
                        <div className="mb-5 rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
                            {error}
                        </div>
                    ) : null}

                    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <MetricCard title="Total Students" value={formatNumber(kpis.totalStudents)} subtitle="Registered in the portal" />
                        <MetricCard title="Interested" value={formatNumber(kpis.interestedStudents)} subtitle="Students marked interested" />
                        <MetricCard title="Applications" value={formatNumber(kpis.totalApplications)} subtitle="All opportunity applications" />
                        <MetricCard title="Shortlisted" value={formatNumber(kpis.shortlistedApplications)} subtitle="Applications moved forward" />
                        <MetricCard title="Drives" value={formatNumber(kpis.totalDrives)} subtitle="Active drive records" />
                        <MetricCard title="Open Opportunities" value={formatNumber(kpis.openOpportunities)} subtitle="Currently open roles" />
                        <MetricCard title="Attendance Records" value={formatNumber(kpis.attendanceRecords)} subtitle="Attendance rows captured" />
                        <MetricCard title="Attendance %" value={`${kpis.attendanceRate}%`} subtitle="Present / participated" />
                    </section>

                    <SectionCard
                        title="Campus Drive Registration Trend"
                        subtitle="Last 10 drives. Click any bar to update the analytics below."
                        right={
                            <StatusChip
                                label="Selected Drive"
                                value={selectedDrive?.drive_name ?? "-"}
                                tone="border-border bg-background text-foreground"
                            />
                        }
                    >

                        <SectionCard
                            title="Admin Insights"
                            subtitle="Automatically generated from live dashboard data"
                        >
                            <div className="grid gap-4 md:grid-cols-4">

                                <SmallStatCard
                                    title="Most Active Drive"
                                    value={
                                        driveTrend.sort(
                                            (a, b) =>
                                                b.registered_students -
                                                a.registered_students
                                        )[0]?.drive_name ?? "-"
                                    }
                                />

                                <SmallStatCard
                                    title="Highest Attendance"
                                    value={
                                        driveTrend.sort(
                                            (a, b) =>
                                                b.present_students -
                                                a.present_students
                                        )[0]?.drive_name ?? "-"
                                    }
                                />

                                <SmallStatCard
                                    title="Highest Selection"
                                    value={
                                        driveTrend.sort(
                                            (a, b) =>
                                                b.selected_students -
                                                a.selected_students
                                        )[0]?.drive_name ?? "-"
                                    }
                                />

                                <SmallStatCard
                                    title="Total Drives"
                                    value={driveTrend.length}
                                />

                            </div>
                        </SectionCard>
                        
                        {driveTrendFallback ? (
                            <div className="rounded-2xl border border-dashed border-border bg-background p-6 text-sm text-muted-foreground">
                                No drive trend data found yet.
                            </div>
                        ) : (
                            <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                                <div className="space-y-4">

                                    <div className="h-[500px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart
                                                data={driveTrend}
                                                layout="vertical"
                                                margin={{
                                                    top: 10,
                                                    right: 20,
                                                    left: 20,
                                                    bottom: 10,
                                                }}
                                            >
                                                <XAxis
                                                    type="number"
                                                    allowDecimals={false}
                                                />

                                                <YAxis
                                                    type="category"
                                                    dataKey="drive_name"
                                                    width={140}
                                                />

                                                <Tooltip />

                                                <Bar
                                                    dataKey="registered_students"
                                                    radius={[0, 6, 6, 0]}
                                                    onClick={(data) => {
                                                        if (data?.drive_id) {
                                                            setSelectedDriveId(data.drive_id);
                                                        }
                                                    }}
                                                >
                                                    {driveTrend.map((entry) => (
                                                        <Cell
                                                            key={entry.drive_id}
                                                            fill={
                                                                entry.drive_id === selectedDrive?.drive_id
                                                                    ? "#2563eb"
                                                                    : "#94a3b8"
                                                            }
                                                        />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>

                                </div>


                                {selectedDrive ? (
                                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                        <SmallStatCard title="Registrations" value={formatNumber(selectedDrive?.registered_students)} subtitle="Unique student registrations" />
                                        <SmallStatCard title="Applications" value={formatNumber(selectedDrive?.application_count)} subtitle="Across all opportunities" />
                                        <SmallStatCard title="Present" value={formatNumber(selectedDrive?.present_students)} subtitle="Attendance marked present" />
                                        <SmallStatCard title="Selected" value={formatNumber(selectedDrive?.selected_students)} subtitle="Students moved forward" />
                                    </div>
                                ) : (
                                    <div className="mt-4 rounded-2xl border border-dashed border-border bg-muted/20 p-5 text-sm text-muted-foreground">
                                        Select a drive bar to see its detailed analytics.
                                    </div>
                                )}

                                <div className="rounded-2xl border border-border bg-background p-4">
                                    <h3 className="font-semibold mb-4">
                                        Drive Comparison
                                    </h3>

                                    <div className="space-y-3">

                                        <SmallStatCard
                                            title="Registrations"
                                            value={selectedDrive?.registered_students ?? 0}
                                            subtitle={`Average ${Math.round(
                                                driveTrend.reduce(
                                                    (s, d) => s + d.registered_students,
                                                    0
                                                ) / Math.max(driveTrend.length, 1)
                                            )}`}
                                        />

                                        <SmallStatCard
                                            title="Applications"
                                            value={selectedDrive?.application_count ?? 0}
                                        />

                                        <SmallStatCard
                                            title="Present"
                                            value={selectedDrive?.present_students ?? 0}
                                        />

                                        <SmallStatCard
                                            title="Selected"
                                            value={selectedDrive?.selected_students ?? 0}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </SectionCard>

                    <section className="mt-6 grid gap-6 xl:grid-cols-3">
                        <SectionCard
                            title="Drive Analytics"
                            subtitle="Branch distribution for the selected drive."
                            right={
                                <StatusChip
                                    label="Drive"
                                    value={selectedDrive?.drive_name ?? "-"}
                                />
                            }
                        >
                            {selectedDriveAnalyticsReady ? (
                                <div className="space-y-5">
                                    <DonutChart
                                        items={branchDistribution.map((item) => ({
                                            label: item.branch_name,
                                            value: item.student_count,
                                        }))}
                                        centerTitle="Branches"
                                        centerValue={selectedDrive?.drive_name ?? "Selected drive"}
                                        emptyText="No branch distribution available for the selected drive."
                                    />

                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <SmallStatCard
                                            title="Eligible Students"
                                            value={eligibleStudents != null ? formatNumber(eligibleStudents) : "N/A"}
                                            subtitle="From drive eligibility"
                                        />
                                        <SmallStatCard
                                            title="Eligibility Gap"
                                            value={eligibleGap != null ? formatNumber(eligibleGap) : "N/A"}
                                            subtitle="Eligible minus registered"
                                        />
                                        <SmallStatCard
                                            title="Opportunity Count"
                                            value={formatNumber(selectedDrive?.opportunity_count ?? 0)}
                                            subtitle="Opportunities inside the drive"
                                        />
                                        <SmallStatCard
                                            title="Application Count"
                                            value={formatNumber(selectedDrive?.application_count ?? 0)}
                                            subtitle="Across all opportunities"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-2xl border border-dashed border-border bg-background p-6 text-sm text-muted-foreground">
                                    Choose a drive from the registration trend above to load branch analytics.
                                </div>
                            )}
                        </SectionCard>

                        <SectionCard
                            title="Opportunity Pipeline Analysis"
                            subtitle="Eligible → Registered → Present → Round Cleared → Shortlisted → Selected"
                        >
                            {pipeline ? (
                                <div className="space-y-4">
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <SmallStatCard
                                            title="Eligible Students"
                                            value={formatNumber(pipeline.eligible_students ?? pipeline.registered_students)}
                                            subtitle="From drive eligibility"
                                        />
                                        <SmallStatCard
                                            title="Registered"
                                            value={formatNumber(pipeline.registered_students)}
                                            subtitle="Unique registrations"
                                        />
                                        <SmallStatCard
                                            title="Present"
                                            value={formatNumber(pipeline.present_students)}
                                            subtitle="Attendance present"
                                        />
                                        <SmallStatCard
                                            title="Shortlisted"
                                            value={formatNumber(pipeline.shortlisted_students)}
                                            subtitle="Moved to shortlist"
                                        />
                                    </div>

                                    <div className="space-y-4 rounded-2xl border border-border bg-background p-4">
                                        <ProgressRow
                                            label="Eligible Students"
                                            value={pipeline.eligible_students ?? pipeline.registered_students}
                                            total={Math.max(registrationBase, 1)}
                                            tone="bg-slate-700"
                                        />
                                        <ProgressRow
                                            label="Registered"
                                            value={pipeline.registered_students}
                                            total={Math.max(registrationBase, 1)}
                                            tone="bg-blue-600"
                                        />
                                        <ProgressRow
                                            label="Present"
                                            value={pipeline.present_students}
                                            total={Math.max(Math.max(pipeline.registered_students, 1), registrationBase)}
                                            tone="bg-emerald-600"
                                        />
                                        <ProgressRow
                                            label="Round Cleared"
                                            value={pipeline.round_cleared_students}
                                            total={Math.max(Math.max(pipeline.registered_students, 1), registrationBase)}
                                            tone="bg-violet-600"
                                        />
                                        <ProgressRow
                                            label="Shortlisted"
                                            value={pipeline.shortlisted_students}
                                            total={Math.max(
                                                Math.max(pipeline.registered_students, 1),
                                                registrationBase
                                            )}
                                            tone="bg-indigo-600"
                                        />
                                        <ProgressRow
                                            label="Selected"
                                            value={pipeline.selected_students}
                                            total={Math.max(Math.max(pipeline.registered_students, 1), registrationBase)}
                                            tone="bg-amber-500"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-2xl border border-dashed border-border bg-background p-6 text-sm text-muted-foreground">
                                    Select a drive to see the pipeline for that opportunity set.
                                </div>
                            )}
                        </SectionCard>

                        <SectionCard
                            title="Opportunity Probability Widget"
                            subtitle="Live ratios showing registration, attendance, shortlisting and selection chances."
                        >
                            {pipeline ? (
                                <div className="space-y-4">
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <MetricCard
                                            title="Registration Rate"
                                            value={`${pipeline.registration_rate}%`}
                                            subtitle="Registered / eligible"
                                        />
                                        <MetricCard
                                            title="Attendance Rate"
                                            value={`${pipeline.attendance_rate}%`}
                                            subtitle="Present / registered"
                                        />
                                        <MetricCard
                                            title="Shortlisting Rate"
                                            value={`${pipeline.shortlisting_rate}%`}
                                            subtitle="Shortlisted / registered"
                                        />
                                        <MetricCard
                                            title="Selection Rate"
                                            value={`${pipeline.selection_rate}%`}
                                            subtitle="Selected / registered"
                                        />
                                    </div>

                                    <div className="rounded-2xl border border-border bg-background p-4">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="font-medium">Pipeline Counts</span>
                                            <span className="text-muted-foreground">
                                                {pipeline.drive_name}
                                            </span>
                                        </div>
                                        <div className="mt-4 space-y-3 text-sm">
                                            <div className="flex items-center justify-between">
                                                <span>Eligible Students</span>
                                                <span className="font-semibold">
                                                    {formatNumber(pipeline.eligible_students ?? pipeline.registered_students)}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span>Registered</span>
                                                <span className="font-semibold">{formatNumber(pipeline.registered_students)}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span>Present</span>
                                                <span className="font-semibold">{formatNumber(pipeline.present_students)}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span>Shortlisted</span>
                                                <span className="font-semibold">{formatNumber(pipeline.shortlisted_students)}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span>Selected</span>
                                                <span className="font-semibold">{formatNumber(pipeline.selected_students)}</span>
                                            </div>
                                            <div className="flex items-center justify-between border-t border-border pt-3">
                                                <span>Success Index</span>
                                                <span className="font-semibold text-foreground">
                                                    {percent(
                                                        pipeline.selected_students,
                                                        Math.max(eligibleStudents ?? pipeline.registered_students, 1),
                                                    )}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-2xl border border-dashed border-border bg-background p-6 text-sm text-muted-foreground">
                                    Select a drive to calculate registration, attendance and selection probability.
                                </div>
                            )}
                        </SectionCard>
                    </section>

                    <section className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                        <SectionCard
                            title="Student Drilldown"
                            subtitle="Enter an enrollment number for a student-level participation pie. Leave blank to use the selected drive snapshot."
                            right={
                                <StatusChip
                                    label="Mode"
                                    value={activeEnrollmentNo.trim() ? "Student" : "Drive fallback"}
                                />
                            }
                        >
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    setActiveEnrollmentNo(studentSearchValue.trim());
                                }}
                                className="space-y-3"
                            >
                                <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
                                    <input
                                        value={studentSearchValue}
                                        onChange={(e) => setStudentSearchValue(e.target.value)}
                                        placeholder="IU2341230377"
                                        className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none ring-0 transition focus:border-primary"
                                    />
                                    <button
                                        type="submit"
                                        className="rounded-xl border border-border px-4 py-3 text-sm font-medium"
                                    >
                                        Load
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setStudentSearchValue("");
                                            setActiveEnrollmentNo("");
                                        }}
                                        className="rounded-xl border border-border px-4 py-3 text-sm font-medium"
                                    >
                                        Clear
                                    </button>
                                </div>

                                <div className="text-xs text-muted-foreground">
                                    If the field is empty, the chart below follows the currently selected drive.
                                </div>
                            </form>

                            <div className="mt-5">
                                {studentPieData.length ? (
                                    <div className="grid gap-6 lg:grid-cols-2">

                                        <DonutChart
                                            items={studentPieData.map((item, index) => ({
                                                label: item.label,
                                                value: item.value,
                                                color:
                                                    CHART_COLORS[
                                                    index %
                                                    CHART_COLORS.length
                                                    ],
                                            }))}
                                            centerTitle="Participation"
                                            centerValue={
                                                activeEnrollmentNo ||
                                                selectedDrive?.drive_name ||
                                                "-"
                                            }
                                        />

                                        <DonutChart
                                            items={studentStatusData.map((item, index) => ({
                                                label: item.label,
                                                value: item.value,
                                                color:
                                                    CHART_COLORS[
                                                    (index + 4) %
                                                    CHART_COLORS.length
                                                    ],
                                            }))}
                                            centerTitle="Status"
                                            centerValue="Applications"
                                        />

                                    </div>
                                ) : (
                                    <div className="rounded-2xl border border-dashed border-border bg-background p-6 text-sm text-muted-foreground">
                                        Search a student enrollment number or select a drive to render the pie chart.
                                    </div>
                                )}
                            </div>

                            {studentReport ? (
                                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                    <SmallStatCard title="Registered Drives" value={formatNumber(studentReport.registered_drives)} subtitle="Drive-wise participation" />
                                    <SmallStatCard title="Present Drives" value={formatNumber(studentReport.present_drives)} subtitle="Marked present" />
                                    <SmallStatCard title="Absent Drives" value={formatNumber(studentReport.absent_drives)} subtitle="Marked absent" />
                                    <SmallStatCard title="Attendance %" value={`${studentReport.attendance_percentage}%`} subtitle="Present / participated" />
                                </div>
                            ) : null}
                        </SectionCard>

                        <SectionCard
                            title="Recent Activity Feed"
                            subtitle="Live latest events across applications, attendance, drives, opportunities, rounds and NOC activity."
                            right={
                                <div className="flex gap-2 flex-wrap">
                                    <StatusChip
                                        label="Updated"
                                        value={refreshLabel}
                                    />
                                    {[
                                        "ALL",
                                        "APPLICATION",
                                        "ATTENDANCE",
                                        "DRIVE",
                                        "OPPORTUNITY",
                                        "NOC"
                                    ].map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => setActivityFilter(type)}
                                            className="rounded-lg border px-2 py-1 text-xs"
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            }
                        >
                            {snapshot?.recentActivity?.length ? (
                                <div className="space-y-3">
                                    {snapshot.recentActivity.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex items-start gap-3 rounded-2xl border border-border bg-background p-4"
                                        >
                                            <ActivityBadge type={item.type} />
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                    <div className="font-semibold">{item.title}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {formatRelativeTime(item.occurred_at)}
                                                    </div>
                                                </div>
                                                <div className="mt-1 text-sm text-muted-foreground">
                                                    {item.description}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="rounded-2xl border border-dashed border-border bg-background p-6 text-sm text-muted-foreground">
                                    No recent activity available yet.
                                </div>
                            )}
                        </SectionCard>
                    </section>

                    <div className="pb-6" />
                </main>
            </div>
        </div>
    );
}
