import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
export type ExecutionRoundType = "COMMON" | "ROLE_SPECIFIC";

export interface ActiveRoleOption {
  driveRoleId: string;
  roleName: string;
  candidateCount: number;
}

interface CreateRoundDialogProps {
  open: boolean;

  mandatory?: boolean;

  nextRoundOrder: number;

  activeRoles: ActiveRoleOption[];

  loading?: boolean;

  commonStageLocked?: boolean;

  commonStageLockReason?: string;

  onCreate(data: {
    roundName: string;
    roundType: ExecutionRoundType;
    scheduledDate: string | null;
    scheduledTime: string | null;
    venue: string;
    remarks: string;
    roleIds: string[];
  }): Promise<void>;

  onCancel(): void;
}

export default function CreateRoundDialog({
  open,
  mandatory = false,
  nextRoundOrder,
  activeRoles,
  loading = false,
  commonStageLocked = false,
  commonStageLockReason,
  onCreate,
  onCancel,
}: CreateRoundDialogProps) {
  const [roundName, setRoundName] = useState("");

  const [roundType, setRoundType] = useState<ExecutionRoundType>("COMMON");

  useEffect(() => {
    if (commonStageLocked && roundType === "COMMON") {
      setRoundType("ROLE_SPECIFIC");
    }
  }, [commonStageLocked, roundType]);

  const [scheduledDate, setScheduledDate] = useState("");

  const [scheduledTime, setScheduledTime] = useState("");

  const [venue, setVenue] = useState("");

  const [remarks, setRemarks] = useState("");

  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  const [configuredRoleIds, setConfiguredRoleIds] = useState<string[]>([]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setRoundName("");
    setRoundType("COMMON");
    setScheduledDate("");
    setScheduledTime("");
    setVenue("");
    setRemarks("");
    setSelectedRoles([]);
  }, [open]);

  const commonRoleIds = useMemo(() => activeRoles.map((role) => role.driveRoleId), [activeRoles]);

  const remainingRoles = useMemo(() => {
    return activeRoles.filter((role) => !configuredRoleIds.includes(role.driveRoleId));
  }, [activeRoles, configuredRoleIds]);

  const effectiveRoleIds = useMemo(() => {
    return roundType === "COMMON" ? commonRoleIds : selectedRoles;
  }, [roundType, commonRoleIds, selectedRoles]);

  const handleCreate = async () => {
    if (!roundName.trim()) {
      toast.error("Round name is required.");
      return;
    }

    if (roundType === "ROLE_SPECIFIC" && selectedRoles.length === 0) {
      toast.error("Select at least one active role.");
      return;
    }

    await onCreate({
      roundName: roundName.trim(),
      roundType,
      scheduledDate: scheduledDate || null,
      scheduledTime: scheduledTime || null,
      venue: venue.trim(),
      remarks: remarks.trim(),
      roleIds: roundType === "COMMON" ? commonRoleIds : selectedRoles,
    });

    if (roundType === "ROLE_SPECIFIC") {
      setConfiguredRoleIds((previous) => [...new Set([...previous, ...selectedRoles])]);

      setRoundName("");
      setScheduledDate("");
      setScheduledTime("");
      setVenue("");
      setRemarks("");
      setSelectedRoles([]);

      if (remainingRoles.length > selectedRoles.length) {
        toast.success(
          "Role configured. Continue configuring the remaining active roles for this stage.",
        );
        return;
      }
    }
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
      <div className="w-full max-w-2xl rounded-xl bg-background shadow-xl">
        <div className="border-b px-6 py-5">
          <h2 className="text-2xl font-semibold">
            {nextRoundOrder === 1 ? "Create First Round" : "Create Round"}
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">Configure the next execution round.</p>
        </div>

        <div className="space-y-6 p-6">
          <div>
            <label className="mb-2 block text-sm font-medium">Round Name</label>

            <input
              value={roundName}
              onChange={(e) => setRoundName(e.target.value)}
              className="w-full rounded-md border px-3 py-2"
              placeholder="Technical Interview"
            />
          </div>

          <div>
            <label className="mb-3 block text-sm font-medium">Round Type</label>

            <div className="flex gap-6">
              <div className="flex flex-col">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={roundType === "COMMON"}
                    disabled={commonStageLocked}
                    onChange={() => setRoundType("COMMON")}
                  />
                  Common
                </label>

                {commonStageLocked && (
                  <p className="ml-6 mt-1 text-xs text-amber-600">
                    {commonStageLockReason ??
                      "Complete the configured role-specific stage before merging into a Common stage."}
                  </p>
                )}
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={roundType === "ROLE_SPECIFIC"}
                  onChange={() => setRoundType("ROLE_SPECIFIC")}
                />
                Role Specific
              </label>
            </div>
          </div>

          {roundType === "ROLE_SPECIFIC" && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <label className="block text-sm font-medium">Remaining Active Roles</label>

                <span className="text-xs text-muted-foreground">
                  {remainingRoles.length} Remaining
                </span>
              </div>

              <div className="max-h-52 space-y-2 overflow-auto rounded-lg border p-3">
                {remainingRoles.map((role) => {
                  const checked = selectedRoles.includes(role.driveRoleId);

                  return (
                    <label
                      key={role.driveRoleId}
                      className="flex items-center justify-between rounded p-2 hover:bg-muted"
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRoles((prev) => [...prev, role.driveRoleId]);
                            } else {
                              setSelectedRoles((prev) =>
                                prev.filter((id) => id !== role.driveRoleId),
                              );
                            }
                          }}
                        />

                        <span>{role.roleName}</span>
                      </div>

                      <span className="text-xs text-muted-foreground">
                        {role.candidateCount} Candidate{role.candidateCount === 1 ? "" : "s"}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Date</label>

              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full rounded-md border px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Time</label>

              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full rounded-md border px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Venue</label>

            <input
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              className="w-full rounded-md border px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Remarks</label>

            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={4}
              className="w-full rounded-md border px-3 py-2"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t px-6 py-5">
          {!mandatory && (
            <button type="button" onClick={onCancel} className="rounded-md border px-4 py-2">
              Cancel
            </button>
          )}

          <button
            type="button"
            disabled={loading}
            onClick={() => void handleCreate()}
            className="rounded-md bg-primary px-5 py-2 text-primary-foreground disabled:opacity-50"
          >
            {remainingRoles.length > 0
              ? "Create & Configure Next Role"
              : "Finish Stage Configuration"}
          </button>
        </div>
      </div>
    </div>
  );
}
