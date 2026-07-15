import { useParams } from "@tanstack/react-router";

export function AdminRecruitmentWorkspacePage() {
  const { draftId } = useParams({
  from: "/admin/recruitment/$draftId",
});

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-6 py-8">

        <div className="rounded-3xl border bg-card p-8 shadow-sm">

          <div className="flex items-center justify-between">

            <div>

              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Recruitment Workspace
              </div>

              <h1 className="mt-2 text-4xl font-bold">
                Loading Recruitment...
              </h1>

              <p className="mt-3 text-sm text-muted-foreground">
                Workspace ID: {draftId}
              </p>

            </div>

          </div>

        </div>

        <div className="mt-8 rounded-3xl border border-dashed bg-card p-16 text-center">

          <div className="text-2xl font-semibold">
            Recruitment Workspace
          </div>

          <div className="mt-3 text-muted-foreground">
            Phase 1 foundation completed.
          </div>

        </div>

      </div>
    </div>
  );
}