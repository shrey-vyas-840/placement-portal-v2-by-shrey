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
    <div className="rounded-2xl border bg-card p-8">
      <div className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        Recruitment Process
      </div>

      <h2 className="mt-2 text-2xl font-bold">
        Recruitment Process
      </h2>

      <p className="mt-2 text-sm text-muted-foreground">
        This tab will orchestrate the recruitment execution lifecycle.
      </p>
    </div>
  );
}