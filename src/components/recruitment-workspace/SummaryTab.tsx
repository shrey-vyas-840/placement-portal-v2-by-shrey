import { useEffect, useState } from "react";
import { ActionCenter } from "./ActionCenter";
import { BriefcaseBusiness, CalendarDays, FileText, CircleDot } from "lucide-react";

import {
  getRecruitmentWorkspaceSummary,
  type RecruitmentWorkspaceSummary,
} from "@/services/recruitmentAnalyticsService";

import type { RecruitmentDraftRow } from "@/services/recruitmentDraftService";
interface SummaryTabProps {
  draft: RecruitmentDraftRow | null;
  loading: boolean;
}

export function SummaryTab({ draft, loading }: SummaryTabProps) {
  const [summary, setSummary] = useState<RecruitmentWorkspaceSummary | null>(null);

  useEffect(() => {
    if (!draft) return;

    let mounted = true;

    async function loadSummary() {
      if (!draft) return;

      const result = await getRecruitmentWorkspaceSummary(draft.draft_id);

      if (!mounted) return;

      setSummary(result);
    }

    void loadSummary();

    return () => {
      mounted = false;
    };
  }, [draft]);

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

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border bg-card p-6">

  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

    <div>

      <div className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        Recruitment Overview
      </div>

      <h2 className="mt-2 text-3xl font-bold">
        {summary?.recruitmentName}
      </h2>

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

      <div className="grid gap-4 xl:grid-cols-4">
        <div className="rounded-2xl border bg-card px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Applications
              </div>

              <div className="mt-2 text-4xl font-bold">{summary?.totalApplications ?? "-"}</div>
            </div>

            <div className="rounded-xl bg-primary/10 p-3">
              <FileText className="h-6 w-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-card px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Job Roles
              </div>

              <div className="mt-2 text-4xl font-bold">{summary?.totalRoles ?? "-"}</div>
            </div>

            <div className="rounded-xl bg-primary/10 p-3">
              <BriefcaseBusiness className="h-6 w-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-card px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Status
              </div>

              <div className="mt-3 flex items-center gap-2">
                <CircleDot className="h-4 w-4 text-green-500" />

                <span className="font-semibold">{summary?.applicationStatus ?? "-"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-card px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Application Window
              </div>

              <div className="mt-2 text-sm">
                <div>
                  {summary?.applicationStartDate
                    ? new Date(summary.applicationStartDate).toLocaleDateString()
                    : "-"}
                </div>

                <div className="text-muted-foreground">
                  {summary?.applicationEndDate
                    ? new Date(summary.applicationEndDate).toLocaleDateString()
                    : "-"}
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-primary/10 p-3">
              <CalendarDays className="h-6 w-6 text-primary" />
            </div>
          </div>
        </div>
      </div>
   
<div className="space-y-5">

  <ActionCenter
    summary={summary}
  />

  <div className="grid gap-5 lg:grid-cols-2">

    <div className="rounded-2xl border bg-card p-6">

      <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Registration Progress
      </div>

      <div className="mt-6 grid grid-cols-2 gap-6">

        <div>
          <div className="text-sm text-muted-foreground">
            Applications
          </div>

          <div className="mt-2 text-4xl font-bold">
            {summary?.totalApplications ?? 0}
          </div>
        </div>

        <div>
          <div className="text-sm text-muted-foreground">
            Avg / Role
          </div>

          <div className="mt-2 text-4xl font-bold">
            {summary?.averageApplicationsPerRole ?? 0}
          </div>
        </div>

        <div>
          <div className="text-sm text-muted-foreground">
            Published Roles
          </div>

          <div className="mt-2 text-2xl font-semibold">
            {summary?.totalRoles ?? 0}
          </div>
        </div>

        <div>
          <div className="text-sm text-muted-foreground">
            Hiring Goal
          </div>

          <div className="mt-2 text-2xl font-semibold text-muted-foreground">
            —
          </div>
        </div>

      </div>

    </div>

    <div className="rounded-2xl border bg-card p-6">

      <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Recent Activity
      </div>

      <div className="mt-6">

        {summary?.recentApplications?.length ? (

          <div className="space-y-4">

            {summary.recentApplications.map((application) => (

              <div
                key={application.applicationId}
                className="flex items-center justify-between rounded-xl border p-4"
              >
                <div>

                  <div className="font-medium">
                    Student Applied
                  </div>

                  <div className="text-sm text-muted-foreground">
                    {new Date(application.appliedAt).toLocaleString()}
                  </div>

                </div>

                <div className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                  Applied
                </div>

              </div>

            ))}

          </div>

        ) : (

          <div className="rounded-xl border border-dashed p-10 text-center">

            <div className="text-lg font-semibold">
              No Activity Yet
            </div>

            <div className="mt-2 text-sm text-muted-foreground">
              Student applications will appear here in real time.
            </div>

          </div>

        )}

      </div>

    </div>

  </div>

</div>
   
    </div>
  );
}
