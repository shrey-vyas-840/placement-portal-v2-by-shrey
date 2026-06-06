import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { adminStudentService } from "@/services/adminStudentService";

type DashboardMetrics = {
  totalStudents: number;
  interestedStudents: number;
  unplacedStudents: number;
  placedStudents: number;
  totalDrives: number;
  totalApplications: number;
  shortlistedApplications: number;
  openOpportunities: number;
  attendanceRecords: number;
};

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

function formatTimestamp(value: Date | null) {
  if (!value) return "Not refreshed yet";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function percent(part: number, total: number) {
  if (!total) return 0;
  return Math.min(100, Math.round((part / total) * 100));
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
          {value} / {total} ({pct}%)
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

export function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalStudents: 0,
    interestedStudents: 0,
    unplacedStudents: 0,
    placedStudents: 0,
    totalDrives: 0,
    totalApplications: 0,
    shortlistedApplications: 0,
    openOpportunities: 0,
    attendanceRecords: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const loadDashboard = async (silent = false) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const data = await adminStudentService.getDashboardMetrics();
      setMetrics(data);
      setLastRefreshedAt(new Date());
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load dashboard data.");
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
  }, []);

  const derived = useMemo(() => {
    const placementRate = percent(metrics.placedStudents, metrics.totalStudents);
    const interestRate = percent(metrics.interestedStudents, metrics.totalStudents);
    const applicationConversion = percent(
      metrics.shortlistedApplications,
      Math.max(metrics.totalApplications, 1),
    );
    const opportunityUtilization = percent(
      metrics.openOpportunities,
      Math.max(metrics.totalDrives, 1),
    );

    return {
      placementRate,
      interestRate,
      applicationConversion,
      opportunityUtilization,
      completionRows: [
        {
          label: "Registered Students",
          value: metrics.totalStudents,
          total: Math.max(metrics.totalStudents, 1),
          tone: "bg-slate-700",
        },
        {
          label: "Interested Students",
          value: metrics.interestedStudents,
          total: Math.max(metrics.totalStudents, 1),
          tone: "bg-slate-600",
        },
        {
          label: "Applications",
          value: metrics.totalApplications,
          total: Math.max(metrics.totalApplications, metrics.totalStudents, 1),
          tone: "bg-blue-600",
        },
        {
          label: "Shortlisted Applications",
          value: metrics.shortlistedApplications,
          total: Math.max(metrics.totalApplications, 1),
          tone: "bg-emerald-600",
        },
        {
          label: "Placed Students",
          value: metrics.placedStudents,
          total: Math.max(metrics.totalStudents, 1),
          tone: "bg-violet-600",
        },
      ],
    };
  }, [metrics]);

  const quickActions = [
    { to: "/admin/students", label: "Student Viewer" },
    { to: "/admin/companies", label: "Companies" },
    { to: "/admin/drives", label: "Drives" },
    { to: "/admin/opportunities", label: "Opportunities" },
    { to: "/admin/attendance", label: "Attendance" },
    { to: "/admin/noc", label: "NOC Dashboard" },
  ];

  const refreshLabel = loading
    ? "Loading..."
    : refreshing
      ? "Refreshing..."
      : lastRefreshedAt
        ? `Last updated ${formatTimestamp(lastRefreshedAt)}`
        : "Ready";

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
              <div className="mt-1 text-lg font-bold">
                Admin Control Center
              </div>
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
              Metrics refresh every 60 seconds.
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
            <MetricCard
              title="Total Students"
              value={metrics.totalStudents}
              subtitle="Registered in the portal"
            />
            <MetricCard
              title="Interested"
              value={metrics.interestedStudents}
              subtitle="Students marked interested"
            />
            <MetricCard
              title="Applications"
              value={metrics.totalApplications}
              subtitle="All opportunity applications"
            />
            <MetricCard
              title="Shortlisted"
              value={metrics.shortlistedApplications}
              subtitle="Applications moved forward"
            />
            <MetricCard
              title="Placed"
              value={metrics.placedStudents}
              subtitle="Students marked placed"
            />
            <MetricCard
              title="Drives"
              value={metrics.totalDrives}
              subtitle="Active drive records"
            />
            <MetricCard
              title="Open Opportunities"
              value={metrics.openOpportunities}
              subtitle="Currently open roles"
            />
            <MetricCard
              title="Attendance Records"
              value={metrics.attendanceRecords}
              subtitle="Attendance rows captured"
            />
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Placement Journey</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    A live, high-level view of student movement through the placement pipeline.
                  </p>
                </div>
                <div className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium">
                  Auto-refresh on
                </div>
              </div>

              <div className="mt-5 space-y-5">
                {derived.completionRows.map((row) => (
                  <ProgressRow
                    key={row.label}
                    label={row.label}
                    value={row.value}
                    total={row.total}
                    tone={row.tone}
                  />
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <h2 className="text-lg font-semibold">Health Snapshot</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Percentages that help placement staff quickly spot momentum.
              </p>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <MetricCard
                  title="Placement Rate"
                  value={`${derived.placementRate}%`}
                  subtitle="Placed / total students"
                />
                <MetricCard
                  title="Interest Rate"
                  value={`${derived.interestRate}%`}
                  subtitle="Interested / total students"
                />
                <MetricCard
                  title="Application Conversion"
                  value={`${derived.applicationConversion}%`}
                  subtitle="Shortlisted / applications"
                />
                <MetricCard
                  title="Opportunity Utilization"
                  value={`${derived.opportunityUtilization}%`}
                  subtitle="Open opportunities / drives"
                />
              </div>

              <div className="mt-5 rounded-2xl border border-border bg-background p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">Operational Notes</div>
                    <div className="text-xs text-muted-foreground">
                      This dashboard is ready for future chart modules.
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Live data
                  </div>
                </div>
                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <li>• Attendance now has a reusable data model.</li>
                  <li>• Opportunity and application counts are updated from the live database.</li>
                  <li>• Auto-refresh keeps KPI cards current without manual reloads.</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Quick Actions</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  The main navigation stays compact on the left, while the dashboard stays focused on KPIs.
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {quickActions.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="rounded-2xl border border-border bg-background p-4 transition hover:border-primary/40 hover:shadow-sm"
                >
                  <div className="text-sm text-muted-foreground">Open</div>
                  <div className="mt-1 text-base font-semibold">{item.label}</div>
                </Link>
              ))}
            </div>
          </section>

          <section className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="text-sm text-muted-foreground">Registered Students</div>
              <div className="mt-2 text-3xl font-bold">{metrics.totalStudents}</div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="text-sm text-muted-foreground">Applications per Drive</div>
              <div className="mt-2 text-3xl font-bold">
                {metrics.totalDrives > 0
                  ? (metrics.totalApplications / metrics.totalDrives).toFixed(1)
                  : "0.0"}
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="text-sm text-muted-foreground">Attendance Records</div>
              <div className="mt-2 text-3xl font-bold">{metrics.attendanceRecords}</div>
            </div>
          </section>

          <div className="pb-6" />
        </main>
      </div>
    </div>
  );
}

