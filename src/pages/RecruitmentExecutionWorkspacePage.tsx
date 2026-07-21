import { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useSearch } from "@tanstack/react-router";
import { toast } from "sonner";
import { recruitmentExecutionService } from "@/services/recruitmentExecutionService";
import { useNavigate } from "@tanstack/react-router";
import { getExecutionBootstrapContext } from "@/services/recruitmentExecutionBootstrapService";
import AttendanceReviewDialog from "@/components/recruitment-workspace/AttendanceReviewDialog";
import CreateRoundDialog, {
  type ActiveRoleOption,
} from "@/components/recruitment-workspace/CreateRoundDialog";
import type {
  RecruitmentExecutionWorkspace,
  RecruitmentExecutionRoundRow,
  RecruitmentExecutionParticipantWithStudent,
  ExecutionAttendanceStatus,
  ExecutionGateStatus,
  ExecutionProgressionStatus,
  RecruitmentExecutionEditedRow,
} from "@/types/recruitmentExecution";

export function RecruitmentExecutionWorkspacePage() {
  const { executionId } = useSearch({
    from: "/admin/recruitment-execution",
  });

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [workspace, setWorkspace] = useState<RecruitmentExecutionWorkspace | null>(null);

  const [selectedRoundId, setSelectedRoundId] = useState("");

  const [attendanceReviewOpen, setAttendanceReviewOpen] = useState(false);

  const [createRoundOpen, setCreateRoundOpen] = useState(false);

  const hasRounds = (workspace?.rounds.length ?? 0) > 0;

  const [editedRows, setEditedRows] = useState<Record<string, RecruitmentExecutionEditedRow>>({});

  const loadWorkspace = useCallback(async () => {
    setLoading(true);

    try {
      const data = await recruitmentExecutionService.getExecutionDashboard(executionId);

      setWorkspace(data);

      if (data.rounds.length === 0) {
        setCreateRoundOpen(true);
      } else {
        setCreateRoundOpen(false);
      }

      setSelectedRoundId(data.rounds[0]?.execution_round_id ?? "");

      const initialState: Record<string, RecruitmentExecutionEditedRow> = {};

      data.participants.forEach((participant) => {
        initialState[participant.execution_participant_id] = {
          attendanceStatus: null,

          gateStatus: participant.effective_gate_status === "RESTRICTED" ? "RESTRICTED" : "ALLOWED",

          progressionStatus: "NONE",

          remarks: "",

          absenceDisposition: null,

          absenceReason: "",

          restrictionOverride: false,

          overrideReason: "",
        };
      });

      setEditedRows(initialState);
      setHasUnsavedChanges(false);
    } finally {
      setLoading(false);
    }
  }, [executionId]);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  const selectedRound = useMemo<RecruitmentExecutionRoundRow | null>(() => {
    if (!workspace) {
      return null;
    }

    return workspace.rounds.find((round) => round.execution_round_id === selectedRoundId) ?? null;
  }, [workspace, selectedRoundId]);

  const participants = useMemo<RecruitmentExecutionParticipantWithStudent[]>(() => {
    return workspace?.participants ?? [];
  }, [workspace]);

  const metrics = useMemo(
    () => ({
      totalParticipants: participants.length,
      totalRounds: workspace?.rounds.length ?? 0,
      finalizedRounds: 0,
    }),
    [participants, workspace],
  );

  const activeRoleOptions = useMemo<ActiveRoleOption[]>(() => {
  const roleMap = new Map<
    string,
    {
      driveRoleId: string;
      roleName: string;
      candidateCount: number;
    }
  >();

  participants.forEach((participant) => {
    participant.selected_roles.forEach((role) => {
      const existing = roleMap.get(role.drive_role_id);

      if (existing) {
        existing.candidateCount += 1;
      } else {
        roleMap.set(role.drive_role_id, {
          driveRoleId: role.drive_role_id,
          roleName: role.drive_role_name,
          candidateCount: 1,
        });
      }
    });
  });

  return [...roleMap.values()].sort((a, b) =>
    a.roleName.localeCompare(b.roleName),
  );
}, [participants]);

  const handleSaveRound = async () => {
    setSaving(true);

    try {
      if (!workspace || !selectedRound) {
        return;
      }

      const result = await recruitmentExecutionService.saveRound({
        executionId: workspace.execution.execution_id,
        executionRoundId: selectedRound.execution_round_id,
        executionRevision: workspace.execution.revision_number,
        rows: participants.map((participant) => {
          const row = editedRows[participant.execution_participant_id];

          return {
            executionParticipantId: participant.execution_participant_id,

            attendanceStatus: row?.attendanceStatus ?? null,

            gateStatus: row?.gateStatus ?? null,

            progressionStatus: row?.progressionStatus ?? "NONE",

            remarks: row?.remarks ?? "",

            absenceDisposition: row?.absenceDisposition ?? null,

            absenceReason: row?.absenceReason ?? "",

            restrictionOverride: row?.restrictionOverride ?? false,

            restrictionOverrideReason: row?.overrideReason ?? "",
          };
        }),
      });

      toast.success("Round saved successfully.");
      setAttendanceReviewOpen(false);

      if (result.progressedParticipants > 0) {
        toast.success(`${result.progressedParticipants} participant(s) progressed.`);
      }

      await loadWorkspace();
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error(error);

      toast.error(error instanceof Error ? error.message : "Unable to save round.");
    } finally {
      setSaving(false);
    }
  };

  const handleProgressToNextRound = async () => {
    setSaving(true);

    try {
      if (!workspace || !selectedRound) {
        return;
      }

      const currentIndex = workspace.rounds.findIndex(
        (round) => round.execution_round_id === selectedRound.execution_round_id,
      );

      if (currentIndex === -1 || currentIndex === workspace.rounds.length - 1) {
        return;
      }

      const nextRound = workspace.rounds[currentIndex + 1];

      const result = await recruitmentExecutionService.progressToNextRound({
        executionId: workspace.execution.execution_id,
        currentRoundId: selectedRound.execution_round_id,
        nextRoundId: nextRound.execution_round_id,
      });

      toast.success(
        `${result.progressedParticipants} participant(s) progressed to the next round.`,
      );

      setSelectedRoundId(nextRound.execution_round_id);

      await loadWorkspace();
    } catch (error) {
      console.error(error);

      toast.error(error instanceof Error ? error.message : "Unable to progress participants.");
    } finally {
      setSaving(false);
    }
  };

  const handleFinalizeExecution = async () => {
    if (!workspace) {
      return;
    }

    const confirmed = window.confirm(
      "Finalize this recruitment execution?\n\nAfter finalization, this execution will become read-only.",
    );

    if (!confirmed) {
      return;
    }

    setSaving(true);

    try {
      await recruitmentExecutionService.finalizeExecutionWorkflow({
        executionId: workspace.execution.execution_id,
      });

      toast.success("Recruitment execution finalized successfully.");

      await loadWorkspace();
    } catch (error) {
      console.error(error);

      toast.error(error instanceof Error ? error.message : "Unable to finalize execution.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Loading execution workspace...
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="flex min-h-screen items-center justify-center">Execution not found.</div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">Recruitment Execution</h1>

            <p className="mt-2 text-sm text-muted-foreground">
              Execute recruitment rounds, shortlist candidates and finalize selections.
            </p>
          </div>

          <Link to="/admin" className="rounded border px-4 py-2 text-sm">
            Back to Admin
          </Link>
        </div>


      {hasRounds ? (
        <>
          {/* existing workspace UI */}

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            <div className="rounded-lg border p-5">
              <div className="text-sm text-muted-foreground">Participants</div>

              <div className="mt-2 text-3xl font-bold">{metrics.totalParticipants}</div>
            </div>

            <div className="rounded-lg border p-5">
              <div className="text-sm text-muted-foreground">Rounds</div>

              <div className="mt-2 text-3xl font-bold">{metrics.totalRounds}</div>
            </div>

            <div className="rounded-lg border p-5">
              <div className="text-sm text-muted-foreground">Finalized</div>

              <div className="mt-2 text-3xl font-bold">{metrics.finalizedRounds}</div>
            </div>

            <div className="rounded-lg border p-5">
              <div className="text-sm text-muted-foreground">Revision</div>

              <div className="mt-2 text-3xl font-bold">{workspace.execution.revision_number}</div>
            </div>
          </div>

          <div className="mt-8 rounded-lg border p-5">
            <div className="flex flex-wrap gap-3">
              {workspace.rounds.map((round) => (
                <button
                  key={round.execution_round_id}
                  type="button"
                  onClick={() => setSelectedRoundId(round.execution_round_id)}
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    selectedRoundId === round.execution_round_id
                      ? "bg-primary text-primary-foreground"
                      : ""
                  }`}
                >
                  {round.round_order}. {round.round_name}
                  <span className="ml-2 text-xs opacity-70">{round.scope}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 rounded-lg border p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">
                  {selectedRound?.round_name ?? "Execution"}
                </h2>

                <p className="text-sm text-muted-foreground">
                  Manage attendance, gate status and progression.
                </p>
              </div>

              <div className="text-sm text-muted-foreground">
                {participants.length} Participants
              </div>
            </div>
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead className="sticky top-0 z-10 bg-background">
                  <tr className="border-b transition-colors hover:bg-muted/30">
                    <th className="px-3 py-3 text-left text-sm">Student</th>

                    <th className="px-3 py-3 text-left text-sm">Enrollment</th>

                    <th className="px-3 py-3 text-left text-sm">Selected Roles</th>

                    <th className="px-3 py-3 text-left text-sm">Attendance</th>

                    <th className="px-3 py-3 text-left text-sm">Gate</th>

                    <th className="px-3 py-3 text-left text-sm">Progression</th>
                  </tr>
                </thead>

                <tbody>
                  {participants.map((participant) => {
                    const editedRow = editedRows[participant.execution_participant_id];

                    const isRestricted = participant.effective_gate_status === "RESTRICTED";

                    const isOverrideApplied = editedRow?.gateStatus === "ALLOWED";

                    const effectiveGateStatus =
                      isRestricted && !isOverrideApplied ? "RESTRICTED" : "ALLOWED";

                    return (
                      <tr key={participant.execution_participant_id} className="border-b">
                        <td className="px-3 py-3">
                          <div className="font-medium">
                            {`${participant.student.first_name} ${participant.student.last_name}`}
                          </div>

                          <div className="text-xs text-muted-foreground">
                            {participant.student.institute_email}
                          </div>
                        </td>

                        <td className="px-3 py-3">{participant.student.enrollment_no}</td>

                        <td className="px-3 py-3">
                          <div className="flex flex-wrap gap-1">
                            {participant.selected_roles.map((role) => (
                              <span
                                key={role.drive_role_id}
                                className="rounded bg-muted px-2 py-1 text-xs"
                              >
                                {role.drive_role_name}
                              </span>
                            ))}
                          </div>
                        </td>

                        <td className="px-3 py-3">
                          <select
                            className={`w-full rounded-lg border px-3 py-2 text-sm font-medium transition-colors

    ${
      editedRow?.attendanceStatus === "PRESENT"
        ? "border-green-300 bg-green-50 text-green-700"
        : editedRow?.attendanceStatus === "ABSENT"
          ? "border-amber-300 bg-amber-50 text-amber-700"
          : "border-border bg-background"
    }`}
                            value={
                              editedRows[participant.execution_participant_id]?.attendanceStatus ??
                              ""
                            }
                            onChange={(e) => {
                              setHasUnsavedChanges(true);

                              setEditedRows((prev) => ({
                                ...prev,
                                [participant.execution_participant_id]: {
                                  ...prev[participant.execution_participant_id],
                                  attendanceStatus: (e.target.value ||
                                    null) as ExecutionAttendanceStatus | null,
                                },
                              }));
                            }}
                          >
                            <option value="">—</option>
                            <option value="PRESENT">🟢 Present</option>
                            <option value="ABSENT">🟠 Absent</option>
                          </select>
                        </td>

                        <td className="px-3 py-3">
                          <div className="space-y-2">
                            {effectiveGateStatus === "RESTRICTED" ? (
                              <span className="inline-flex rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                                Restricted
                              </span>
                            ) : isOverrideApplied ? (
                              <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                                Allowed (Override)
                              </span>
                            ) : (
                              <span className="inline-flex rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                                Allowed
                              </span>
                            )}

                            {participant.restriction_reason && (
                              <p className="max-w-xs text-xs text-muted-foreground">
                                {participant.restriction_reason}
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="px-3 py-3">
                          <select
                            className="w-full rounded border px-2 py-1 text-sm"
                            value={
                              editedRows[participant.execution_participant_id]?.progressionStatus ??
                              "NONE"
                            }
                            onChange={(e) => {
                              setHasUnsavedChanges(true);

                              setEditedRows((prev) => ({
                                ...prev,
                                [participant.execution_participant_id]: {
                                  ...prev[participant.execution_participant_id],
                                  progressionStatus: e.target.value as ExecutionProgressionStatus,
                                },
                              }));
                            }}
                          >
                            <option value="NONE">No Progress</option>

                            <option value="SHORTLISTED">Shortlisted</option>

                            <option value="SELECTED">Selected</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-8 flex items-center justify-between rounded-xl border bg-muted/30 p-4">
              <div>
                <div className="font-medium">Attendance Review</div>

                <div className="text-sm text-muted-foreground">
                  Review absentees and restriction overrides before saving.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAttendanceReviewOpen(true)}
                disabled={saving || !hasUnsavedChanges}
                className="rounded-md border px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                Save Round
              </button>

              <button
                type="button"
                onClick={handleProgressToNextRound}
                disabled={
                  saving ||
                  !workspace ||
                  workspace.rounds.findIndex(
                    (round) => round.execution_round_id === selectedRoundId,
                  ) ===
                    workspace.rounds.length - 1
                }
                className="rounded-md border px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                Progress to Next Round
              </button>

              <button
                type="button"
                onClick={handleFinalizeExecution}
                disabled={saving || hasUnsavedChanges}
                className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
              >
                Final Save
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="mt-10 rounded-xl border border-dashed p-10 text-center">
          <h2 className="text-2xl font-semibold">Create Your First Round</h2>

          <p className="mt-3 text-muted-foreground">
            This execution has no rounds yet. Create Round 1 before attendance, attendance review,
            Save Round, progression, or Final Save become available.
          </p>
        </div>
      )}
      </div>

<CreateRoundDialog
  open={createRoundOpen}
  mandatory={!hasRounds}
  nextRoundOrder={(workspace?.rounds.length ?? 0) + 1}
  activeRoles={activeRoleOptions}
  loading={saving}
  onCancel={() => setCreateRoundOpen(false)}
  onCreate={async (data) => {
    console.log("Create Round", data);

    toast.info(
      "Round creation service will be connected in the next step.",
    );
  }}
/>

      <AttendanceReviewDialog
        open={attendanceReviewOpen}
        onOpenChange={setAttendanceReviewOpen}
        participants={participants}
        editedRows={editedRows}
        onEditedRowChange={(participantId, changes) => {
          setEditedRows((prev) => ({
            ...prev,
            [participantId]: {
              ...prev[participantId],
              ...changes,
            },
          }));

          setHasUnsavedChanges(true);
        }}
        saving={saving}
        onSave={() => {
          setAttendanceReviewOpen(false);
          void handleSaveRound();
        }}
      />
    </div>
  );
}

export default RecruitmentExecutionWorkspacePage;
