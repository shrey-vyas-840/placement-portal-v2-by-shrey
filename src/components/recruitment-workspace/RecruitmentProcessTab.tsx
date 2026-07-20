import type { RecruitmentWorkspaceSummary } from "@/services/recruitmentAnalyticsService";

interface RecruitmentProcessTabProps {
  summary: RecruitmentWorkspaceSummary | null;
  loading: boolean;
}

export function RecruitmentProcessTab({
  summary,
  loading,
}: RecruitmentProcessTabProps) {
  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="text-muted-foreground">
          Loading recruitment process...
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="text-destructive">
          Recruitment process unavailable.
        </div>
      </div>
    );
  }

return (
  <div className="space-y-6">

    <div className="rounded-3xl border bg-card p-8">

      <div className="flex items-start justify-between">

        <div>

          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Recruitment Process
          </div>

          <h2 className="mt-2 text-3xl font-bold">
            Recruitment Process
          </h2>

          <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
            Manage the operational recruitment lifecycle after applications
            have been received. Start, resume, view or reopen the recruitment
            process from here.
          </p>

        </div>

      </div>

    </div>

    <div className="grid gap-6 lg:grid-cols-2">

      <div className="rounded-3xl border bg-card p-6">

        <div className="text-sm font-semibold">
          Current Process
        </div>

        <div className="mt-6 space-y-5">

          <div className="flex items-center justify-between">

            <span className="text-muted-foreground">
              Status
            </span>

            <span className="rounded-full border px-3 py-1 text-sm font-medium">
              {summary.execution.status.replace("_", " ")}
            </span>

          </div>

          <div className="flex items-center justify-between">

            <span className="text-muted-foreground">
              Current Revision
            </span>

            <span className="font-medium">
              {summary.execution.latestRevision ?? "—"}
            </span>

          </div>

          <div className="flex items-center justify-between">

            <span className="text-muted-foreground">
              Participants
            </span>

            <span className="font-medium">
              {summary.execution.exists ? "Ready" : "Not Initialized"}
            </span>

          </div>

        </div>

      </div>

      <div className="rounded-3xl border bg-card p-6">

        <div className="text-sm font-semibold">
          Available Actions
        </div>

        <div className="mt-6 space-y-4">

     <button
  type="button"
  disabled={!summary.execution.canStartExecution}
  className="w-full rounded-xl bg-primary px-5 py-3 font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
>
  Start Process
</button>

   <button
  type="button"
  disabled={!summary.execution.canResumeExecution}
  className="w-full rounded-xl border px-5 py-3 disabled:cursor-not-allowed disabled:opacity-50"
>
  Resume Process
</button>

<button
  type="button"
  disabled={!summary.execution.canViewExecution}
  className="w-full rounded-xl border px-5 py-3 disabled:cursor-not-allowed disabled:opacity-50"
>
  View Process
</button>

<button
  type="button"
  disabled={!summary.execution.canReopenExecution}
  className="w-full rounded-xl border px-5 py-3 disabled:cursor-not-allowed disabled:opacity-50"
>
  Reopen Process
</button>

        </div>

      </div>

    </div>

  </div>
);
} 