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
      <div className="w-full max-w-xl rounded-xl bg-background shadow-xl">
        <div className="border-b px-6 py-5">
          <h2 className="text-2xl font-semibold">Progress Summary</h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Review the shortlisted participants before configuring the next round.
          </p>
        </div>

        <div className="space-y-6 p-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border p-4">
              <div className="text-sm text-muted-foreground">Participants</div>

              <div className="mt-2 text-3xl font-bold">{totalParticipants}</div>
            </div>

            <div className="rounded-lg border p-4">
              <div className="text-sm text-muted-foreground">Shortlisted</div>

              <div className="mt-2 text-3xl font-bold">{shortlistedCount}</div>
            </div>
          </div>

          <div>
            <h3 className="mb-3 font-medium">Role Distribution</h3>

            <div className="space-y-2">
              {roleSummary.map((role) => (
                <div
                  key={role.driveRoleId}
                  className="flex items-center justify-between rounded-lg border px-4 py-3"
                >
                  <span>{role.roleName}</span>

                  <span className="font-medium">{role.candidateCount}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t px-6 py-5">
          <button type="button" onClick={onCancel} className="rounded-md border px-4 py-2">
            Cancel
          </button>

          <button
            type="button"
            onClick={onContinue}
            className="rounded-md bg-primary px-5 py-2 text-primary-foreground"
          >
            Configure Next Round
          </button>
        </div>
      </div>
    </div>
  );
}
