import { ReactNode, useEffect, useState } from "react";
import { ActionCenter } from "./ActionCenter";
import {
  BriefcaseBusiness,
  CalendarDays,
  FileText,
  CircleDot,
  Users,
  UserCheck,
  Trophy,
} from "lucide-react";

import {
  getRecruitmentWorkspaceSummary,
  type RecruitmentWorkspaceSummary,
} from "@/services/recruitmentAnalyticsService";

import type {
  RoleEligibilityAnalytics,
} from "@/services/recruitmentEligibilityAnalyticsService";

import type { RecruitmentDraftRow } from "@/services/recruitmentDraftService";

interface SummaryTabProps {
  draft: RecruitmentDraftRow | null;
  summary: RecruitmentWorkspaceSummary | null;
  loading: boolean;
}

export function SummaryTab({ draft, summary, loading }: SummaryTabProps) {

const [coverageView, setCoverageView] = useState<
  "branch" |
  "institute" |
  "degree" |
  "graduationYear"
>("branch");

  if (loading) {
    return (
      <div className="flex h-[500px] items-center justify-center">
        <div className="text-muted-foreground">Loading recruitment summary...</div>
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="flex h-[500px] items-center justify-center">
        <div className="text-destructive">Recruitment not found.</div>
      </div>
    );
  }

  function SummaryMetricCard({
    title,
    value,
    icon,
  }: {
    title: string;
    value: ReactNode;
    icon: ReactNode;
  }) {
    return (
      <div className="rounded-2xl border bg-card px-5 py-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              {title}
            </div>

            <div className="mt-3 text-4xl font-bold">{value}</div>
          </div>

          <div className="rounded-xl bg-primary/10 p-3">{icon}</div>
        </div>
      </div>
    );
  }

  function OverviewItem({ label, value }: { label: string; value: ReactNode }) {
    return (
      <div className="rounded-xl bg-muted/40 p-4">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>

        <div className="mt-2 text-lg font-semibold">{value}</div>
      </div>
    );
  }

  function CoverageRow({
    label,
    eligible,
    applied,
  }: {
    label: string;
    eligible: number;
    applied: number;
  }) {
    const remaining = eligible - applied;

    const rate = eligible === 0 ? 0 : Math.round((applied / eligible) * 100);

    return (
      <tr className="border-t">
        <td className="px-4 py-4 font-medium">{label}</td>

        <td className="px-4 py-4 text-center">{eligible}</td>

        <td className="px-4 py-4 text-center">{applied}</td>

        <td className="px-4 py-4 text-center">{remaining}</td>

        <td className="px-4 py-4 text-center">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            {rate}%
          </span>
        </td>
      </tr>
    );
  }

function RoleInsightCard({
  role,
}: {
  role: {
    roleId: string;
    roleName: string;
    eligible: number;
    applied: number;
    openings: number;
    applicationRate: number;
    applicationsPerOpening: number;
  };
}) {
  return (
    <div className="rounded-2xl border bg-card p-5">

      <div className="flex items-center justify-between">

        <div className="text-lg font-semibold">

          {role.roleName}

        </div>

        <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">

          {role.applicationRate}%

        </div>

      </div>

      <div className="mt-5 grid grid-cols-2 gap-4">

        <OverviewItem
          label="Eligible"
          value={role.eligible}
        />

        <OverviewItem
          label="Applied"
          value={role.applied}
        />

        <OverviewItem
          label="Openings"
          value={role.openings}
        />

        <OverviewItem
          label="Applications / Opening"
          value={role.applicationsPerOpening}
        />

      </div>

    </div>
  );
}

  const coverageRows =
  coverageView === "branch"
    ? summary?.coverageByBranch ?? []
    : coverageView === "institute"
      ? summary?.coverageByInstitute ?? []
      : coverageView === "degree"
        ? summary?.coverageByDegree ?? []
        : summary?.coverageByGraduationYear ?? [];


  return (
    <div className="space-y-5">
      <div className="rounded-2xl border bg-card p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Recruitment Overview
            </div>

            <h2 className="mt-2 text-3xl font-bold">{summary?.recruitmentName}</h2>

            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span>
                Company:
                <span className="ml-1 font-medium text-foreground">
                  {summary?.companyName || "-"}
                </span>
              </span>

              <span>•</span>

              <span>
                Roles:
                <span className="ml-1 font-medium text-foreground">
                  {summary?.totalRoles ?? "-"}
                </span>
              </span>

              <span>•</span>

              <span>
                Applications:
                <span className="ml-1 font-medium text-foreground">
                  {summary?.totalApplications ?? "-"}
                </span>
              </span>
            </div>
          </div>

          <div className="rounded-full bg-green-100 px-5 py-2 text-sm font-semibold text-green-700">
            {summary?.applicationStatus}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryMetricCard
          title="Applications"
          value={summary?.totalApplications ?? 0}
          icon={<FileText className="h-6 w-6 text-primary" />}
        />

       <SummaryMetricCard
  title="Eligible Students"
  value={summary?.eligibleStudents ?? 0}
  icon={<Users className="h-6 w-6 text-primary" />}
/>

  <SummaryMetricCard
  title="Application Rate"
  value={`${summary?.applicationRate ?? 0}%`}
  icon={<CircleDot className="h-6 w-6 text-green-600" />}
/>

     <SummaryMetricCard
  title="Pending Eligible"
  value={summary?.pendingEligibleStudents ?? 0}
  icon={<UserCheck className="h-6 w-6 text-amber-500" />}
/>

        <SummaryMetricCard
          title="Roles"
          value={summary?.totalRoles ?? 0}
          icon={<BriefcaseBusiness className="h-6 w-6 text-primary" />}
        />

 <SummaryMetricCard
  title="Shortlisted"
  value={summary?.shortlistedCount ?? 0}
  icon={<UserCheck className="h-6 w-6 text-green-600" />}
/>

  <SummaryMetricCard
  title="Selected"
  value={summary?.selectedCount ?? 0}
  icon={<Trophy className="h-6 w-6 text-amber-600" />}
/>

        <SummaryMetricCard
          title="Status"
          value={summary?.applicationStatus ?? "-"}
          icon={<CircleDot className="h-6 w-6 text-green-500" />}
        />
      </div>

      <div className="space-y-5">
        <ActionCenter summary={summary} />

     <div className="rounded-2xl border bg-card p-6">

  <div className="flex items-center justify-between">

    <div>

      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">

        Participation

      </div>

      <div className="mt-1 text-lg font-semibold">

        Student Application Analytics

      </div>

    </div>

  </div>

  <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">

    <OverviewItem
      label="Eligible Students"
      value={summary?.eligibleStudents ?? 0}
    />

    <OverviewItem
      label="Applications"
      value={summary?.totalApplications ?? 0}
    />

    <OverviewItem
      label="Pending Eligible"
      value={summary?.pendingEligibleStudents ?? 0}
    />

    <OverviewItem
      label="Application Rate"
      value={`${summary?.applicationRate ?? 0}%`}
    />

    <OverviewItem
      label="Today"
      value={summary?.applicationsToday ?? 0}
    />

    <OverviewItem
      label="Last 24 Hours"
      value={summary?.applicationsLast24Hours ?? 0}
    />

    <OverviewItem
      label="Last 7 Days"
      value={summary?.applicationsLast7Days ?? 0}
    />

    <OverviewItem
      label="Average / Role"
      value={summary?.averageApplicationsPerRole ?? 0}
    />

  </div>

  <div className="mt-8 rounded-xl border border-dashed p-12">

    <div className="text-center">

      <div className="text-lg font-semibold">

        Daily Participation Trend

      </div>

      <div className="mt-2 text-sm text-muted-foreground">

        Trend graph will use real daily analytics in the next phase.

      </div>

    </div>

  </div>

</div>

        <div className="rounded-2xl border bg-card p-6">
     <div className="flex items-center justify-between">

  <div>

    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">

      Coverage

    </div>

    <div className="mt-1 text-lg font-semibold">

      Student Participation Coverage

    </div>

  </div>

  <div className="flex gap-2">

    {[
      ["branch", "Branch"],
      ["institute", "Institute"],
      ["degree", "Degree"],
      ["graduationYear", "Graduation Year"],
    ].map(([key, label]) => (

      <button
        key={key}
        type="button"
        onClick={() =>
          setCoverageView(
            key as
              | "branch"
              | "institute"
              | "degree"
              | "graduationYear",
          )
        }
        className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
          coverageView === key
            ? "bg-primary text-primary-foreground"
            : "bg-muted hover:bg-muted/70"
        }`}
      >

        {label}

      </button>

    ))}

  </div>

</div>

          <div className="mt-6 overflow-hidden rounded-xl border">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">

  {coverageView === "branch"
    ? "Branch"
    : coverageView === "institute"
      ? "Institute"
      : coverageView === "degree"
        ? "Degree"
        : "Graduation Year"}

</th>

                  <th className="px-4 py-3 text-center text-sm font-semibold">Eligible</th>

                  <th className="px-4 py-3 text-center text-sm font-semibold">Applied</th>

                  <th className="px-4 py-3 text-center text-sm font-semibold">Remaining</th>

                  <th className="px-4 py-3 text-center text-sm font-semibold">Rate</th>
                </tr>
              </thead>

              <tbody>
                {coverageRows.length ? (
                  coverageRows.map(
                   (
  row:
    | {
        branchName: string;
        eligible: number;
        applied: number;
      }
    | {
        instituteName: string;
        eligible: number;
        applied: number;
      }
    | {
        degreeName: string;
        eligible: number;
        applied: number;
      }
    | {
        graduationYear: string;
        eligible: number;
        applied: number;
      },
) => (
                      <CoverageRow
                       key={
  "branchName" in row
    ? row.branchName
    : "instituteName" in row
      ? row.instituteName
      : "degreeName" in row
        ? row.degreeName
        : row.graduationYear
}

label={
  "branchName" in row
    ? row.branchName
    : "instituteName" in row
      ? row.instituteName
      : "degreeName" in row
        ? row.degreeName
        : row.graduationYear
}

eligible={row.eligible}

applied={row.applied}
                      />
                    ),
                  )
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      No coverage data available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

<div className="rounded-2xl border bg-card p-6">

  <div className="flex items-center justify-between">

    <div>

      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">

        Role Insights

      </div>

      <div className="mt-1 text-lg font-semibold">

        Recruitment Performance by Role

      </div>

    </div>

    <div className="text-sm text-muted-foreground">

      {summary?.roleAnalytics.length ?? 0} Roles

    </div>

  </div>

  <div className="mt-6 grid gap-4 lg:grid-cols-2">

    {(summary?.roleAnalytics ?? []).map(
  (role: RoleEligibilityAnalytics) => (

      <RoleInsightCard
        key={role.roleId}
        role={role}
      />

    ))}

  </div>

</div>

<div className="rounded-2xl border bg-card p-6">

  <div>

    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">

      Why Students Aren't Applying

    </div>

    <div className="mt-1 text-lg font-semibold">

      Eligibility Failure Breakdown

    </div>

    <p className="mt-2 text-sm text-muted-foreground">

      These are the primary reasons preventing students from becoming eligible
      for this recruitment.

    </p>

  </div>

  <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">

    {[
      {
        label: "Opted Out",
        value: summary?.failureBreakdown.optOut ?? 0,
      },
      {
        label: "Inactive",
        value: summary?.failureBreakdown.inactive ?? 0,
      },
      {
        label: "Institute",
        value: summary?.failureBreakdown.institute ?? 0,
      },
      {
        label: "Degree",
        value: summary?.failureBreakdown.degree ?? 0,
      },
      {
        label: "Branch",
        value: summary?.failureBreakdown.branch ?? 0,
      },
      {
        label: "Graduation Year",
        value: summary?.failureBreakdown.graduationYear ?? 0,
      },
      {
        label: "CGPA",
        value: summary?.failureBreakdown.cgpa ?? 0,
      },
      {
        label: "Backlogs",
        value: summary?.failureBreakdown.backlog ?? 0,
      },
      {
        label: "Year Gap",
        value: summary?.failureBreakdown.yearGap ?? 0,
      },
      {
        label: "Custom Rules",
        value: summary?.failureBreakdown.custom ?? 0,
      },
    ].map((item) => (
      <div
        key={item.label}
        className="rounded-xl border bg-muted/30 p-4"
      >
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {item.label}
        </div>

        <div className="mt-3 text-3xl font-bold">
          {item.value}
        </div>
      </div>
    ))}

  </div>

</div>

<div className="rounded-2xl border bg-card p-6">

  <div className="flex items-center justify-between">

    <div>

      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">

        Recent Activity

      </div>

      <div className="mt-1 text-lg font-semibold">

        Latest Recruitment Activity

      </div>

    </div>

    <div className="text-sm text-muted-foreground">

      {summary?.recentApplications.length ?? 0} Recent Applications

    </div>

  </div>

  <div className="mt-6">

    {(summary?.recentApplications ?? []).length === 0 ? (

      <div className="rounded-xl border border-dashed py-10 text-center text-muted-foreground">

        No recent applications found.

      </div>

    ) : (

      <div className="space-y-3">

        {summary?.recentApplications.map((application) => (

          <div
            key={application.applicationId}
            className="flex items-center justify-between rounded-xl border p-4"
          >

            <div>

              <div className="font-medium">

                Student ID

              </div>

              <div className="text-sm text-muted-foreground">

                {application.studentId}

              </div>

            </div>

            <div className="text-right">

              <div className="font-medium">

                Applied

              </div>

              <div className="text-sm text-muted-foreground">

                {new Date(application.appliedAt).toLocaleString()}

              </div>

            </div>

          </div>

        ))}

      </div>

    )}

  </div>

</div>

      </div>
    </div>
  );
}
