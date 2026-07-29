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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-6">
      <div className="mx-auto my-8 flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="relative border-t border-slate-400 bg-gradient-to-r from-blue-800 via-blue-700 to-cyan-600 px-8 py-5 text-white">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-white/10 blur-xl" />

          <div className="absolute bottom-0 left-0 h-28 w-28 rounded-full bg-cyan-300/10 blur-xl" />

          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/70">
                Execution Workspace
              </p>

              <h2 className="mt-1 text-3xl font-bold">
                {nextRoundOrder === 1 ? "Create First Round" : `Create Round ${nextRoundOrder}`}
              </h2>
            </div>

            <span className="rounded-full bg-white/20 px-4 py-2 text-sm font-semibold backdrop-blur-sm">
              Stage Round {nextRoundOrder}
            </span>
          </div>
        </div>

        <div className="flex-1 space-y-7 overflow-y-auto bg-slate-50 p-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <label className="mb-3 block text-sm font-semibold text-slate-800">Round Name</label>

            <input
              value={roundName}
              onChange={(e) => setRoundName(e.target.value)}
              placeholder="Technical Interview"
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm shadow-sm transition-all placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <label className="mb-4 block text-sm font-semibold text-slate-800">Round Type</label>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                disabled={commonStageLocked}
                onClick={() => setRoundType("COMMON")}
                className={`rounded-2xl border p-4 text-left transition-all ${
                  roundType === "COMMON"
                    ? "border-blue-500 bg-blue-50 shadow-md"
                    : "border-slate-200 bg-white hover:border-blue-300"
                } ${commonStageLocked ? "cursor-not-allowed opacity-50" : ""}`}
              >
                <div className="text-lg font-semibold">🌐 Common Round</div>

                <div className="mt-1 text-sm text-slate-600">
                  One round shared by every active role.
                </div>

                {roundType === "COMMON" && (
                  <div className="mt-4 text-sm font-semibold text-blue-700">✓ Selected</div>
                )}
              </button>

              <button
                type="button"
                onClick={() => setRoundType("ROLE_SPECIFIC")}
                className={`rounded-2xl border p-4 text-left transition-all ${
                  roundType === "ROLE_SPECIFIC"
                    ? "border-blue-500 bg-blue-50 shadow-md"
                    : "border-slate-200 bg-white hover:border-blue-300"
                }`}
              >
                <div className="text-lg font-semibold">🎯 Role Specific</div>

                <div className="mt-1 text-sm text-slate-600">
                  Configure separate execution for selected roles.
                </div>

                {roundType === "ROLE_SPECIFIC" && (
                  <div className="mt-4 text-sm font-semibold text-blue-700">✓ Selected</div>
                )}
              </button>
            </div>

            {commonStageLocked && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                🔒{" "}
                {commonStageLockReason ??
                  "Complete all role-specific execution before creating a Common Round."}
              </div>
            )}
          </div>

          {roundType === "ROLE_SPECIFIC" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">Remaining Active Roles</h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Select one or more roles for this execution round.
                  </p>
                </div>

                <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  {remainingRoles.length} Remaining
                </span>
              </div>

              <div className="grid max-h-80 grid-cols-1 gap-3 overflow-y-auto pr-1 md:grid-cols-2">
                {remainingRoles.map((role) => {
                  const checked = selectedRoles.includes(role.driveRoleId);

                  return (
                    <button
                      key={role.driveRoleId}
                      type="button"
                      onClick={() => {
                        if (checked) {
                          setSelectedRoles((prev) => prev.filter((id) => id !== role.driveRoleId));
                        } else {
                          setSelectedRoles((prev) => [...prev, role.driveRoleId]);
                        }
                      }}
                      className={`rounded-2xl border p-4 text-left transition-all ${
                        checked
                          ? "border-blue-500 bg-blue-50 shadow-md"
                          : "border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">
                            💼 {role.roleName}
                          </div>

                          <div className="mt-1 text-xs text-slate-500">
                            👥 {role.candidateCount} Candidate
                            {role.candidateCount !== 1 ? "s" : ""}
                          </div>
                        </div>

                        <div
                          className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs ${
                            checked
                              ? "border-blue-600 bg-blue-600 text-white"
                              : "border-slate-300 bg-white text-transparent"
                          }`}
                        >
                          ✓
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="mb-5 text-m font-semibold text-slate-800">Schedule</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium">Date</label>

                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm shadow-sm transition-all placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Time</label>

                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm shadow-sm transition-all placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div>
              <label className="mb-3 block text-sm font-semibold text-slate-800">Venue</label>

              <input
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm shadow-sm transition-all placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div>
              <label className="mb-3 block text-sm font-semibold text-slate-800">Remarks</label>

              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={4}
                className="w-full rounded-md border px-3 py-2"
              />
            </div>
          </div>
        </div>

        <div className="  ">
          {!mandatory && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-md mt-5 mb-5 space-x-10 border px-4 py-2"
            >
              Cancel
            </button>
          )}

          <button
            type="button"
            disabled={loading}
            onClick={() => void handleCreate()}
            className="rounded-xl mt-5 mb-5 bg-gradient-to-r from-blue-700 to-cyan-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
          >
            {remainingRoles.length > 0
              ? "→ Create & Configure Next Round"
              : "Finish Stage Configuration"}
          </button>
        </div>
      </div>
    </div>
  );
}
