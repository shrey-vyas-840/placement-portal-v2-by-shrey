import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";

import type { RecruitmentExecutionParticipantWithStudent } from "@/types/recruitmentExecution";

export interface ExecutionBatchParticipantSelection {
  executionParticipantId: string;
}

interface ExecutionBatchParticipantDialogProps {
  open: boolean;

  loading?: boolean;

  mode?: "ASSIGN" | "VIEW";

  assignedBatchName?: string;

  roleName: string;

  stageNumber: number;

  participants: RecruitmentExecutionParticipantWithStudent[];

  alreadyAssignedParticipantIds: string[];

  onCancel: () => void;

  onContinue: (selectedParticipantIds: string[]) => void;
}

export default function ExecutionBatchParticipantDialog({
  open,
  loading = false,
  mode = "ASSIGN",
  assignedBatchName,
  roleName,
  stageNumber,
  participants,
  alreadyAssignedParticipantIds,
  onCancel,
  onContinue,
}: ExecutionBatchParticipantDialogProps) {
  const [search, setSearch] = useState("");

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (!open) {
      setSearch("");
      setSelectedIds([]);
    }
  }, [open]);

  const assignedParticipantIds = useMemo(
    () => new Set(alreadyAssignedParticipantIds),
    [alreadyAssignedParticipantIds],
  );

  const filteredParticipants = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return participants.filter((participant) => {
      if (mode === "ASSIGN") {
        if (assignedParticipantIds.has(participant.execution_participant_id)) {
          return false;
        }
      }

      if (keyword.length === 0) {
        return true;
      }

      const student = participant.student;

      const fullName = [student?.first_name, student?.middle_name, student?.last_name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        fullName.includes(keyword) || (student?.enrollment_no ?? "").toLowerCase().includes(keyword)
      );
    });
  }, [search, participants, mode, assignedParticipantIds]);

  const toggleParticipant = (executionParticipantId: string) => {
    setSelectedIds((previous) => {
      if (previous.includes(executionParticipantId)) {
        return previous.filter((id) => id !== executionParticipantId);
      }

      return [...previous, executionParticipantId];
    });
  };

  const selectAllVisible = () => {
    setSelectedIds(filteredParticipants.map((participant) => participant.execution_participant_id));
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-800 via-blue-700 to-cyan-600 px-8 py-6 text-white">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-white/10 blur-xl" />

          <div className="absolute bottom-0 left-0 h-28 w-28 rounded-full bg-cyan-300/10 blur-xl" />

          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/70">
                Recruitment Execution
              </p>

              <h2 className="mt-2 text-3xl font-bold">
                {mode === "VIEW"
                  ? assignedBatchName
                    ? `${assignedBatchName} • Students`
                    : "Assigned Students"
                  : "Assign Students to Execution Batch"}
              </h2>

              <p className="mt-2 text-sm text-white/80">
                Stage {stageNumber} • {roleName}
              </p>
            </div>

            <div className="rounded-full border border-white/20 bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur-sm">
              {mode === "ASSIGN"
                ? `${selectedIds.length} Selected`
                : `${filteredParticipants.length} Students`}
            </div>
          </div>
        </div>

        <div className="border-b bg-slate-50 px-8 py-5">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name or enrollment number..."
              className="w-full rounded-xl border py-2 pl-10 pr-3"
            />
          </div>

          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={selectAllVisible}
              className="rounded-xl border px-3 py-2 text-sm hover:bg-muted"
            >
              Select All Visible
            </button>

            <button
              type="button"
              onClick={clearSelection}
              className="rounded-xl border px-3 py-2 text-sm hover:bg-muted"
            >
              Clear Selection
            </button>

            <div className="ml-auto text-sm text-muted-foreground">
              {filteredParticipants.length} available student
              {filteredParticipants.length === 1 ? "" : "s"}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredParticipants.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <p className="text-lg font-medium">No students available</p>

                <p className="mt-2 text-sm text-muted-foreground">
                  Every eligible student has already been assigned to another execution batch or no
                  student matches the current search.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 p-6">
              {filteredParticipants.map((participant) => {
                const student = participant.student;

                const checked = selectedIds.includes(participant.execution_participant_id);

                const fullName = [student?.first_name, student?.middle_name, student?.last_name]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <label key={participant.execution_participant_id} className="block px-6 py-2">
                    <div
                      className={`flex items-start gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition-all ${
                        mode === "ASSIGN"
                          ? "cursor-pointer hover:border-blue-300 hover:shadow-md"
                          : ""
                      }`}
                    >
                      {mode === "ASSIGN" && (
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleParticipant(participant.execution_participant_id)}
                          className="h-4 w-4"
                        />
                      )}

                      <div className="flex-1">
                        <div className="font-medium">{fullName || "Unknown Student"}</div>

                        <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span>{student?.enrollment_no}</span>

                          <span>•</span>

                          <span>{student?.institute_email}</span>
                        </div>

                        {participant.selected_roles.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {participant.selected_roles.map((role) => (
                              <span
                                key={role.selected_role_id}
                                className="rounded-full bg-blue-50 text-blue-700 px-2 py-1 text-xs"
                              >
                                {role.drive_role_name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 bg-white px-8 py-5">
          {mode === "ASSIGN" ? (
            <div className="text-sm text-muted-foreground">
              {selectedIds.length} student
              {selectedIds.length === 1 ? "" : "s"} selected
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              {filteredParticipants.length} assigned student
              {filteredParticipants.length === 1 ? "" : "s"}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="rounded-xl border-slate-300 px-5 border py-2 text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              {mode === "VIEW" ? "Close" : "Cancel"}
            </button>

            {mode === "ASSIGN" && (
              <button
                type="button"
                disabled={loading || selectedIds.length === 0}
                onClick={() => onContinue(selectedIds)}
                className="rounded-xl bg-gradient-to-r from-blue-700 to-cyan-600 px-6 shadow-lg py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Creating..." : `Continue (${selectedIds.length})`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
