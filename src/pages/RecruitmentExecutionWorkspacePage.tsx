import { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useSearch } from "@tanstack/react-router";
import { toast } from "sonner";
import { recruitmentExecutionService } from "@/services/recruitmentExecutionService";
import { useNavigate } from "@tanstack/react-router";
import { getExecutionBootstrapContext } from "@/services/recruitmentExecutionBootstrapService";
import AttendanceReviewDialog from "@/components/recruitment-workspace/AttendanceReviewDialog";
import ExecutionProgressBar from "@/components/recruitment-workspace/ExecutionProgressBar";
import CreateRoundDialog, {
  type ActiveRoleOption,
} from "@/components/recruitment-workspace/CreateRoundDialog";
import ProgressSummaryDialog from "@/components/recruitment-workspace/ProgressSummaryDialog";
import ExecutionBatchParticipantDialog from "@/components/recruitment-workspace/ExecutionBatchParticipantDialog";

import ExecutionModeDialog, {
  type ExecutionMode,
} from "@/components/recruitment-workspace/ExecutionModeDialog";
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

  const [roundDirty, setRoundDirty] = useState(false);

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [workspace, setWorkspace] = useState<RecruitmentExecutionWorkspace | null>(null);

  const [selectedRoundId, setSelectedRoundId] = useState("");

  const [selectedTimeline, setSelectedTimeline] = useState<"COMMON" | string>("COMMON");

  const [selectedStage, setSelectedStage] = useState<number | null>(null);

  const [pendingRoundId, setPendingRoundId] = useState("");

  const [attendanceReviewOpen, setAttendanceReviewOpen] = useState(false);

  const [createRoundOpen, setCreateRoundOpen] = useState(false);

  const [progressSummaryOpen, setProgressSummaryOpen] = useState(false);

  const [executionModeDialogOpen, setExecutionModeDialogOpen] = useState(false);

  const [executionMode, setExecutionMode] = useState<ExecutionMode>("SINGLE");

  const [batchParticipantDialogOpen, setBatchParticipantDialogOpen] = useState(false);

  const [progressToNextRound, setProgressToNextRound] = useState(false);

  const [stageConfigurationMode, setStageConfigurationMode] = useState(false);

  const [currentConfigurationStage, setCurrentConfigurationStage] = useState<number | null>(null);

  const [currentConfigurationRoleId, setCurrentConfigurationRoleId] = useState<string | null>(null);

  const [pendingExecutionRoundId, setPendingExecutionRoundId] = useState<string | null>(null);

  const [showExecutionBatchPanel, setShowExecutionBatchPanel] = useState(false);

  const [selectedExecutionBatchId, setSelectedExecutionBatchId] = useState<string | null>(null);

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

      setSelectedStage(data.rounds[0]?.stage_number ?? null);

      const historyLookup = new Map(
        data.historySummary.map((item) => [item.execution_participant_id, item]),
      );
      const initialState: Record<string, RecruitmentExecutionEditedRow> = {};

      data.participants.forEach((participant) => {
        const history = historyLookup.get(participant.execution_participant_id);

        initialState[participant.execution_participant_id] = {
          attendanceStatus: history?.attendance_status ?? null,

          gateStatus: history?.restriction_override
            ? "ALLOWED"
            : (history?.gate_status ??
              (participant.effective_gate_status === "RESTRICTED" ? "RESTRICTED" : "ALLOWED")),

          progressionStatus: history?.progression_status ?? "NONE",
          remarks: history?.remarks ?? "",

          absenceDisposition: history?.absence_disposition ?? null,

          absenceReason: history?.absence_reason ?? "",

          restrictionOverride: history?.restriction_override ?? false,

          overrideReason: history?.restriction_override_reason ?? "",
        };
      });

      setEditedRows(initialState);

      const selectedRound = data.rounds.find(
        (r) => r.execution_round_id === (data.rounds[0]?.execution_round_id ?? ""),
      );

      const hasSavedHistory =
        !!selectedRound &&
        data.historySummary.some(
          (history) => history.execution_round_id === selectedRound.execution_round_id,
        );

      setRoundDirty(false);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error(error);

      toast.error(error instanceof Error ? error.message : "Unable to load execution workspace.");
    } finally {
      setLoading(false);
    }
  }, [executionId]);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  useEffect(() => {
    if (!workspace || !pendingRoundId) {
      return;
    }

    const exists = workspace.rounds.some((round) => round.execution_round_id === pendingRoundId);

    if (!exists) {
      return;
    }

    setSelectedRoundId(pendingRoundId);
    setPendingRoundId("");
  }, [workspace, pendingRoundId]);

  const selectedRound = useMemo<RecruitmentExecutionRoundRow | null>(() => {
    if (!workspace) {
      return null;
    }

    return workspace.rounds.find((round) => round.execution_round_id === selectedRoundId) ?? null;
  }, [workspace, selectedRoundId]);

  const selectedStageRounds = useMemo(() => {
    if (!workspace || selectedStage === null) {
      return [];
    }

    return workspace.rounds
      .filter((round) => round.stage_number === selectedStage)
      .sort((a, b) => a.round_order - b.round_order);
  }, [workspace, selectedStage]);

  const executionTimelines = useMemo(() => {
    if (!workspace) {
      return [];
    }

    const timelines: Array<{
      id: string;
      name: string;
      scope: "COMMON" | "ROLE_SPECIFIC";
    }> = [
      {
        id: "COMMON",
        name: "Common",
        scope: "COMMON",
      },
    ];

    const added = new Set<string>();

    workspace.participants.forEach((participant) => {
      participant.selected_roles.forEach((role) => {
        if (added.has(role.drive_role_id)) {
          return;
        }

        added.add(role.drive_role_id);

        timelines.push({
          id: role.drive_role_id,
          name: role.drive_role_name,
          scope: "ROLE_SPECIFIC",
        });
      });
    });

    return timelines.sort((a, b) => {
      if (a.id === "COMMON") return -1;
      if (b.id === "COMMON") return 1;

      return a.name.localeCompare(b.name);
    });
  }, [workspace]);

  const isCurrentRoundSaved = useMemo(() => {
    if (!workspace || !selectedRound) {
      return false;
    }

    return workspace.historySummary.some(
      (history) => history.execution_round_id === selectedRound.execution_round_id,
    );
  }, [workspace, selectedRound]);

  const participants = useMemo<RecruitmentExecutionParticipantWithStudent[]>(() => {
    if (!workspace || !selectedRound) {
      return [];
    }

    //
    // COMMON rounds always operate on the full participant set.
    //
    if (selectedRound.scope === "COMMON") {
      return workspace.participants;
    }

    //
    // ROLE_SPECIFIC rounds operate only on participants that selected
    // at least one role mapped to the current round.
    //
    const mappedRoleIds = new Set(
      workspace.roundRoleMappings
        .filter((mapping) => mapping.execution_round_id === selectedRound.execution_round_id)
        .map((mapping) => mapping.drive_role_id),
    );

    return workspace.participants.filter((participant) =>
      participant.selected_roles.some((role) => mappedRoleIds.has(role.drive_role_id)),
    );
  }, [workspace, selectedRound]);

  const metrics = useMemo(
    () => ({
      totalParticipants: participants.length,
      totalRounds: workspace?.rounds.length ?? 0,
      finalizedRounds: 0,
    }),
    [participants, workspace],
  );

  const stageGroups = useMemo(() => {
    if (!workspace) {
      return [];
    }

    let visibleRounds = workspace.rounds;

    //
    // Role timeline
    //
    if (selectedTimeline !== "COMMON") {
      const visibleRoundIds = new Set(
        workspace.roundRoleMappings
          .filter((mapping) => mapping.drive_role_id === selectedTimeline)
          .map((mapping) => mapping.execution_round_id),
      );

      visibleRounds = workspace.rounds.filter((round) => {
        if (round.scope === "COMMON") {
          return true;
        }

        return visibleRoundIds.has(round.execution_round_id);
      });
    }

    const groups = new Map<
      number,
      {
        stageNumber: number;
        rounds: RecruitmentExecutionRoundRow[];
      }
    >();

    visibleRounds.forEach((round) => {
      const existing = groups.get(round.stage_number);

      if (existing) {
        existing.rounds.push(round);
      } else {
        groups.set(round.stage_number, {
          stageNumber: round.stage_number,
          rounds: [round],
        });
      }
    });

    return [...groups.values()]
      .sort((a, b) => a.stageNumber - b.stageNumber)
      .filter((stage) => (selectedStage === null ? true : stage.stageNumber === selectedStage));
  }, [workspace, selectedTimeline, selectedStage]);

  const shortlistedParticipants = useMemo(
    () =>
      participants.filter((participant) => {
        const row = editedRows[participant.execution_participant_id];

        const attendanceAllowed =
          row?.attendanceStatus === "PRESENT" ||
          (row?.attendanceStatus === "ABSENT" && row?.absenceDisposition === "ALLOWED");

        const gateAllowed = row?.restrictionOverride === true || row?.gateStatus === "ALLOWED";

        return row?.progressionStatus === "SHORTLISTED" && attendanceAllowed && gateAllowed;
      }),
    [participants, editedRows],
  );

  const shortlistedRoleSummary = useMemo<ActiveRoleOption[]>(() => {
    const roleMap = new Map<string, ActiveRoleOption>();

    shortlistedParticipants.forEach((participant) => {
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

    return [...roleMap.values()].sort((a, b) => a.roleName.localeCompare(b.roleName));
  }, [shortlistedParticipants]);

  const currentRoundRoleIds = useMemo(() => {
    if (!selectedRound || selectedRound.scope === "COMMON") {
      return null;
    }

    return (
      workspace?.roundRoleMappings
        .filter((mapping) => mapping.execution_round_id === selectedRound.execution_round_id)
        .map((mapping) => mapping.drive_role_id) ?? []
    );
  }, [workspace, selectedRound]);

  const currentRoundRoleSummary = useMemo(() => {
    if (!currentRoundRoleIds) {
      return shortlistedRoleSummary;
    }

    return shortlistedRoleSummary.filter((role) => currentRoundRoleIds.includes(role.driveRoleId));
  }, [currentRoundRoleIds, shortlistedRoleSummary]);

  const currentStageBatches = useMemo(() => {
    if (!workspace || selectedStage === null) {
      return [];
    }

    return workspace.executionBatches
      .filter((batch) => batch.stage_number === selectedStage)
      .map((batch) => ({
        ...batch,
        participant_count: workspace.executionBatchParticipants.filter(
          (participant) => participant.execution_round_id === batch.execution_round_id,
        ).length,
        selected: batch.execution_round_id === selectedExecutionBatchId,
      }))
      .sort((a, b) => a.round_order - b.round_order);
  }, [workspace, selectedStage, selectedExecutionBatchId]);

  useEffect(() => {
    if (currentStageBatches.length > 0 && !selectedExecutionBatchId) {
      setSelectedExecutionBatchId(currentStageBatches[0].execution_round_id);
    }
  }, [currentStageBatches, selectedExecutionBatchId]);

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
      setProgressToNextRound(false);
      setRoundDirty(false);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error(error);

      toast.error(error instanceof Error ? error.message : "Unable to save round.");
    } finally {
      setSaving(false);
    }
  };

  if (roundDirty) {
    toast.error("Save the current round before creating another round.");
    return;
  }

  const handleProgressToNextRound = async () => {
    const shortlistedParticipants = participants.filter((participant) => {
      const row = editedRows[participant.execution_participant_id];

      return row?.progressionStatus === "SHORTLISTED";
    });

    if (shortlistedParticipants.length === 0) {
      toast.info(
        "No shortlisted participants remain. Please use Final Save to complete this execution.",
      );
      return;
    }

    setStageConfigurationMode(true);
    setProgressSummaryOpen(true);
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
      setProgressToNextRound(false);
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

            <div className="mt-8 rounded-xl border p-5">
              <ExecutionProgressBar
                rounds={workspace.rounds}
                roundRoleMappings={workspace.roundRoleMappings}
                timelines={executionTimelines}
                remainingActiveRoles={workspace.remainingActiveRoles}
                selectedStage={selectedStage}
                onStageSelect={(stageNumber) => {
                  setSelectedStage(stageNumber);

                  const firstRound = stageGroups.find((stage) => stage.stageNumber === stageNumber)
                    ?.rounds[0];

                  if (!firstRound) {
                    return;
                  }

                  setSelectedRoundId(firstRound.execution_round_id);

                  if (firstRound.scope === "COMMON") {
                    setSelectedTimeline("COMMON");
                    return;
                  }

                  const mapping = workspace.roundRoleMappings.find(
                    (m) => m.execution_round_id === firstRound.execution_round_id,
                  );

                  if (mapping) {
                    setSelectedTimeline(mapping.drive_role_id);
                  }
                }}
              />
            </div>

            <div className="mt-8 rounded-lg border p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div>
                    <h2 className="text-xl font-semibold">Stage {selectedStage}</h2>

                    <p className="text-sm text-muted-foreground">
                      {selectedStageRounds.length} Round
                      {selectedStageRounds.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Manage attendance, gate status and progression.
                  </p>
                </div>

                <div className="text-sm text-muted-foreground">
                  {participants.length} Participants
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {showExecutionBatchPanel && (
                  <div className="mt-6 rounded-xl border bg-card p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">Execution Batches</h3>

                        <p className="text-sm text-muted-foreground">
                          Divide shortlisted students into execution batches.
                        </p>
                      </div>

                      <button
                        type="button"
                        className="rounded-md border px-4 py-2 text-sm"
                        onClick={() => {
                          if (currentStageBatches.length === 0) {
                            toast.error("Create another execution round first.");
                            return;
                          }

                          setPendingExecutionRoundId(
                            currentStageBatches[currentStageBatches.length - 1].execution_round_id,
                          );

                          setBatchParticipantDialogOpen(true);
                        }}
                      >
                        + Create Batch
                      </button>
                    </div>

                    <div className="mt-5 space-y-3">
                      {currentStageBatches.length === 0 ? (
                        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                          No execution batches created.
                        </div>
                      ) : (
                        currentStageBatches.map((batch) => (
                          <div
                            key={batch.execution_round_id}
                            onClick={() => setSelectedExecutionBatchId(batch.execution_round_id)}
                            className={`flex items-center justify-between rounded-lg border p-4 cursor-pointer transition-colors ${
                              batch.selected ? "border-primary bg-primary/5" : ""
                            }`}
                          >
                            <div>
                              <div className="font-medium">{batch.round_name}</div>

                              <div className="text-sm text-muted-foreground">
                                {batch.scheduled_date ?? "No Date"} •{" "}
                                {batch.scheduled_time ?? "No Time"}
                              </div>

                              <div className="mt-1 text-xs text-muted-foreground">
                                {batch.participant_count} participant(s)
                              </div>
                            </div>

                            <button
                              type="button"
                              className="rounded-md border px-3 py-2 text-sm"
                              onClick={(e) => {
                                e.stopPropagation();

                                setPendingExecutionRoundId(batch.execution_round_id);

                                setBatchParticipantDialogOpen(true);
                              }}
                            >
                              Assign Students
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {selectedStageRounds.map((round) => (
                  <button
                    key={round.execution_round_id}
                    type="button"
                    onClick={() => {
                      setSelectedRoundId(round.execution_round_id);

                      if (round.scope === "COMMON") {
                        setSelectedTimeline("COMMON");
                        return;
                      }

                      const mapping = workspace?.roundRoleMappings.find(
                        (m) => m.execution_round_id === round.execution_round_id,
                      );

                      if (mapping) {
                        setSelectedTimeline(mapping.drive_role_id);
                      }
                    }}
                    className={`rounded-lg border px-4 py-2 text-sm transition ${
                      selectedRoundId === round.execution_round_id
                        ? "border-primary bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                  >
                    {round.round_name}
                  </button>
                ))}
              </div>

              <div className="mt-6 overflow-x-auto">
                {selectedExecutionBatchId &&
                  (selectedExecutionBatchId
                    ? participants.filter((participant) =>
                        workspace?.executionBatchParticipants.some(
                          (assignment) =>
                            assignment.execution_round_id === selectedExecutionBatchId &&
                            assignment.execution_participant_id ===
                              participant.execution_participant_id,
                        ),
                      ).length === 0
                    : false) && (
                    <div className="mb-4 rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                      No students assigned to this execution batch.
                    </div>
                  )}

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
                    {(selectedExecutionBatchId
                      ? participants.filter((participant) =>
                          workspace?.executionBatchParticipants.some(
                            (assignment) =>
                              assignment.execution_round_id === selectedExecutionBatchId &&
                              assignment.execution_participant_id ===
                                participant.execution_participant_id,
                          ),
                        )
                      : participants
                    ).map((participant) => {
                      const editedRow = editedRows[participant.execution_participant_id];

                      const effectiveGateStatus: ExecutionGateStatus | "ALLOWED_OVERRIDE" =
                        editedRow?.restrictionOverride
                          ? "ALLOWED_OVERRIDE"
                          : editedRow?.gateStatus === "RESTRICTED"
                            ? "RESTRICTED"
                            : "ALLOWED";

                      const effectiveAttendanceStatus = editedRow?.attendanceStatus ?? null;

                      const effectiveAttendanceAllowed =
                        effectiveAttendanceStatus === "PRESENT" ||
                        (effectiveAttendanceStatus === "ABSENT" &&
                          editedRow?.absenceDisposition === "ALLOWED");

                      const effectiveGateAllowed = effectiveGateStatus !== "RESTRICTED";

                      const canProgress = effectiveAttendanceAllowed && effectiveGateAllowed;

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
                                editedRows[participant.execution_participant_id]
                                  ?.attendanceStatus ?? ""
                              }
                              onChange={(e) => {
                                setEditedRows((prev) => {
                                  const next = {
                                    ...prev,
                                    [participant.execution_participant_id]: {
                                      ...prev[participant.execution_participant_id],
                                      attendanceStatus: (e.target.value ||
                                        null) as ExecutionAttendanceStatus | null,
                                    },
                                  };

                                  return next;
                                });

                                setRoundDirty(true);

                                setHasUnsavedChanges(true);
                              }}
                            >
                              <option value="">—</option>
                              <option value="PRESENT">🟢 Present</option>
                              <option value="ABSENT">🟠 Absent</option>
                            </select>
                            {editedRow?.attendanceStatus === "ABSENT" &&
                              editedRow?.absenceDisposition === "ALLOWED" && (
                                <p className="mt-1 text-xs text-green-600">Allowed Absence</p>
                              )}
                          </td>

                          <td className="px-3 py-3">
                            <div className="space-y-2">
                              {effectiveGateStatus === "RESTRICTED" ? (
                                <span className="inline-flex rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                                  Restricted
                                </span>
                              ) : effectiveGateStatus === "ALLOWED_OVERRIDE" ? (
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
                                editedRows[participant.execution_participant_id]
                                  ?.progressionStatus ?? "NONE"
                              }
                              onChange={(e) => {
                                setHasUnsavedChanges(true);

                                setRoundDirty(true);

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

                              <option value="SHORTLISTED" disabled={!canProgress}>
                                Shortlisted
                              </option>

                              <option value="SELECTED" disabled={!canProgress}>
                                Selected
                              </option>
                            </select>

                            {!canProgress && (
                              <p className="mt-1 text-xs text-amber-600">
                                Candidate cannot progress until attendance/restriction issues are
                                resolved.
                              </p>
                            )}
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
                  disabled={saving || !roundDirty}
                  className="rounded-md border px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isCurrentRoundSaved && !roundDirty ? "✓ Round Saved" : "Save Round"}
                </button>

                {(workspace?.remainingActiveRoles.length ?? 0) > 0 && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                    <div className="font-medium text-amber-800">Current stage is not complete.</div>

                    <div className="mt-1 text-sm text-amber-700">
                      {workspace?.remainingActiveRoles.length} active role(s) still need to be
                      assigned to a round before the next stage can begin.
                    </div>

                    <ul className="mt-3 list-disc pl-5 text-sm text-amber-700">
                      {workspace?.remainingActiveRoles.map((role) => (
                        <li key={role.drive_role_id}>
                          {role.drive_role_name} ({role.candidate_count} candidate
                          {role.candidate_count !== 1 ? "s" : ""})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleProgressToNextRound}
                  disabled={
                    saving ||
                    roundDirty ||
                    hasUnsavedChanges ||
                    !isCurrentRoundSaved ||
                    (workspace?.remainingActiveRoles.length ?? 0) > 0
                  }
                  className="rounded-md border px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Progress to Next Stage
                </button>

                <button
                  type="button"
                  onClick={handleFinalizeExecution}
                  disabled={saving || !isCurrentRoundSaved || roundDirty || hasUnsavedChanges}
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

      <ProgressSummaryDialog
        open={progressSummaryOpen}
        shortlistedCount={shortlistedParticipants.length}
        totalParticipants={participants.length}
        roleSummary={shortlistedRoleSummary}
        onCancel={() => setProgressSummaryOpen(false)}
        onContinue={() => {
          setProgressSummaryOpen(false);
          setExecutionModeDialogOpen(true);
        }}
      />

      <ExecutionModeDialog
        open={executionModeDialogOpen}
        stageNumber={selectedStage ?? 1}
        participantCount={shortlistedParticipants.length}
        defaultMode={executionMode}
        onCancel={() => {
          setExecutionModeDialogOpen(false);
        }}
        onContinue={(mode: ExecutionMode) => {
          setExecutionMode(mode);

          setExecutionModeDialogOpen(false);

          setCreateRoundOpen(true);
        }}
      />

      <CreateRoundDialog
        open={createRoundOpen}
        mandatory={!hasRounds}
        nextRoundOrder={(workspace?.rounds.length ?? 0) + 1}
        activeRoles={
          progressToNextRound
            ? currentRoundRoleSummary
            : workspace.remainingActiveRoles.map((role) => ({
                driveRoleId: role.drive_role_id,
                roleName: role.drive_role_name,
                candidateCount: role.candidate_count,
              }))
        }
        loading={saving}
        // configurationStage={currentConfigurationStage}
        // configurationRoleId={currentConfigurationRoleId}
        onCancel={() => {
          if (stageConfigurationMode) {
            toast.error("Finish configuring all remaining active roles before leaving this stage.");
            return;
          }

          setCreateRoundOpen(false);
          setProgressToNextRound(false);
        }}
        onCreate={async (data) => {
          if (!workspace) {
            return;
          }
          try {
            setSaving(true);

            const round = await recruitmentExecutionService.createExecutionBatch({
              executionId: workspace.execution.execution_id,

              creationMode: progressToNextRound ? "NEXT_STAGE" : "PARALLEL_STAGE",

              roundOrder: Math.max(...workspace.rounds.map((r) => r.round_order), 0) + 1,

              roundName: data.roundName,

              scope: data.roundType === "COMMON" ? "COMMON" : "ROLE_SPECIFIC",

              roleIds: data.roundType === "COMMON" ? [] : data.roleIds,

              executionParticipantIds: [],

              scheduledDate: data.scheduledDate,
              scheduledTime: data.scheduledTime,
              venue: data.venue,
              remarks: data.remarks,
            });

            setPendingRoundId(round.execution_round_id);

            setCurrentConfigurationStage(round.stage_number);

            if (data.roundType === "ROLE_SPECIFIC") {
              setCurrentConfigurationRoleId(data.roleIds[0] ?? null);
            }

            await loadWorkspace();

            const latestWorkspace = await recruitmentExecutionService.getExecutionDashboard(
              workspace.execution.execution_id,
            );

            const remainingRoles = latestWorkspace.remainingActiveRoles;

            if (data.roundType === "ROLE_SPECIFIC" && remainingRoles.length > 0) {
              setWorkspace(latestWorkspace);

              setProgressSummaryOpen(false);

              setCreateRoundOpen(true);

              setProgressToNextRound(false);

              setStageConfigurationMode(true);

              toast.success(
                "Round created successfully. Configure the remaining active roles for this stage.",
              );

              return;
            }

            setWorkspace(latestWorkspace);

            setSelectedTimeline((current) => {
              if (current === "COMMON") {
                return current;
              }

              const exists = latestWorkspace.participants.some((participant) =>
                participant.selected_roles.some((role) => role.drive_role_id === current),
              );

              return exists ? current : "COMMON";
            });

            setProgressSummaryOpen(false);
            setCreateRoundOpen(false);
            setProgressToNextRound(false);
            setStageConfigurationMode(false);

            if (executionMode === "MULTIPLE") {
              setPendingExecutionRoundId(round.execution_round_id);

              setShowExecutionBatchPanel(true);

              setCreateRoundOpen(false);

              setPendingExecutionRoundId(round.execution_round_id);
              setBatchParticipantDialogOpen(true);

              return;
            }
            if (executionMode === "SINGLE") {
              setShowExecutionBatchPanel(false);

              setPendingExecutionRoundId(null);
            }
            toast.success("Round created successfully.");
          } catch (error) {
            console.error(error);
            setProgressToNextRound(false);
            toast.error(error instanceof Error ? error.message : "Unable to create round.");
          } finally {
            setSaving(false);
          }
        }}
      />

      <ExecutionBatchParticipantDialog
        open={batchParticipantDialogOpen}
        loading={loading}
        participants={shortlistedParticipants}
        alreadyAssignedParticipantIds={
          workspace?.executionBatchParticipants
            .filter((participant) => participant.execution_round_id === pendingExecutionRoundId)
            .map((participant) => participant.execution_participant_id) ?? []
        }
        roleName="Execution Batch"
        stageNumber={selectedStage ?? 1}
        onCancel={() => {
          setBatchParticipantDialogOpen(false);
        }}
        onContinue={async (participantIds: string[]) => {
          if (!pendingExecutionRoundId) {
            return;
          }

          try {
            setLoading(true);

            await recruitmentExecutionService.assignExecutionBatchParticipants({
              executionRoundId: pendingExecutionRoundId,
              executionParticipantIds: participantIds,
            });

            await loadWorkspace();

            setSelectedExecutionBatchId(pendingExecutionRoundId);

            setBatchParticipantDialogOpen(false);

            toast.success("Students assigned successfully.");
          } catch (error) {
            console.error(error);

            toast.error("Failed to assign students.");
          } finally {
            setLoading(false);
          }
        }}
      />

      <AttendanceReviewDialog
        open={attendanceReviewOpen}
        onOpenChange={setAttendanceReviewOpen}
        participants={participants}
        editedRows={editedRows}
        onEditedRowChange={(participantId, changes) => {
          setEditedRows((prev) => {
            const current = prev[participantId];

            const next = {
              ...current,
              ...changes,
            };

            const attendanceAllowed =
              next.attendanceStatus === "PRESENT" ||
              (next.attendanceStatus === "ABSENT" && next.absenceDisposition === "ALLOWED");

            const gateAllowed = next.restrictionOverride === true || next.gateStatus === "ALLOWED";

            if (!attendanceAllowed || !gateAllowed) {
              next.progressionStatus = "NONE";
            }

            return {
              ...prev,
              [participantId]: next,
            };
          });

          setHasUnsavedChanges(true);
          setRoundDirty(true);
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
