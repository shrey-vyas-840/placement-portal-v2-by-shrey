import type { ActiveRoleOption } from "./CreateRoundDialog";

interface ProgressSummaryDialogProps {
  open: boolean;
  shortlistedCount: number;
  totalParticipants: number;
  roleSummary: ActiveRoleOption[];
  onCancel(): void;
  onContinue(): void;
}

export default function ProgressSummaryDialog({
  open,
  shortlistedCount,
  totalParticipants,
  roleSummary,
  onCancel,
  onContinue,
}: ProgressSummaryDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-800 via-blue-700 to-cyan-600 px-8 py-6 text-white">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-white/10 blur-xl" />

          <div className="absolute bottom-0 left-0 h-28 w-28 rounded-full bg-cyan-300/10 blur-xl" />

          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/70">
                Recruitment Execution
              </p>

              <h2 className="mt-3 text-4xl font-bold text-slate-900">Progress Summary</h2>

              <p className="mt-2 text-sm text-white/80">
                Review the shortlisted candidates before configuring the next execution round.
              </p>
            </div>

            <div className="rounded-full border border-white/20 bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur-sm">
              {shortlistedCount} Selected
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto bg-slate-50 p-8">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-sm text-muted-foreground">Total Participants</div>

              <div className="mt-3 text-4xl font-bold text-slate-900">{totalParticipants}</div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-sm text-muted-foreground">Selected for Next Round</div>

              <div className="mt-3 text-4xl font-bold text-slate-900">{shortlistedCount}</div>
            </div>
          </div>

          <div>
            <h3 className="mb-3 font-medium">Role Distribution</h3>

            <div className="space-y-2">
              {roleSummary.map((role) => (
                <div
                  key={role.driveRoleId}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition hover:border-blue-300 hover:shadow-md"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{role.roleName}</p>

                    <p className="text-sm text-slate-500">Eligible Candidates</p>
                  </div>

                  <div className="rounded-full bg-blue-50 px-4 py-2 font-semibold text-blue-700">
                    {role.candidateCount}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 bg-white px-8 py-5">
          <div>
            <p className="text-sm font-semibold text-slate-800">Ready to Continue</p>

            <p className="text-xs text-slate-500">
              Configure the next execution round using these shortlisted candidates.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-slate-300 px-5 py-2 hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onContinue}
              className="rounded-xl bg-gradient-to-r from-blue-700 to-cyan-600 px-6 py-2 text-white shadow-lg hover:shadow-xl"
            >
              Configure Next Round
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
