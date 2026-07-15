import type { RecruitmentDraftRow } from "@/services/recruitmentDraftService";

interface SummaryTabProps {
  draft: RecruitmentDraftRow | null;
  loading: boolean;
}

export function SummaryTab({
  draft,
  loading,
}: SummaryTabProps) {
  if (loading) {
    return (
      <div className="flex h-[500px] items-center justify-center">
        <div className="text-muted-foreground">
          Loading recruitment summary...
        </div>
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="flex h-[500px] items-center justify-center">
        <div className="text-destructive">
          Recruitment not found.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      <div>

        <h2 className="text-2xl font-bold">
          Recruitment Summary
        </h2>

        <p className="mt-2 text-muted-foreground">
          Mission Control dashboard for this recruitment.
        </p>

      </div>

      <div className="rounded-3xl border border-dashed p-16 text-center">

        <div className="text-lg font-semibold">
          Dashboard will be built here.
        </div>

      </div>

    </div>
  );
}