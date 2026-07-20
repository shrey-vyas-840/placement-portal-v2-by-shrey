import { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "@tanstack/react-router";

import { recruitmentExecutionService } from "@/services/recruitmentExecutionService";

import type {
  RecruitmentExecutionWorkspace,
  RecruitmentExecutionRoundRow,
  RecruitmentExecutionParticipantWithStudent,
  ExecutionAttendanceStatus,
  ExecutionGateStatus,
  ExecutionProgressionStatus,
} from "@/types/recruitmentExecution";

interface Props {
  executionId: string;
}

export function RecruitmentExecutionWorkspacePage({ executionId }: Props) {
  const [loading, setLoading] = useState(true);

  const [workspace, setWorkspace] = useState<RecruitmentExecutionWorkspace | null>(null);

  const [selectedRoundId, setSelectedRoundId] = useState("");

  const [editedRows, setEditedRows] = useState<
    Record<
      string,
      {
        attendanceStatus: ExecutionAttendanceStatus | null;
        gateStatus: ExecutionGateStatus | null;
        progressionStatus: ExecutionProgressionStatus;
        remarks: string;
      }
    >
  >({});

  const loadWorkspace = useCallback(async () => {
    setLoading(true);

    try {
      const data = await recruitmentExecutionService.getExecutionDashboard(executionId);

      setWorkspace(data);

      setSelectedRoundId(data.rounds[0]?.execution_round_id ?? "");

      const initialState: Record<
        string,
        {
          attendanceStatus: ExecutionAttendanceStatus | null;
          gateStatus: ExecutionGateStatus | null;
          progressionStatus: ExecutionProgressionStatus;
          remarks: string;
        }
      > = {};

      data.participants.forEach((participant) => {
        initialState[participant.execution_participant_id] = {
          attendanceStatus: null,
          gateStatus: null,
          progressionStatus: "NONE",
          remarks: "",
        };
      });

      setEditedRows(initialState);
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

  const handleSaveRound = async () => {
    if (!workspace || !selectedRound) {
      return;
    }

    const result = await recruitmentExecutionService.saveRound({
      executionId: workspace.execution.execution_id,
      executionRoundId: selectedRound.execution_round_id,
      executionRevision: workspace.execution.revision_number,
      rows: participants.map((participant) => ({
        executionParticipantId: participant.execution_participant_id,
        attendanceStatus:
          editedRows[participant.execution_participant_id]?.attendanceStatus ?? null,
        gateStatus: editedRows[participant.execution_participant_id]?.gateStatus ?? null,
        progressionStatus:
          editedRows[participant.execution_participant_id]?.progressionStatus ?? "NONE",
        remarks: editedRows[participant.execution_participant_id]?.remarks ?? "",
      })),
    });

    console.log("Saved Events:", result.savedEvents);

    console.log("Progressed Participants:", result.progressedParticipants);

    await loadWorkspace();
  };

  const handleProgressToNextRound = async () => {
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

    console.log("Progressed Participants:", result.progressedParticipants);

    setSelectedRoundId(nextRound.execution_round_id);

    await loadWorkspace();
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
              <h2 className="text-xl font-semibold">{selectedRound?.round_name ?? "Execution"}</h2>

              <p className="text-sm text-muted-foreground">
                Manage attendance, gate status and progression.
              </p>
            </div>

            <div className="text-sm text-muted-foreground">{participants.length} Participants</div>
          </div>
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="px-3 py-3 text-left text-sm">Student</th>

                  <th className="px-3 py-3 text-left text-sm">Enrollment</th>

                  <th className="px-3 py-3 text-left text-sm">Selected Roles</th>

                  <th className="px-3 py-3 text-left text-sm">Attendance</th>

                  <th className="px-3 py-3 text-left text-sm">Gate</th>

                  <th className="px-3 py-3 text-left text-sm">Progression</th>

                  <th className="px-3 py-3 text-left text-sm">Remarks</th>
                </tr>
              </thead>

              <tbody>
                {participants.map((participant) => (
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
                        className="w-full rounded border px-2 py-1 text-sm"
                        value={
                          editedRows[participant.execution_participant_id]?.attendanceStatus ?? ""
                        }
                        onChange={(e) =>
                          setEditedRows((prev) => ({
                            ...prev,
                            [participant.execution_participant_id]: {
                              ...prev[participant.execution_participant_id],
                              attendanceStatus: (e.target.value ||
                                null) as ExecutionAttendanceStatus | null,
                            },
                          }))
                        }
                      >
                        <option value="">—</option>
                        <option value="PRESENT">Present</option>
                        <option value="ABSENT">Absent</option>
                      </select>
                    </td>

                    <td className="px-3 py-3">
                      <select
                        className="w-full rounded border px-2 py-1 text-sm"
                        value={editedRows[participant.execution_participant_id]?.gateStatus ?? ""}
                        onChange={(e) =>
                          setEditedRows((prev) => ({
                            ...prev,
                            [participant.execution_participant_id]: {
                              ...prev[participant.execution_participant_id],
                              gateStatus: (e.target.value || null) as ExecutionGateStatus | null,
                            },
                          }))
                        }
                      >
                        <option value="">—</option>
                        <option value="ALLOWED">Allowed</option>
                        <option value="RESTRICTED">Restricted</option>
                      </select>
                    </td>

                    <td className="px-3 py-3">
                      <select
                        className="w-full rounded border px-2 py-1 text-sm"
                        value={
                          editedRows[participant.execution_participant_id]?.progressionStatus ??
                          "NONE"
                        }
                        onChange={(e) =>
                          setEditedRows((prev) => ({
                            ...prev,
                            [participant.execution_participant_id]: {
                              ...prev[participant.execution_participant_id],
                              progressionStatus: e.target.value as ExecutionProgressionStatus,
                            },
                          }))
                        }
                      >
                        <option value="NONE">No Progress</option>

                        <option value="SHORTLISTED">Shortlisted</option>

                        <option value="SELECTED">Selected</option>
                      </select>
                    </td>

                    <td className="px-3 py-3">
                      <input
                        type="text"
                        className="w-full rounded border px-2 py-1 text-sm"
                        placeholder="Remarks"
                        value={editedRows[participant.execution_participant_id]?.remarks ?? ""}
                        onChange={(e) =>
                          setEditedRows((prev) => ({
                            ...prev,
                            [participant.execution_participant_id]: {
                              ...prev[participant.execution_participant_id],
                              remarks: e.target.value,
                            },
                          }))
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={handleSaveRound}
              className="rounded-md border px-4 py-2 text-sm"
            >
              Save Round
            </button>

            <button
              type="button"
              onClick={handleProgressToNextRound}
              disabled={
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
              className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
            >
              Final Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RecruitmentExecutionWorkspacePage;
