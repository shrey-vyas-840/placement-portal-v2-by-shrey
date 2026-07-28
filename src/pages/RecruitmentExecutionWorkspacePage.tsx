import { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useSearch } from "@tanstack/react-router";
import { toast } from "sonner";
import { recruitmentExecutionService } from "@/services/recruitmentExecutionService";
import {
  RecruitmentExecutionFinalizationEngine,
  type FinalizationPreparationResult,
} from "@/services/recruitment/recruitmentExecutionFinalizationEngine";
import { useNavigate } from "@tanstack/react-router";
import { getExecutionBootstrapContext } from "@/services/recruitmentExecutionBootstrapService";
import AttendanceReviewDialog from "@/components/recruitment-workspace/AttendanceReviewDialog";
import FinalizationVerificationDialog, {
  type FinalizationVerificationResult,
} from "@/components/recruitment-workspace/FinalizationVerificationDialog";
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

  const [finalizationDialogOpen, setFinalizationDialogOpen] = useState(false);

  const [finalizationPreparation, setFinalizationPreparation] =
    useState<FinalizationPreparationResult | null>(null);

  const [finalizationLoading, setFinalizationLoading] = useState(false);

  const [roundDirty, setRoundDirty] = useState(false);

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [workspace, setWorkspace] = useState<RecruitmentExecutionWorkspace | null>(null);

  const [selectedRoundId, setSelectedRoundId] = useState("");

  const [selectedTimeline, setSelectedTimeline] = useState<"COMMON" | string>("COMMON");

  const [selectedStage, setSelectedStage] = useState<number | null>(null);

  type WorkspaceNavigationState = {
    stageNumber?: number;
    executionRoundId?: string;
    executionBatchId?: string;
  };

  const [navigationRestore, setNavigationRestore] = useState<WorkspaceNavigationState | null>(null);

  const [attendanceReviewOpen, setAttendanceReviewOpen] = useState(false);

  const [createRoundOpen, setCreateRoundOpen] = useState(false);

  const [progressSummaryOpen, setProgressSummaryOpen] = useState(false);

  const [executionModeDialogOpen, setExecutionModeDialogOpen] = useState(false);

  const [batchParticipantDialogOpen, setBatchParticipantDialogOpen] = useState(false);

  const [progressToNextRound, setProgressToNextRound] = useState(false);

  const [stageConfigurationMode, setStageConfigurationMode] = useState(false);

  const [currentConfigurationStage, setCurrentConfigurationStage] = useState<number | null>(null);

  const [currentConfigurationRoleId, setCurrentConfigurationRoleId] = useState<string | null>(null);

  const [pendingExecutionRoundId, setPendingExecutionRoundId] = useState<string | null>(null);

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

  const restoreWorkspaceNavigation = useCallback(
    (data: RecruitmentExecutionWorkspace) => {
      if (data.rounds.length === 0) {
        return;
      }

      const stageNumber =
        navigationRestore?.stageNumber ?? selectedStage ?? data.rounds[0].stage_number;

      const stageRounds = data.rounds
        .filter((r) => r.stage_number === stageNumber)
        .sort((a, b) => a.round_order - b.round_order);

      const selectedRound =
        stageRounds.find((r) => r.execution_round_id === navigationRestore?.executionRoundId) ??
        stageRounds[0] ??
        data.rounds[0];

      setSelectedStage(selectedRound.stage_number);
      setSelectedRoundId(selectedRound.execution_round_id);

      const stageBatches = data.executionBatches
        .filter((batch) => batch.parent_execution_round_id === selectedRound.execution_round_id)
        .sort((a, b) => a.round_order - b.round_order);

      setSelectedExecutionBatchId(
        navigationRestore?.executionBatchId ?? stageBatches[0]?.execution_round_id ?? null,
      );

      if (selectedRound.scope === "COMMON") {
        setSelectedTimeline("COMMON");
      } else {
        const mapping = data.roundRoleMappings.find(
          (m) => m.execution_round_id === selectedRound.execution_round_id,
        );

        setSelectedTimeline(mapping?.drive_role_id ?? "COMMON");
      }

      setNavigationRestore(null);
    },
    [navigationRestore, selectedStage],
  );

  //----------------------------------------------------LOADWORKSPACE()---------------------------------------------------------------

  const loadWorkspace = useCallback(async () => {
    setLoading(true);

    try {
      const data = await recruitmentExecutionService.getExecutionDashboard(executionId);

      setWorkspace(data);

      if (navigationRestore) {
        restoreWorkspaceNavigation(data);
      } else if (selectedRoundId) {
        const existingRound = data.rounds.find((r) => r.execution_round_id === selectedRoundId);

        if (!existingRound) {
          restoreWorkspaceNavigation(data);
          return;
        }

        setSelectedStage(existingRound.stage_number);

        const firstBatch = data.executionBatches
          .filter((b) => b.parent_execution_round_id === existingRound.execution_round_id)
          .sort((a, b) => a.round_order - b.round_order)[0];

        setSelectedExecutionBatchId(firstBatch?.execution_round_id ?? null);
      } else {
        restoreWorkspaceNavigation(data);
      }
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

      if (data.rounds.length === 0) {
        setCreateRoundOpen(true);
      } else {
        setCreateRoundOpen(false);
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
      setRoundDirty(false);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error(error);

      toast.error(error instanceof Error ? error.message : "Unable to load execution workspace.");
    } finally {
      setLoading(false);
    }
  }, [executionId, navigationRestore, restoreWorkspaceNavigation, selectedRoundId]);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  const selectedStageRounds = useMemo(() => {
    if (!workspace || selectedStage == null) {
      return [];
    }

    return workspace.rounds
      .filter(
        (round) => round.stage_number === selectedStage && round.parent_execution_round_id == null,
      )
      .sort((a, b) => a.round_order - b.round_order);
  }, [workspace, selectedStage]);

  const selectedRound = useMemo(() => {
    if (!selectedStageRounds.length) {
      return null;
    }

    if (selectedRoundId) {
      const round = selectedStageRounds.find((r) => r.execution_round_id === selectedRoundId);

      if (round) {
        return round;
      }
    }

    return selectedStageRounds[0];
  }, [selectedStageRounds, selectedRoundId]);

  const selectedExecutionBatch = useMemo(() => {
    if (!workspace || !selectedExecutionBatchId) {
      return null;
    }

    const batch =
      workspace.executionBatches.find((b) => b.execution_round_id === selectedExecutionBatchId) ??
      null;

    if (!batch) {
      return null;
    }

    if (batch.parent_execution_round_id !== selectedRoundId) {
      return null;
    }

    return batch;
  }, [workspace, selectedExecutionBatchId, selectedRoundId]);

  const isMultipleExecutionStage = useMemo(() => {
    if (!workspace || selectedStage === null) {
      return false;
    }

    //
    // A stage is considered MULTIPLE only if the admin
    // explicitly configured execution batches for THIS stage.
    //
    return workspace.executionBatches.some((batch) => batch.stage_number === selectedStage);
  }, [workspace, selectedStage]);

  const executionMode: ExecutionMode = isMultipleExecutionStage ? "MULTIPLE" : "SINGLE";

  const showExecutionBatchPanel = isMultipleExecutionStage;

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
    console.log("Selected Batch", selectedExecutionBatch?.execution_round_id);

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
        !showExecutionBatchPanel || !selectedExecutionBatch?.execution_round_id
          ? workspace.participants.length
          : workspace.participants.filter((participant) =>
              new Set(
                workspace.executionBatchParticipants
                  .filter(
                    (assignment) =>
                      assignment.execution_round_id === selectedExecutionBatch?.execution_round_id,
                  )
                  .map((a) => a.execution_participant_id),
              ).has(participant.execution_participant_id),
            ).length,
      );

      if (!isMultipleExecutionStage || !selectedExecutionBatch) {
        return workspace.participants;
      }

      const assignedIds = new Set(
        workspace.executionBatchParticipants
          .filter(
            (assignment) =>
              assignment.execution_round_id === selectedExecutionBatch?.execution_round_id,
          )
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
  }, [
    workspace,
    selectedRound,
    selectedExecutionBatch,
    showExecutionBatchPanel,
    isMultipleExecutionStage,
  ]);

  const finalizationEngine = useMemo(() => {
    if (!workspace) {
      return null;
    }

    return new RecruitmentExecutionFinalizationEngine({
      supabase: recruitmentExecutionService.getSupabaseClient(),

      workspace,
    });
  }, [workspace]);

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

    if (!isMultipleExecutionStage) {
      return [];
    }

    const assigned = new Set(
      workspace.executionBatchParticipants.map((assignment) => assignment.execution_participant_id),
    );

    return workspace.participants.filter(
      (participant) => !assigned.has(participant.execution_participant_id),
    );
  }, [workspace, isMultipleExecutionStage]);

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
        const assignedRows = workspace.participants.filter((participant) =>
          assignedIds.has(participant.execution_participant_id),
        );

        const completed = assignedRows.every((participant) => {
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

          selected: batch.execution_round_id === selectedExecutionBatch?.execution_round_id,
        };
      })
      .sort((a, b) => a.round_order - b.round_order);
  }, [workspace, selectedStage, selectedExecutionBatch?.execution_round_id, editedRows]);

  const metrics = useMemo(
    () => ({
      totalParticipants: isMultipleExecutionStage
        ? currentStageBatches.reduce((sum, batch) => sum + batch.participant_count, 0)
        : participants.length,
      totalRounds: workspace?.rounds.length ?? 0,
      finalizedRounds: 0,
    }),
    [participants, workspace, isMultipleExecutionStage, currentStageBatches],
  );

  const allExecutionBatchesCompleted = useMemo(() => {
    if (!isMultipleExecutionStage) {
      return true;
    }

    if (unassignedShortlistedParticipants.length > 0) {
      return false;
    }

    return currentStageBatches.every((batch) => {
      if (batch.participant_count === 0) {
        return true;
      }

      return batch.completed;
    });
  }, [isMultipleExecutionStage, currentStageBatches, unassignedShortlistedParticipants]);

  const executionFinalized = workspace?.execution.execution_status === "FINALIZED";

  const handleSaveRound = async () => {
    setSaving(true);

    try {
      if (!workspace || !selectedRound) {
        return;
      }

      console.log("SAVE ROUND - START");
      console.log(
        "SAVE BATCH ASSIGNMENTS",
        Object.entries(executionBatchAssignments)
          .filter(([, executionRoundId]) => Boolean(executionRoundId))
          .map(([executionParticipantId, executionRoundId]) => ({
            executionParticipantId,
            executionRoundId,
          })),
      );
      const result = await recruitmentExecutionService.saveRound({
        executionId: workspace.execution.execution_id,
        executionRoundId: selectedRound.execution_round_id,
        executionRevision: workspace.execution.revision_number,
        batchAssignments: Object.entries(executionBatchAssignments)
          .filter(([, executionRoundId]) => Boolean(executionRoundId))
          .map(([executionParticipantId, executionRoundId]) => ({
            executionParticipantId,
            executionRoundId,
          })),
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
    if (!workspace || !finalizationEngine) {
      return;
    }

    try {
      setFinalizationLoading(true);

      const preparation = await finalizationEngine.prepareFinalization();

      setFinalizationPreparation(preparation);

      setFinalizationDialogOpen(true);
    } catch (error) {
      console.error(error);

      toast.error(error instanceof Error ? error.message : "Unable to prepare Final Save.");
    } finally {
      setFinalizationLoading(false);
    }
  };

  const handleFinalizationConfirmed = async (result: FinalizationVerificationResult) => {
    if (!workspace || !finalizationEngine || !finalizationPreparation) {
      return;
    }

    try {
      setFinalizationLoading(true);

      const {
        data: { user },
      } = await recruitmentExecutionService.getSupabaseClient().auth.getUser();

      if (!user) {
        throw new Error("Unable to determine the current administrator.");
      }

      await finalizationEngine.finalize({
        finalizedBy: user.id,

        preparation: finalizationPreparation,

        verification: result,
      });

      toast.success("Recruitment execution finalized successfully.");

      setFinalizationDialogOpen(false);

      setFinalizationPreparation(null);

      await loadWorkspace();
    } catch (error) {
      console.error(error);

      toast.error(
        error instanceof Error ? error.message : "Unable to finalize recruitment execution.",
      );
    } finally {
      setFinalizationLoading(false);
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
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-5 px-6 py-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                  Execution Workspace
                </p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                  Recruitment Execution
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-600">
                  Execute recruitment rounds, shortlist candidates and finalize selections.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="inline-flex rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
                  Revision {workspace.execution.revision_number}
                </span>

                <span className="inline-flex rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700">
                  {metrics.totalRounds} Rounds
                </span>

                <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
                  {executionFinalized ? "Finalized" : "In Progress"}
                </span>
              </div>
            </div>

            <Link
              to="/admin/recruitment"
              className="inline-flex h-11 items-center justify-center rounded-full border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Back
            </Link>
          </div>

          <div className="grid gap-3 border-t border-slate-200 bg-slate-50/80 px-6 py-5 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                Participants
              </div>
              <div className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                {metrics.totalParticipants}
              </div>
              <div className="mt-1 text-sm text-slate-500">Active in this execution</div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                Rounds
              </div>
              <div className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                {metrics.totalRounds}
              </div>
              <div className="mt-1 text-sm text-slate-500">Available in this stage flow</div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                Finalized
              </div>
              <div className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                {metrics.finalizedRounds}
              </div>
              <div className="mt-1 text-sm text-slate-500">Saved rounds so far</div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                Revision
              </div>
              <div className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                {workspace.execution.revision_number}
              </div>
              <div className="mt-1 text-sm text-slate-500">Current execution revision</div>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <ExecutionProgressBar
            rounds={workspace.rounds}
            roundRoleMappings={workspace.roundRoleMappings}
            timelines={executionTimelines}
            remainingActiveRoles={workspace.remainingActiveRoles}
            selectedStage={selectedStage}
            onStageSelect={(stageNumber) => {
              setViewingExecutionBatchId(null);
              setPendingExecutionRoundId(null);
              setSelectedStage(stageNumber);

              const firstRound = workspace.rounds
                .filter((r) => r.stage_number === stageNumber)
                .sort((a, b) => a.round_order - b.round_order)[0];

              if (!firstRound) {
                return;
              }

              setSelectedRoundId(firstRound.execution_round_id);

              const firstBatch = workspace.executionBatches
                .filter((b) => b.parent_execution_round_id === firstRound.execution_round_id)
                .sort((a, b) => a.round_order - b.round_order)[0];

              setSelectedExecutionBatchId(firstBatch?.execution_round_id ?? null);

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

        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  Stage {selectedStage}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {selectedStageRounds.length} Round
                  {selectedStageRounds.length === 1 ? "" : "s"}
                </p>
              </div>

              <p className="max-w-2xl text-sm text-slate-600">
                Manage attendance, gate status and progression.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600">
              <span className="font-medium text-slate-900">{participants.length}</span>
              Participants
            </div>
          </div>

          <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
            {selectedStageRounds.map((round) => (
              <button
                key={round.execution_round_id}
                type="button"
                onClick={() => {
                  setSelectedRoundId(round.execution_round_id);

                  const firstBatch = workspace.executionBatches
                    .filter((b) => b.parent_execution_round_id === round.execution_round_id)
                    .sort((a, b) => a.round_order - b.round_order)[0];

                  setSelectedExecutionBatchId(firstBatch?.execution_round_id ?? null);

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
                className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition ${
                  selectedRoundId === round.execution_round_id
                    ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {round.round_name}
              </button>
            ))}
          </div>

          {isMultipleExecutionStage && (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-slate-900">Execution Batches</h3>

                  <p className="text-sm text-slate-600">
                    {currentStageBatches.filter((b) => b.participant_count > 0).length} of{" "}
                    {currentStageBatches.length} batches in use ·{" "}
                    {currentStageBatches.reduce((sum, batch) => sum + batch.participant_count, 0)}{" "}
                    students assigned
                  </p>
                </div>

                <button
                  type="button"
                  className="inline-flex h-10 items-center rounded-full border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
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
            </div>
          )}

          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
            <div className="max-h-[72vh] overflow-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead className="sticky top-0 z-10 bg-slate-50">
                  <tr className="border-b border-slate-200">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Student
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Enrollment
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Selected Roles
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Attendance
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Gate
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Progression
                    </th>

                    {isMultipleExecutionStage && (
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Execution Batch
                      </th>
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
                      <tr
                        key={participant.execution_participant_id}
                        className="border-b border-slate-100 transition-colors hover:bg-slate-50"
                      >
                        <td className="px-4 py-3 align-top">
                          <div className="font-medium text-slate-900">
                            {`${participant.student.first_name} ${participant.student.last_name}`}
                          </div>

                          <div className="mt-1 text-xs text-slate-500">
                            {participant.student.institute_email}
                          </div>
                        </td>

                        <td className="px-4 py-3 align-top text-slate-700">
                          {participant.student.enrollment_no}
                        </td>

                        <td className="px-4 py-3 align-top">
                          <div className="flex flex-wrap gap-1.5">
                            {participant.selected_roles.map((role) => (
                              <span
                                key={role.drive_role_id}
                                className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
                              >
                                {role.drive_role_name}
                              </span>
                            ))}
                          </div>
                        </td>

                        <td className="px-4 py-3 align-top">
                          <select
                            className={`w-full min-w-37.5 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                              editedRow?.attendanceStatus === "PRESENT"
                                ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                                : editedRow?.attendanceStatus === "ABSENT"
                                  ? "border-amber-300 bg-amber-50 text-amber-700"
                                  : "border-slate-300 bg-white text-slate-700"
                            }`}
                            value={
                              editedRows[participant.execution_participant_id]?.attendanceStatus ??
                              ""
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
                              <p className="mt-1 text-xs text-emerald-600">Allowed Absence</p>
                            )}
                        </td>

                        <td className="px-4 py-3 align-top">
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
                              <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                Allowed
                              </span>
                            )}

                            {participant.restriction_reason && (
                              <p className="max-w-xs text-xs text-slate-500">
                                {participant.restriction_reason}
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3 align-top">
                          <select
                            className="w-full min-w-37.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                            value={
                              editedRows[participant.execution_participant_id]?.progressionStatus ??
                              "NONE"
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

                        {isMultipleExecutionStage && (
                          <td className="px-4 py-3 align-top">
                            {editedRow?.progressionStatus === "SHORTLISTED" ? (
                              <select
                                className="w-full min-w-37.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                                value={
                                  executionBatchAssignments[participant.execution_participant_id] ??
                                  ""
                                }
                                onChange={(e) => {
                                  const batchId = e.target.value;

                                  if (!batchId) {
                                    return;
                                  }

                                  setExecutionBatchAssignments((prev) => ({
                                    ...prev,
                                    [participant.execution_participant_id]: batchId,
                                  }));

                                  setRoundDirty(true);
                                  setHasUnsavedChanges(true);
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
                              <span className="text-xs text-slate-500">—</span>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-semibold text-slate-900">Attendance Review</div>

                  <span className="inline-flex rounded-full bg-slate-200 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-700">
                    Required before save
                  </span>
                </div>

                <div className="text-sm text-slate-600">
                  Review absentees and restriction overrides before saving.
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setAttendanceReviewOpen(true)}
                  disabled={saving || executionFinalized}
                  className="inline-flex h-11 items-center rounded-full border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isCurrentRoundSaved && !roundDirty ? "✓ Round Saved" : "Save Round"}
                </button>

                {workspace.transition.requiresRoleAssignment &&
                  workspace.remainingActiveRoles.length > 0 && (
                    <button
                      type="button"
                      disabled
                      className="inline-flex h-11 items-center rounded-full border border-amber-200 bg-amber-50 px-4 text-sm font-medium text-amber-800"
                    >
                      Role assignment pending
                    </button>
                  )}

                <button
                  type="button"
                  onClick={handleProgressToNextRound}
                  disabled={
                    saving ||
                    executionFinalized ||
                    hasUnsavedChanges ||
                    !isCurrentRoundSaved ||
                    (workspace.transition.requiresRoleAssignment &&
                      workspace.remainingActiveRoles.length > 0) ||
                    !allExecutionBatchesCompleted
                  }
                  className="inline-flex h-11 items-center rounded-full border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Progress to Next Stage
                </button>

                <button
                  type="button"
                  onClick={handleFinalizeExecution}
                  disabled={
                    saving ||
                    executionFinalized ||
                    !isCurrentRoundSaved ||
                    roundDirty ||
                    hasUnsavedChanges ||
                    !allExecutionBatchesCompleted
                  }
                  className="inline-flex h-11 items-center rounded-full bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Final Save
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              {workspace.transition.requiresRoleAssignment &&
                workspace.remainingActiveRoles.length > 0 && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
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
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Complete all execution batches and assign every shortlisted participant before
                  progressing to the next stage.
                </div>
              )}
            </div>
          </div>
        </div>
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
          setExecutionModeDialogOpen(false);

          if (mode === "SINGLE") {
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
        commonStageLocked={workspace.commonStageLocked}

        commonStageLockReason={workspace.commonStageLockReason ?? undefined}
        onCreate={async (data) => {
          if (saving || !workspace) {
            return;
          }

          setSaving(true);

          try {
            const round = await recruitmentExecutionService.createExecutionBatch({
              executionId: workspace.execution.execution_id,

              creationMode: progressToNextRound ? "NEXT_STAGE" : "PARALLEL_STAGE",

              roundOrder: Math.max(0, ...workspace.rounds.map((r) => r.round_order)) + 1,

              roundName: data.roundName.trim(),

              scope: data.roundType === "COMMON" ? "COMMON" : "ROLE_SPECIFIC",

              roleIds: data.roundType === "COMMON" ? [] : data.roleIds,

              executionParticipantIds: [],

              scheduledDate: data.scheduledDate,
              scheduledTime: data.scheduledTime,
              venue: data.venue,
              remarks: data.remarks,
            });

            setCreateRoundOpen(false);

            setCurrentConfigurationStage(round.stage_number);

            setCurrentConfigurationRoleId(
              data.roundType === "ROLE_SPECIFIC" ? (data.roleIds[0] ?? null) : null,
            );

            setSelectedStage(round.stage_number);

            setSelectedRoundId(round.execution_round_id);

            setPendingExecutionRoundId(round.execution_round_id);

            setNavigationRestore({
              stageNumber: round.stage_number,
              executionRoundId: round.execution_round_id,
            });

            setProgressSummaryOpen(false);

            setExecutionModeDialogOpen(true);
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
            ? workspace.participants.length
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
            if (!pendingExecutionRoundId) {
              throw new Error("Parent execution stage not found.");
            }

            const batch = await recruitmentExecutionService.createExecutionChildBatch({
              executionId: workspace.execution.execution_id,

              parentExecutionRoundId: pendingExecutionRoundId,

              batchName: data.batchName,

              scheduledDate: data.scheduledDate,

              scheduledTime: data.scheduledTime,

              venue: data.venue,

              remarks: data.remarks,
            });

            setNavigationRestore({
              stageNumber: selectedStage ?? undefined,
              executionRoundId: pendingExecutionRoundId ?? undefined,
              executionBatchId: batch.execution_round_id,
            });

            await loadWorkspace();

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

            if (!selectedExecutionBatch?.execution_round_id) {
              throw new Error("Execution batch not selected.");
            }

            await recruitmentExecutionService.assignExecutionBatchParticipants({
              executionRoundId:
                selectedExecutionBatch?.execution_round_id ??
                (() => {
                  throw new Error("Execution batch not selected.");
                })(),
              executionParticipantIds: participantIds,
            });

            await loadWorkspace();

            setExecutionBatchAssignments((prev) => ({ ...prev }));

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

            const batch =
              currentStageBatches.find(
                (b) => b.execution_round_id === selectedExecutionBatch?.execution_round_id,
              ) ?? currentStageBatches[0];

            setPendingExecutionRoundId(batch?.parent_execution_round_id ?? selectedRoundId);
          }
        }}
        onCreateBatch={() => {
          setEditingExecutionBatchId(null);

          setPendingExecutionRoundId(selectedRoundId);

          setCreateExecutionBatchOpen(true);
        }}
        onEditBatch={(executionRoundId) => {
          setManageExecutionBatchesOpen(false);

          setEditingExecutionBatchId(executionRoundId);

          setPendingExecutionRoundId(
            workspace.executionBatches.find((b) => b.execution_round_id === executionRoundId)
              ?.parent_execution_round_id ?? selectedRoundId,
          );

          setCreateExecutionBatchOpen(true);
        }}
        onViewStudents={(executionRoundId) => {
          setManageExecutionBatchesOpen(false);

          setViewingExecutionBatchId(executionRoundId);
          setSelectedExecutionBatchId(executionRoundId);
          const batch = workspace.executionBatches.find(
            (b) => b.execution_round_id === executionRoundId,
          );

          setPendingExecutionRoundId(batch?.parent_execution_round_id ?? selectedRoundId);
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

      <FinalizationVerificationDialog
        open={finalizationDialogOpen}
        loading={finalizationLoading}
        preparation={finalizationPreparation}
        onCancel={() => {
          if (finalizationLoading) {
            return;
          }

          setFinalizationDialogOpen(false);
        }}
        onConfirm={handleFinalizationConfirmed}
      />
    </div>
  );
}

export default RecruitmentExecutionWorkspacePage;
