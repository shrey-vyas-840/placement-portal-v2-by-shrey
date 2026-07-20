import type { RecruitmentWorkspaceSummary } from "@/services/recruitmentAnalyticsService";

interface RecruitmentProcessTabProps {
  summary: RecruitmentWorkspaceSummary | null;
  loading: boolean;

  onStartProcess?: () => Promise<void>;
onResumeProcess?: () => void;
onViewProcess?: () => void;

}

export function RecruitmentProcessTab({
  summary,
  loading,
  onStartProcess,
  onResumeProcess,
  onViewProcess,
}: RecruitmentProcessTabProps) {
  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="text-muted-foreground">Loading recruitment process...</div>
      </div>
    );
  }

  const execution = summary?.execution;

  let primaryAction: "START" | "RESUME" | "VIEW" | null = null;

  let secondaryAction: "REOPEN" | null = null;

  if (execution) {
    if (execution.canStartExecution) {
      primaryAction = "START";
    } else if (execution.canResumeExecution) {
      primaryAction = "RESUME";
    } else if (execution.canViewExecution) {
      primaryAction = "VIEW";
    }

    if (execution.canReopenExecution) {
      secondaryAction = "REOPEN";
    }
  }

  if (!summary) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="text-destructive">Recruitment process unavailable.</div>
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

            <h2 className="mt-2 text-3xl font-bold">Recruitment Process</h2>

            <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
              Manage the operational recruitment lifecycle after applications have been received.
              Start, resume, view or reopen the recruitment process from here.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border bg-card p-6">
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Status</div>

          <div className="mt-4">
            <div className="text-2xl font-bold">{summary.execution.status.replace("_", " ")}</div>

            <div className="mt-3 text-sm text-muted-foreground">Current lifecycle state</div>
          </div>
        </div>

        <div className="rounded-3xl border bg-card p-6">
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Current Revision
          </div>

          <div className="mt-4">
            <div className="text-4xl font-bold">{summary.execution.latestRevision ?? "—"}</div>

            <div className="mt-3 text-sm text-muted-foreground">Current execution revision</div>
          </div>
        </div>

        <div className="rounded-3xl border bg-card p-6 flex flex-col justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Next Action
            </div>

            <div className="mt-3 text-sm text-muted-foreground">
              Continue the recruitment lifecycle.
            </div>
          </div>

          <div className="mt-8 space-y-4">
            {primaryAction === "START" && (
              <button
                type="button"
                onClick={() => void onStartProcess?.()}
                className="w-full rounded-xl bg-primary px-5 py-3 font-medium text-primary-foreground"
              >
                Start Process
              </button>
            )}

            {primaryAction === "RESUME" && (
             <button
  type="button"
  onClick={onResumeProcess}
  className="w-full rounded-xl bg-primary px-5 py-3 font-medium text-primary-foreground"
>
  Resume Process
</button>
            )}

            {primaryAction === "VIEW" && (
             <button
  type="button"
  onClick={onViewProcess}
  className="w-full rounded-xl bg-primary px-5 py-3 font-medium text-primary-foreground"
>
  View Process
</button>
            )}

            {secondaryAction === "REOPEN" && (
              <button type="button" className="w-full rounded-xl border px-5 py-3">
                Reopen Process
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
