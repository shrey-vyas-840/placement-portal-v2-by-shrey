import { Link } from "@tanstack/react-router";

interface RecruitmentDraftCardProps {
  draft: any;
  compact?: boolean;
  published?: boolean;
  onDuplicate?: (draftId: string) => Promise<void>;
  onArchive?: (draftId: string) => Promise<void>;
  onDelete?: (draftId: string) => Promise<void>;
  archived?: boolean;
  onRestore?: (draftId: string) => Promise<void>;
}
export function RecruitmentDraftCard({
  draft,
  compact = false,
  published = false,
  onDuplicate,
  onArchive,
  onDelete,
  onRestore,
  archived = false,
}: RecruitmentDraftCardProps) {
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

        <span
          className={
            published
              ? "rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700"
              : archived
                ? "rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700"
                : "rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700"
          }
        >
          {published ? "Published" : archived ? "Archived" : "Draft"}
        </span>
      </div>

      <div className="mt-4 space-y-2 text-xs text-muted-foreground">
        <div>Step {currentStep} / 6</div>

        <div>
          {published ? "Published" : "Last Saved"}:{" "}
          {published
            ? draft.published_at
              ? new Date(draft.published_at).toLocaleString()
              : "-"
            : updated
              ? new Date(updated).toLocaleString()
              : "-"}
        </div>
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
      ) : published ? (
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            to="/admin/recruitment/$draftId"
            params={{
              draftId: draft.draft_id,
            }}
            className="rounded-lg bg-primary px-3 py-2 text-xs text-primary-foreground"
          >
            View Recruitment
          </Link>
        </div>
      ) : archived ? (
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            onClick={() => onRestore?.(draft.draft_id)}
            className="rounded-lg bg-primary px-3 py-2 text-xs text-primary-foreground"
          >
            Restore
          </button>

          <button
            onClick={() => onDelete?.(draft.draft_id)}
            className="rounded-lg border border-destructive px-3 py-2 text-xs text-destructive"
          >
            Delete Permanently
          </button>
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

          <button
            type="button"
            onClick={() => onDuplicate?.(draft.draft_id)}
            className="rounded-lg border px-3 py-2 text-xs"
          >
            Duplicate
          </button>

          <button
            type="button"
            onClick={() => onArchive?.(draft.draft_id)}
            className="rounded-lg border px-3 py-2 text-xs"
          >
            Archive
          </button>

          <button
            type="button"
            onClick={() => onDelete?.(draft.draft_id)}
            className="rounded-lg border border-destructive px-3 py-2 text-xs text-destructive"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
