import { Link } from "@tanstack/react-router";

interface RecruitmentDraftCardProps {
  draft: any;
  compact?: boolean;
}

export function RecruitmentDraftCard({ draft, compact = false }: RecruitmentDraftCardProps) {
  const company =
    draft.company_data?.companyName ?? draft.company_data?.name ?? "No company selected";

  const draftName = draft.draft_name?.trim() || "Untitled Recruitment";

  const currentStep = (draft.current_step ?? 0) + 1;

  const updated = draft.last_saved_at ?? draft.updated_at ?? draft.created_at;

  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold">{draftName}</div>

          <div className="mt-1 text-xs text-muted-foreground">{company}</div>
        </div>

        <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
          Draft
        </span>
      </div>

      <div className="mt-4 space-y-2 text-xs text-muted-foreground">
        <div>Step {currentStep} / 6</div>

        <div>Last Saved: {updated ? new Date(updated).toLocaleString() : "-"}</div>
      </div>

      {compact ? (
        <div className="mt-5">
          <Link
            to="/admin/recruitment-new"
            search={{
              draft: draft.draft_id,
            }}
            className="inline-flex rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground"
          >
            Continue Editing
          </Link>
        </div>
      ) : (
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            to="/admin/recruitment-new"
            search={{
              draft: draft.draft_id,
            }}
            className="rounded-lg bg-primary px-3 py-2 text-xs text-primary-foreground"
          >
            Continue
          </Link>

          <button type="button" className="rounded-lg border px-3 py-2 text-xs">
            Duplicate
          </button>

          <button type="button" className="rounded-lg border px-3 py-2 text-xs">
            Archive
          </button>

          <button
            type="button"
            className="rounded-lg border border-destructive px-3 py-2 text-xs text-destructive"
          >
            Delete
          </button>
        </div>
      )}    
    </div>
  );
}
