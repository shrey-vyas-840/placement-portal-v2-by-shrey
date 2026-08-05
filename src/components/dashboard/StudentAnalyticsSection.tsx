import { useMemo } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

import type { StudentDrilldownReport } from "@/services/adminDashboardAnalyticsService";

const CHART_COLORS = [
  "#16a34a", // Present
  "#dc2626", // Absent
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
        relative
        overflow-hidden
        mt-5
        mb-3
        rounded-xl
        border
        border-slate-200
        bg-white
        px-5
        py-4
        shadow-sm
        transition-all
        duration-200
        hover:-translate-y-0.5
        hover:shadow-md
      "
    >
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent}`} />

      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {title}
      </div>

      <div className="mt-2 text-3xl font-bold leading-none text-slate-900">{value}</div>

      {subtitle ? <div className="mt-2 text-xs text-slate-500">{subtitle}</div> : null}
    </div>
  );
}

const CenterLabel = ({ title, value }: { title: string; value: number }) => (
  <>
    <text
      x="50%"
      y="46%"
      textAnchor="middle"
      dominantBaseline="middle"
      className="fill-foreground text-[30px] font-bold"
    >
      {formatNumber(value)}
    </text>

    <text
      x="50%"
      y="60%"
      textAnchor="middle"
      dominantBaseline="middle"
      className="fill-muted-foreground text-[13px] font-medium"
    >
      {title}
    </text>
  </>
);

function ChartLegend({
  items,
}: {
  items: {
    label: string;
    value: number;
    color: string;
  }[];
}) {
  return (
    <div className="mt-3 grid grid-cols-2 gap-2">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
        >
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />

            <div>
              <div className="text-sm font-medium leading-none">{item.label}</div>

              <div className="mt-1 text-[11px] text-slate-500">Opportunities</div>
            </div>
          </div>

          <div className="text-xl font-bold">{formatNumber(item.value)}</div>
        </div>
      ))}
    </div>
  );
}

function StatusBadge({
  color,
  children,
}: {
  color: "blue" | "green" | "red" | "yellow" | "gray";
  children: React.ReactNode;
}) {
  const styles = {
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    red: "border-red-200 bg-red-50 text-red-700",
    yellow: "border-amber-200 bg-amber-50 text-amber-700",
    gray: "border-slate-200 bg-slate-100 text-slate-700",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${styles[color]}`}
    >
      {children}
    </span>
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
        rounded-2xl
        border
        border-slate-200
        bg-white
        p-5
        shadow-sm
      "
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h3>

          {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
        </div>
      </div>

      <div className="mt-5">{children}</div>
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
        <div className="h-[260px] animate-pulse rounded-2xl border border-border bg-card" />
        <div className="h-[260px] animate-pulse rounded-2xl border border-border bg-card" />
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
      {
        label: "Present",
        value: report.present_drives,
      },
      {
        label: "Absent",
        value: report.absent_drives,
      },
    ];
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
          title="Eligible"
          accent="from-blue-600 to-cyan-500"
          value={formatNumber(summary?.eligibleDrives ?? totalDrives)}
          subtitle="Matched opportunities"
        />

        <MetricCard
          title="Applied"
          accent="from-violet-600 to-indigo-500"
          value={formatNumber(report.applications_count)}
          subtitle="Applications submitted"
        />

        <MetricCard
          title="Attended"
          accent="from-emerald-600 to-green-500"
          value={formatNumber(report.present_drives)}
          subtitle="Successfully attended"
        />

        <MetricCard
          title="Absent"
          accent="from-red-600 to-rose-500"
          value={formatNumber(report.absent_drives)}
          subtitle="Missed participation"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Eligibility Overview" subtitle="Eligible vs Ineligible opportunities">
          <div className="flex h-[320px] flex-col">
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      {
                        label: "Eligible",
                        value: summary?.eligibleDrives ?? totalDrives,
                      },
                      {
                        label: "Ineligible",
                        value: Math.max(0, totalDrives - (summary?.eligibleDrives ?? totalDrives)),
                      },
                    ]}
                    dataKey="value"
                    nameKey="label"
                    cx="50%"
                    cy="48%"
                    innerRadius={58}
                    outerRadius={88}
                    paddingAngle={3}
                    stroke="#ffffff"
                    strokeWidth={2}
                  >
                    <Cell fill="#2563eb" />
                    <Cell fill="#64748b" />

                    <CenterLabel title="Eligible" value={summary?.eligibleDrives ?? totalDrives} />
                  </Pie>

                  <Tooltip formatter={(value: number) => formatNumber(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <ChartLegend
              items={[
                {
                  label: "Eligible",
                  value: summary?.eligibleDrives ?? totalDrives,
                  color: "#2563eb",
                },
                {
                  label: "Ineligible",
                  value: Math.max(0, totalDrives - (summary?.eligibleDrives ?? totalDrives)),
                  color: "#64748b",
                },
              ]}
            />
          </div>
        </SectionCard>

        <SectionCard title="Application Overview" subtitle="Applied vs Missed opportunities">
          <div className="flex h-[320px] flex-col">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    {
                      label: "Applied",
                      value: report.applications_count,
                    },
                    {
                      label: "Missed",
                      value: Math.max(
                        0,
                        (summary?.eligibleDrives ?? totalDrives) - report.applications_count,
                      ),
                    },
                  ]}
                  dataKey="value"
                  nameKey="label"
                  cx="50%"
                  cy="45%"
                  innerRadius={58}
                  outerRadius={88}
                  paddingAngle={3}
                  stroke="#ffffff"
                  strokeWidth={2}
                >
                  <Cell fill="#7c3aed" />
                  <Cell fill="#64748b" />

                  <CenterLabel title="Applied" value={report.applications_count} />
                </Pie>

                <Tooltip formatter={(value: number) => formatNumber(value)} />
              </PieChart>
            </ResponsiveContainer>
            <ChartLegend
              items={[
                {
                  label: "Applied",
                  value: report.applications_count,
                  color: "#7c3aed",
                },
                {
                  label: "Missed",
                  value: Math.max(
                    0,
                    (summary?.eligibleDrives ?? totalDrives) - report.applications_count,
                  ),
                  color: "#64748b",
                },
              ]}
            />
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)] items-start">
        <SectionCard title="Attendance Overview" subtitle="Present vs Absent participation">
          <div className="flex h-[540px] flex-col">
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="label"
                    cx="50%"
                    cy="48%"
                    innerRadius={58}
                    outerRadius={88}
                    paddingAngle={3}
                    stroke="#ffffff"
                    strokeWidth={2}
                  >
                    <Cell fill="#16a34a" />
                    <Cell fill="#dc2626" />

                    <CenterLabel title="Present" value={report.present_drives} />
                  </Pie>

                  <Tooltip formatter={(value: number) => formatNumber(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <ChartLegend
              items={[
                {
                  label: "Present",
                  value: report.present_drives,
                  color: "#16a34a",
                },
                {
                  label: "Absent",
                  value: report.absent_drives,
                  color: "#dc2626",
                },
              ]}
            />
          </div>
        </SectionCard>

        <SectionCard
          title="Participation History"
          subtitle="Drive-by-drive breakdown for the logged-in student"
        >
          <div
            className="
      hidden
overflow-auto
max-h-[560px]
rounded-3xl
        border
        border-border/50
        bg-white
        md:block
    "
          >
            <table className="w-full text-sm">
              <thead className="sticky top-0 border-b border-border bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                    Company
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                    Status
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                    Registration
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                    Attendance
                  </th>
                </tr>
              </thead>

              <tbody>
                {report.drive_breakdown.map((row) => (
                  <tr
                    key={row.drive_id}
                    className="border-b border-slate-100 transition-colors hover:bg-slate-50"
                  >
                    <td className="px-4 py-4 font-medium">{row.company_name ?? "-"}</td>

                    <td className="px-4 py-4">
                      <StatusBadge
                        color={
                          row.status === "REGISTERED"
                            ? "blue"
                            : row.status === "UNREGISTERED"
                              ? "yellow"
                              : "gray"
                        }
                      >
                        {row.status === "REGISTERED"
                          ? "Registered"
                          : row.status === "UNREGISTERED"
                            ? "Unregistered"
                            : row.status}
                      </StatusBadge>
                    </td>

                    <td className="px-4 py-4">
                      {row.registered ? (
                        <StatusBadge color="blue">✓ Registered</StatusBadge>
                      ) : (
                        <StatusBadge color="yellow">✕ Unregistered</StatusBadge>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      {!row.registered ? (
                        <span className="text-slate-400">Not Marked</span>
                      ) : row.present ? (
                        <StatusBadge color="green">✓ Present</StatusBadge>
                      ) : (
                        <StatusBadge color="red">✕ Absent</StatusBadge>
                      )}
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
