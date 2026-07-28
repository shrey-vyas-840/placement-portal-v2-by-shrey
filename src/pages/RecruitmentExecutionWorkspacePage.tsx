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
import CreateExecutionBatchDialog, {
  type ExecutionBatchFormData,
} from "@/components/recruitment-workspace/CreateExecutionBatchDialog";
import ExecutionModeDialog, {
  type ExecutionMode,
} from "@/components/recruitment-workspace/ExecutionModeDialog";
import ManageExecutionBatchesDialog, {
  ManageExecutionBatch,
  ManageExecutionBatchStudent,
} from "@/components/recruitment-workspace/ManageExecutionBatchesDialog";
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

  const [createExecutionBatchOpen, setCreateExecutionBatchOpen] = useState(false);

  const [editingExecutionBatchId, setEditingExecutionBatchId] = useState<string | null>(null);

  const [manageExecutionBatchesOpen, setManageExecutionBatchesOpen] = useState(false);

  const [batchManagementMode, setBatchManagementMode] = useState<"VIEW" | "UPDATE">("VIEW");

  const [viewingExecutionBatchId, setViewingExecutionBatchId] = useState<string | null>(null);

  const [executionBatchAssignments, setExecutionBatchAssignments] = useState<
    Record<string, string>
  >({});

  const hasRounds = (workspace?.rounds.length ?? 0) > 0;

  const [editedRows, setEditedRows] = useState<Record<string, RecruitmentExecutionEditedRow>>({});

  const loadWorkspace = useCallback(async () => {
    setLoading(true);

    try {
      const data = await recruitmentExecutionService.getExecutionDashboard(executionId);

      setWorkspace(data);

      console.log("Participants:", data.participants);
      console.log("Participant Count:", data.participants.length);

      if (data.participants.length > 0) {
        console.log("First Participant:", data.participants[0]);
        console.log("Student:", data.participants[0].student);
        console.log("Roles:", data.participants[0].selected_roles);
      }

      const assignments: Record<string, string> = {};

      data.executionBatchParticipants.forEach((assignment) => {
        assignments[assignment.execution_participant_id] = assignment.execution_round_id;
      });

      setExecutionBatchAssignments(assignments);

      //
      // Automatically select the first execution batch
      // of the current stage when none is selected.
      //
      if (!selectedExecutionBatchId && data.executionBatches.length > 0) {
        const firstBatch =
          data.executionBatches.find(
            (batch) => batch.stage_number === (selectedStage ?? data.rounds[0]?.stage_number),
          ) ?? data.executionBatches[0];

        if (firstBatch) {
          setSelectedExecutionBatchId(firstBatch.execution_round_id);
        }
      }

      const hasExecutionBatches = data.executionBatches.length > 0;

      const hasExistingBatchAssignments = data.executionBatchParticipants.length > 0;

      setShowExecutionBatchPanel(hasExecutionBatches || hasExistingBatchAssignments);

      setExecutionMode(hasExecutionBatches || hasExistingBatchAssignments ? "MULTIPLE" : "SINGLE");

      if (data.rounds.length === 0) {
        setCreateRoundOpen(true);
      } else {
        setCreateRoundOpen(false);
      }

      if (!pendingRoundId) {
        setSelectedRoundId((current) => current || data.rounds[0]?.execution_round_id || "");

        setSelectedStage((current) => current ?? data.rounds[0]?.stage_number ?? null);
      }

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
  }, [executionId, pendingRoundId, selectedExecutionBatchId, selectedStage]);

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
    console.log("Selected Round", selectedRound);
    console.log("Selected Round Scope", selectedRound.scope);
    console.log("Selected Batch", selectedExecutionBatchId);

    console.log("Assignments", workspace.executionBatchParticipants);

    console.log(
      "Participant IDs",
      workspace.executionBatchParticipants.map((p) => ({
        batch: p.execution_round_id,
        participant: p.execution_participant_id,
      })),
    );

    console.log(
      "Workspace Participants",
      workspace.participants.map((p) => p.execution_participant_id),
    );
    console.log("Show Batch Panel", showExecutionBatchPanel);
    //
    // COMMON rounds always operate on the full participant set.
    //

    if (selectedRound.scope === "COMMON") {
      console.log("COMMON ROUND");

      console.log(
        "Returning Participants",
        !showExecutionBatchPanel || !selectedExecutionBatchId
          ? workspace.participants.length
          : workspace.participants.filter((participant) =>
              new Set(
                workspace.executionBatchParticipants
                  .filter(
                    (assignment) => assignment.execution_round_id === selectedExecutionBatchId,
                  )
                  .map((a) => a.execution_participant_id),
              ).has(participant.execution_participant_id),
            ).length,
      );

      if (!showExecutionBatchPanel || !selectedExecutionBatchId) {
        return workspace.participants;
      }

      const assignedIds = new Set(
        workspace.executionBatchParticipants
          .filter((assignment) => assignment.execution_round_id === selectedExecutionBatchId)
          .map((assignment) => assignment.execution_participant_id),
      );

      return workspace.participants.filter((participant) =>
        assignedIds.has(participant.execution_participant_id),
      );
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
  }, [workspace, selectedRound, showExecutionBatchPanel, selectedExecutionBatchId]);

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

  const unassignedShortlistedParticipants = useMemo(() => {
    if (!workspace) {
      return [];
    }

    if (!showExecutionBatchPanel) {
      return [];
    }

    const assigned = new Set(
      workspace.executionBatchParticipants.map((assignment) => assignment.execution_participant_id),
    );

    return shortlistedParticipants.filter(
      (participant) => !assigned.has(participant.execution_participant_id),
    );
  }, [shortlistedParticipants, showExecutionBatchPanel, workspace]);

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
      .map((batch) => {
        const assignedIds = new Set(
          workspace.executionBatchParticipants
            .filter((assignment) => assignment.execution_round_id === batch.execution_round_id)
            .map((assignment) => assignment.execution_participant_id),
        );

        const assignedRows = participants.filter((participant) =>
          assignedIds.has(participant.execution_participant_id),
        );

        const completed =
          assignedRows.length > 0 &&
          assignedRows.every((participant) => {
            const row = editedRows[participant.execution_participant_id];

            return row?.attendanceStatus !== null;
          });

        return {
          ...batch,

          participant_count: assignedRows.length,

          present_count: assignedRows.filter((participant) => {
            const row = editedRows[participant.execution_participant_id];

            return row?.attendanceStatus === "PRESENT";
          }).length,

          absent_count: assignedRows.filter((participant) => {
            const row = editedRows[participant.execution_participant_id];

            return row?.attendanceStatus === "ABSENT";
          }).length,

          shortlisted_count: assignedRows.filter((participant) => {
            const row = editedRows[participant.execution_participant_id];

            return row?.progressionStatus === "SHORTLISTED";
          }).length,

          selected_count: assignedRows.filter((participant) => {
            const row = editedRows[participant.execution_participant_id];

            return row?.progressionStatus === "SELECTED";
          }).length,

          completed,

          pending:
            assignedRows.length -
            assignedRows.filter((participant) => {
              const row = editedRows[participant.execution_participant_id];

              return row?.attendanceStatus !== null;
            }).length,

          selected: batch.execution_round_id === selectedExecutionBatchId,
        };
      })
      .sort((a, b) => a.round_order - b.round_order);
  }, [workspace, selectedStage, selectedExecutionBatchId, participants, editedRows]);

  const metrics = useMemo(
    () => ({
      totalParticipants: showExecutionBatchPanel
        ? currentStageBatches.reduce((sum, batch) => sum + batch.participant_count, 0)
        : participants.length,
      totalRounds: workspace?.rounds.length ?? 0,
      finalizedRounds: 0,
    }),
    [participants, workspace, showExecutionBatchPanel, currentStageBatches],
  );

  const allExecutionBatchesCompleted = useMemo(() => {
    if (!showExecutionBatchPanel) {
      return true;
    }

    if (currentStageBatches.length === 0) {
      return false;
    }

    if (unassignedShortlistedParticipants.length > 0) {
      return false;
    }

    return currentStageBatches.every((batch) => batch.completed);
  }, [showExecutionBatchPanel, currentStageBatches, unassignedShortlistedParticipants]);

  const handleSaveRound = async () => {
    setSaving(true);

    try {
      if (!workspace || !selectedRound) {
        return;
      }

      console.log("SAVE ROUND - START");

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

      console.log("SAVE ROUND - SERVICE RETURNED");
      toast.success("Round saved successfully.");
      setAttendanceReviewOpen(false);

      if (result.progressedParticipants > 0) {
        toast.success(`${result.progressedParticipants} participant(s) progressed.`);
      }

      await loadWorkspace();
      console.log("SAVE ROUND - WORKSPACE RELOADED");
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

              {executionMode === "MULTIPLE" && showExecutionBatchPanel && (
                <div className="mt-6 rounded-xl border bg-card p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">Execution Batches</h3>

                      <p className="text-sm text-muted-foreground">
                        Configure batches for this stage.
                      </p>
                    </div>

                    <button
                      type="button"
                      className="rounded-md border px-4 py-2 text-sm"
                      onClick={() => {
                        setBatchManagementMode("UPDATE");
                        setManageExecutionBatchesOpen(true);
                      }}
                    >
                      {currentStageBatches.length === 0
                        ? "Create Execution Batches"
                        : "Manage Execution Batches"}
                    </button>
                  </div>

                  <div className="mt-5">
                    {currentStageBatches.length === 0 ? (
                      <div className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
                        No execution batches have been configured for this stage.
                      </div>
                    ) : (
                      <>
                        <div className="rounded-lg border bg-muted/30 p-4">
                          <div className="font-medium">
                            {currentStageBatches.length} Batch
                            {currentStageBatches.length === 1 ? "" : "es"} Configured
                          </div>

                          <div className="mt-3 space-y-2">
                            {currentStageBatches.map((batch) => (
                              <div
                                key={batch.execution_round_id}
                                className="flex items-center justify-between rounded border bg-background px-3 py-2"
                              >
                                <div>
                                  <div className="font-medium">{batch.round_name}</div>

                                  <div className="text-xs text-muted-foreground">
                                    {batch.scheduled_date ?? "No Date"} •{" "}
                                    {batch.scheduled_time ?? "No Time"}
                                  </div>

                                  <div className="mt-1 text-xs text-muted-foreground">
                                    {
                                      Object.entries(executionBatchAssignments).filter(
                                        ([, value]) => value === batch.execution_round_id,
                                      ).length
                                    }{" "}
                                    student(s) assigned
                                  </div>
                                </div>

                                <div className="text-right">
                                  {batch.completed ? (
                                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                                      Completed
                                    </span>
                                  ) : (
                                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
                                      Pending
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

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

                      {executionMode === "MULTIPLE" && showExecutionBatchPanel && (
                        <th className="px-3 py-2 text-left font-medium">Execution Batch</th>
                      )}
                    </tr>
                  </thead>

                  <tbody>
                    {participants.map((participant) => {
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

                          {executionMode === "MULTIPLE" && showExecutionBatchPanel && (
                            <td className="px-3 py-3">
                              {editedRow?.progressionStatus === "SHORTLISTED" ? (
                                <select
                                  className="w-full rounded-lg border px-3 py-2 text-sm"
                                  value={
                                    executionBatchAssignments[
                                      participant.execution_participant_id
                                    ] ?? ""
                                  }
                                  onChange={async (e) => {
                                    const batchId = e.target.value;

                                    if (!batchId) {
                                      return;
                                    }

                                    try {
                                      setSaving(true);

                                      await recruitmentExecutionService.assignExecutionBatchParticipants(
                                        {
                                          executionRoundId: batchId,
                                          executionParticipantIds: [
                                            participant.execution_participant_id,
                                          ],
                                        },
                                      );

                                      await loadWorkspace();

                                      setSelectedExecutionBatchId(batchId);

                                      toast.success("Execution batch updated.");
                                    } catch (error) {
                                      console.error(error);

                                      toast.error(
                                        error instanceof Error
                                          ? error.message
                                          : "Unable to update execution batch.",
                                      );
                                    } finally {
                                      setSaving(false);
                                    }
                                  }}
                                >
                                  <option value="">Assign Batch</option>

                                  {currentStageBatches.map((batch) => (
                                    <option
                                      key={batch.execution_round_id}
                                      value={batch.execution_round_id}
                                    >
                                      {batch.round_name}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </td>
                          )}
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

                {workspace.transition.requiresRoleAssignment &&
                  workspace.remainingActiveRoles.length > 0 && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                      <div className="font-medium text-amber-800">
                        Assign shortlisted candidates to role-specific execution rounds.
                      </div>

                      <div className="mt-1 text-sm text-amber-700">
                        Before Stage {workspace.transition.nextStage} can begin, shortlisted
                        candidates must be routed into the correct role-specific round.
                      </div>

                      <ul className="mt-3 list-disc pl-5 text-sm text-amber-700">
                        {workspace.remainingActiveRoles.map((role) => (
                          <li key={role.drive_role_id}>
                            {role.drive_role_name} ({role.candidate_count} candidate
                            {role.candidate_count !== 1 ? "s" : ""})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                {showExecutionBatchPanel && !allExecutionBatchesCompleted && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    Complete all execution batches and assign every shortlisted participant before
                    progressing to the next stage.
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
                    (workspace.transition.requiresRoleAssignment &&
                      workspace.remainingActiveRoles.length > 0) ||
                    !allExecutionBatchesCompleted
                  }
                  className="rounded-md border px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Progress to Next Stage
                </button>

                <button
                  type="button"
                  onClick={handleFinalizeExecution}
                  disabled={
                    saving ||
                    !isCurrentRoundSaved ||
                    roundDirty ||
                    hasUnsavedChanges ||
                    !allExecutionBatchesCompleted
                  }
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

          setProgressToNextRound(true);

          setCreateRoundOpen(true);
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
        onContinue={async (mode) => {
          setExecutionMode(mode);

          setExecutionModeDialogOpen(false);

          if (mode === "SINGLE") {
            setShowExecutionBatchPanel(false);

            setSelectedExecutionBatchId(null);

            setPendingExecutionRoundId(null);

            setCreateRoundOpen(false);

            setExecutionModeDialogOpen(false);

            setProgressSummaryOpen(false);

            setProgressToNextRound(false);

            setStageConfigurationMode(false);

            await loadWorkspace();

            toast.success("Stage created successfully.");

            return;
          }

          setShowExecutionBatchPanel(true);

          setSelectedExecutionBatchId(null);

          setCreateRoundOpen(false);

          setExecutionModeDialogOpen(false);

          setProgressSummaryOpen(false);

          setCreateExecutionBatchOpen(true);
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
        commonStageLocked={workspace?.transition.requiresSynchronization === true}

        commonStageLockReason={
          workspace?.transition.requiresSynchronization
            ? "One or more role-specific pipelines have already configured their next stage. Complete those configured stages before creating a Common stage."
            : undefined
        }
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

            //
            // First round of a stage.
            // Do NOT reload the workspace yet.
            // Ask the admin how this stage should execute.
            //
            setCreateRoundOpen(false);

            setSelectedStage(round.stage_number);

            setPendingExecutionRoundId(round.execution_round_id);

            setExecutionModeDialogOpen(true);

            setProgressSummaryOpen(false);

            setPendingRoundId(round.execution_round_id);
          } catch (error) {
            console.error(error);
            setProgressToNextRound(false);
            toast.error(error instanceof Error ? error.message : "Unable to create round.");
          } finally {
            setSaving(false);
          }
        }}
      />

      <CreateExecutionBatchDialog
        open={createExecutionBatchOpen}
        loading={saving}
        stageNumber={selectedStage ?? 1}
        participantCount={
          editingExecutionBatchId
            ? shortlistedParticipants.length
            : unassignedShortlistedParticipants.length
        }
        defaultBatchName={`Batch ${currentStageBatches.length + 1}`}
        editingBatch={
          editingExecutionBatchId
            ? (() => {
                const batch = currentStageBatches.find(
                  (b) => b.execution_round_id === editingExecutionBatchId,
                );

                if (!batch) {
                  return null;
                }

                return {
                  execution_round_id: batch.execution_round_id,
                  round_name: batch.round_name,
                  scheduled_date: batch.scheduled_date,
                  scheduled_time: batch.scheduled_time,
                  venue: batch.venue,
                  remarks: batch.remarks,
                };
              })()
            : null
        }
        onCancel={() => {
          setCreateExecutionBatchOpen(false);
        }}
        onSave={async (data: ExecutionBatchFormData) => {
          if (!workspace) return;

          try {
            setSaving(true);

            //
            // UPDATE EXISTING BATCH
            //
            console.log("UPDATE BATCH PATH", editingExecutionBatchId);
            if (editingExecutionBatchId) {
              await recruitmentExecutionService.updateExecutionBatch({
                executionRoundId: editingExecutionBatchId,

                batchName: data.batchName,

                scheduledDate: data.scheduledDate,

                scheduledTime: data.scheduledTime,

                venue: data.venue,

                remarks: data.remarks,
              });

              await loadWorkspace();

              setCreateExecutionBatchOpen(false);

              setEditingExecutionBatchId(null);

              toast.success("Execution batch updated.");

              return;
            }
            //
            // CREATE NEW BATCH
            //
            console.log("CREATE BATCH PATH");
            const batch = await recruitmentExecutionService.createExecutionBatch({
              executionId: workspace.execution.execution_id,
              creationMode: "PARALLEL_STAGE",
              roundOrder: Math.max(...workspace.rounds.map((r) => r.round_order), 0) + 1,
              roundName: data.batchName,
              scope: "COMMON",
              roleIds: [],
              executionParticipantIds: [],
              scheduledDate: data.scheduledDate,
              scheduledTime: data.scheduledTime,
              venue: data.venue,
              remarks: data.remarks,
            });

            await loadWorkspace();

            setPendingExecutionRoundId(batch.execution_round_id);

            setSelectedExecutionBatchId(batch.execution_round_id);

            setShowExecutionBatchPanel(true);

            setEditingExecutionBatchId(null);

            /*
             * If this stage supports multiple batches,
             * immediately open Batch Management first.
             * Admin can either create another batch
             * or continue to assign students.
             */
            setManageExecutionBatchesOpen(true);

            setCreateExecutionBatchOpen(false);

            toast.success("Execution batch created.");
          } catch (error) {
            console.error(error);

            toast.error(
              error instanceof Error ? error.message : "Unable to create execution batch.",
            );
          } finally {
            setSaving(false);
          }
        }}
      />

      <ExecutionBatchParticipantDialog
        open={batchParticipantDialogOpen}
        loading={loading}
        mode={viewingExecutionBatchId ? "VIEW" : "ASSIGN"}
        assignedBatchName={
          viewingExecutionBatchId
            ? currentStageBatches.find(
                (batch) => batch.execution_round_id === viewingExecutionBatchId,
              )?.round_name
            : undefined
        }
        participants={shortlistedParticipants}
        alreadyAssignedParticipantIds={
          workspace?.executionBatchParticipants
            .filter((assignment) => {
              if (assignment.execution_round_id === pendingExecutionRoundId) {
                return false;
              }

              const batch = workspace.executionBatches.find(
                (b) => b.execution_round_id === assignment.execution_round_id,
              );

              return batch?.stage_number === selectedStage;
            })
            .map((assignment) => assignment.execution_participant_id) ?? []
        }
        roleName="Execution Batch"
        stageNumber={selectedStage ?? 1}
        onCancel={() => {
          setBatchParticipantDialogOpen(false);

          setViewingExecutionBatchId(null);
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

            setExecutionBatchAssignments((prev) => ({ ...prev }));

            setSelectedExecutionBatchId(pendingExecutionRoundId);

            setBatchParticipantDialogOpen(false);

            setViewingExecutionBatchId(null);

            /*
             * Return to Batch Management so the admin can:
             * - review assignments
             * - create another batch
             * - edit an existing batch
             * - finish when satisfied
             */
            setManageExecutionBatchesOpen(true);

            toast.success("Students assigned successfully.");
          } catch (error) {
            console.error(error);

            toast.error("Failed to assign students.");
          } finally {
            setLoading(false);
          }
        }}
      />

      <ManageExecutionBatchesDialog
        open={manageExecutionBatchesOpen}
        batches={currentStageBatches as unknown as ManageExecutionBatch[]}
        students={
          participants.map((participant) => ({
            execution_participant_id: participant.execution_participant_id,

            execution_round_id:
              executionBatchAssignments[participant.execution_participant_id] ?? null,

            enrollment_no: participant.student.enrollment_no,

            student_name: `${participant.student.first_name} ${participant.student.last_name}`,
          })) as ManageExecutionBatchStudent[]
        }
        onClose={() => {
          setManageExecutionBatchesOpen(false);

          if (currentStageBatches.length > 0) {
            setBatchParticipantDialogOpen(true);

            setPendingExecutionRoundId(
              selectedExecutionBatchId ?? currentStageBatches[0]?.execution_round_id ?? null,
            );
          }
        }}
        onCreateBatch={() => {
          setEditingExecutionBatchId(null);

          setPendingExecutionRoundId(null);

          setCreateExecutionBatchOpen(true);
        }}
        onEditBatch={(executionRoundId) => {
          setManageExecutionBatchesOpen(false);

          setEditingExecutionBatchId(executionRoundId);

          setPendingExecutionRoundId(executionRoundId);

          setCreateExecutionBatchOpen(true);
        }}
        onViewStudents={(executionRoundId) => {
          setManageExecutionBatchesOpen(false);

          setViewingExecutionBatchId(executionRoundId);

          setPendingExecutionRoundId(executionRoundId);

          setSelectedExecutionBatchId(executionRoundId);

          setBatchParticipantDialogOpen(true);
        }}
        onContinue={() => {
          setManageExecutionBatchesOpen(false);

          setBatchParticipantDialogOpen(false);

          toast.success("Execution batches configured.");
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
