import { useMemo } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

import type { StudentDrilldownReport } from "@/services/adminDashboardAnalyticsService";

const CHART_COLORS = ["#1d4ed8", "#7c3aed", "#059669", "#f59e0b"];

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
  accent = "from-primary to-cyan-500",
}: {
  title: string;
  value: number | string;
  subtitle?: string;
  accent?: string;
}) {
  return (
    <div
      className="
                group
                relative
                overflow-hidden
                rounded-3xl
                border
                border-border/60
                bg-white
                p-7
                transition-all
                duration-300
                hover:-translate-y-1
                hover:shadow-x2
            "
    >
      <div className={`absolute left-0 top-0 h-1.25 w-full bg-gradient-to-r ${accent}`} />

      <div className="text-[14px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
        {title}
      </div>

      <div className="mt-3 text-4xl font-bold tracking-tight text-foreground">{value}</div>

      {subtitle ? <div className="mt-3 text-xs text-muted-foreground">{subtitle}</div> : null}
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
    <section
      className="
                rounded-3xl
                border
                border-border/60
                bg-white
                p-6
                shadow-sm
            "
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold tracking-tight text-foreground">{title}</h3>

          {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
      </div>

      <div className="mt-6">{children}</div>
    </section>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
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
  report: StudentDrilldownReport;
  loading?: boolean;
}) {
  const summary = useMemo(() => {
    if (!report) {
      return null;
    }

    const totalDrives = report.total_active_drives ?? report.drive_breakdown.length;

    const eligibleDrives = report.eligible_drives ?? totalDrives;

    const registeredRate = percent(report.registered_drives, Math.max(eligibleDrives, 1));

    const attendanceRateVsRegistered = percent(
      report.present_drives,
      Math.max(report.registered_drives, 1),
    );

    const selectionRate = percent(report.selected_count, Math.max(report.applications_count, 1));

    const shortlistingRate = percent(
      report.shortlisted_count,
      Math.max(report.applications_count, 1),
    );

    const participationCoverage = percent(report.registered_drives, Math.max(totalDrives, 1));

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

  const hasDashboardHistory =
    report.registered_drives > 0 ||
    report.applications_count > 0 ||
    report.present_drives > 0 ||
    report.shortlisted_count > 0 ||
    report.selected_count > 0;

  const isNewStudent = !hasDashboardHistory;

  const totalDrives = summary?.totalDrives ?? report.drive_breakdown.length;

  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Registered Drives"
          accent="from-blue-600 to-blue-400"
          value={formatNumber(report.registered_drives)}
          subtitle="Drive-wise participation"
        />
        <MetricCard
          title="Present Drives"
          accent="from-emerald-600 to-emerald-400"
          value={formatNumber(report.present_drives)}
          subtitle="Marked present"
        />
        <MetricCard
          title="Absent Drives"
          accent="from-red-600 to-rose-400"
          value={formatNumber(report.absent_drives)}
          subtitle="Marked absent"
        />
        <MetricCard
          title="Attendance %"
          accent="from-violet-600 to-fuchsia-400"
          value={`${clampPercent(report.attendance_percentage)}%`}
          subtitle="Present / participated"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Applications"
          accent="from-indigo-600 to-blue-400"
          value={formatNumber(report.applications_count)}
          subtitle="Submitted applications"
        />

        <MetricCard
          title="Shortlisted"
          accent="from-amber-600 to-yellow-400"
          value={formatNumber(report.shortlisted_count)}
          subtitle="Pipeline progress"
        />

        <MetricCard
          title="Selected"
          accent="from-green-600 to-lime-400"
          value={formatNumber(report.selected_count)}
          subtitle="Final selections"
        />

        <MetricCard
          title="Eligible Drives"
          accent="from-cyan-600 to-sky-400"
          value={formatNumber(summary?.eligibleDrives ?? totalDrives)}
          subtitle="Matched opportunities"
        />
      </div>

      <SectionCard
        title="Student Analytics Overview"
        subtitle="All analytics below are restricted to the logged-in student only."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div
            className="
    rounded-3xl
    border
    border-border/50
    bg-gradient-to-b
    from-white
    to-slate-50/60
    p-5
"
          >
            <div className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
              Participation Coverage
            </div>
            <div className="mt-2 text-2xl font-bold">{summary?.participationCoverage ?? 0}%</div>
            <div
              className="
    mt-3
    h-2.5
    w-full
    overflow-hidden
    rounded-full
    bg-slate-100
"
            >
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

          <div
            className="
    rounded-3xl
    border
    border-border/50
    bg-gradient-to-b
    from-white
    to-slate-50/60
    p-5
"
          >
            <div className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
              Registration Success
            </div>
            <div className="mt-2 text-2xl font-bold">{summary?.registeredRate ?? 0}%</div>
            <div
              className="
    mt-3
    h-2.5
    w-full
    overflow-hidden
    rounded-full
    bg-slate-100
"
            >
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

          <div
            className="
    rounded-3xl
    border
    border-border/50
    bg-gradient-to-b
    from-white
    to-slate-50/60
    p-5
"
          >
            <div className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
              Attendance Success
            </div>
            <div className="mt-2 text-2xl font-bold">
              {summary?.attendanceRateVsRegistered ?? 0}%
            </div>
            <div
              className="
    mt-3
    h-2.5
    w-full
    overflow-hidden
    rounded-full
    bg-slate-100
"
            >
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

          <div
            className="
    rounded-3xl
    border
    border-border/50
    bg-gradient-to-b
    from-white
    to-slate-50/60
    p-5
"
          >
            <div className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
              Shortlist / Selection
            </div>
            <div className="mt-2 text-2xl font-bold">
              {summary?.shortlistingRate ?? 0}% / {summary?.selectionRate ?? 0}%
            </div>
            <div
              className="
    mt-3
    h-2.5
    w-full
    overflow-hidden
    rounded-full
    bg-slate-100
"
            >
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
        <SectionCard title="Student Status" subtitle="Drive participation breakdown">
          <div className="h-[360px] w-full">
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
                      <Cell key={entry.label} fill={CHART_COLORS[index % CHART_COLORS.length]} />
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
        </SectionCard>

        <SectionCard
          title="Participation History"
          subtitle="Drive-by-drive breakdown for the logged-in student"
        >
          <div
            className="
        hidden
        overflow-hidden
        rounded-3xl
        border
        border-border/50
        bg-white
        md:block
    "
          >
            <table className="min-w-[1100px] w-full text-sm">
              <thead
                className="
        sticky
        top-0
        border-b
        border-border
        bg-slate-50
        text-left
        text-xs
        uppercase
        tracking-[0.12em]
        text-muted-foreground
    "
              >
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
                    className="
    border-b
    border-border/50
    transition-colors
    hover:bg-slate-50
    last:border-b-0
"
                  >
                    <td className="px-3 py-3 font-medium text-foreground">{row.drive_name}</td>
                    <td className="px-3 py-3 text-muted-foreground">{row.company_name ?? "-"}</td>
                    <td className="px-3 py-3">
                      <span
                        className="
        rounded-full
        border
        border-primary/15
        bg-primary/5
        px-3
        py-1
        text-xs
        font-semibold
        text-primary
    "
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-3 py-3">{formatNumber(row.application_count)}</td>
                    <td className="px-3 py-3">{row.eligible ? "Yes" : "No"}</td>
                    <td className="px-3 py-3">{row.registered ? "Yes" : "No"}</td>
                    <td className="px-3 py-3">{row.present ? "Yes" : "No"}</td>
                    <td className="px-3 py-3">{row.shortlisted ? "Yes" : "No"}</td>
                    <td className="px-3 py-3">{row.selected ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 md:hidden">
            {report.drive_breakdown.map((row) => (
              <div
                key={row.drive_id}
                className="
    rounded-3xl
    border
    border-border/50
    bg-gradient-to-b
    from-white
    to-slate-50/60
    p-5
"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-foreground">{row.drive_name}</div>
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
