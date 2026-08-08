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
import ExecutionNavigator from "@/components/recruitment-workspace/ExecutionNavigator";
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
import { recruitmentExecutionAttendanceExportService } from "@/services/recruitmentExecutionAttendanceExportService";
import { exportExcelBuilder } from "@/services/export/exportExcelBuilder";
import { buildAttendanceExportConfiguration } from "@/services/recruitmentExecution/attendanceExportConfig";

function getEffectiveStageNumber(
  round: Pick<
    RecruitmentExecutionRoundRow,
    "execution_round_id" | "parent_execution_round_id" | "stage_number"
  >,
  rounds: Array<
    Pick<
      RecruitmentExecutionRoundRow,
      "execution_round_id" | "parent_execution_round_id" | "stage_number"
    >
  >,
): number {
  const roundById = new Map(rounds.map((item) => [item.execution_round_id, item]));

  let current = round;
  const visited = new Set<string>();

  while (current.parent_execution_round_id) {
    if (visited.has(current.execution_round_id)) {
      break;
    }

    visited.add(current.execution_round_id);

    const parent = roundById.get(current.parent_execution_round_id);

    if (!parent) {
      break;
    }

    current = parent;
  }

  return current.stage_number;
}

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

  const [assignmentExecutionBatchId, setAssignmentExecutionBatchId] = useState<string | null>(null);

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

  const [editedRows, setEditedRows] = useState<
    Record<string, Record<string, RecruitmentExecutionEditedRow>>
  >({});

  const getEditedRow = useCallback(
    (
      executionRoundId: string,
      executionParticipantId: string,
    ): RecruitmentExecutionEditedRow | undefined => {
      return editedRows[executionRoundId]?.[executionParticipantId];
    },
    [editedRows],
  );

  const setEditedRow = (
    executionRoundId: string,
    executionParticipantId: string,
    updates: Partial<RecruitmentExecutionEditedRow>,
  ) => {
    setEditedRows((previous) => ({
      ...previous,
      [executionRoundId]: {
        ...(previous[executionRoundId] ?? {}),
        [executionParticipantId]: {
          ...(previous[executionRoundId]?.[executionParticipantId] ?? {
            attendanceStatus: null,
            gateStatus: "ALLOWED",
            progressionStatus: "NONE",
            remarks: "",
            absenceDisposition: null,
            absenceReason: "",
            restrictionOverride: false,
            overrideReason: "",
          }),
          ...updates,
        },
      },
    }));
  };

  const restoreWorkspaceNavigation = useCallback(
    (data: RecruitmentExecutionWorkspace) => {
      if (data.rounds.length === 0) {
        return;
      }

      const restoredRound = navigationRestore?.executionRoundId
        ? data.rounds.find(
            (round) => round.execution_round_id === navigationRestore.executionRoundId,
          )
        : undefined;

      const stageNumber = restoredRound
        ? getEffectiveStageNumber(restoredRound, data.rounds)
        : (navigationRestore?.stageNumber ??
          selectedStage ??
          getEffectiveStageNumber(data.rounds[0], data.rounds));

      const stageRounds = data.rounds
        .filter((round) => getEffectiveStageNumber(round, data.rounds) === stageNumber)
        .sort((a, b) => {
          if (a.parent_execution_round_id == null && b.parent_execution_round_id != null) {
            return -1;
          }

          if (a.parent_execution_round_id != null && b.parent_execution_round_id == null) {
            return 1;
          }

          return a.round_order - b.round_order;
        });

      const selectedRound = restoredRound ?? stageRounds[0] ?? data.rounds[0];

      const effectiveStageNumber = getEffectiveStageNumber(selectedRound, data.rounds);

      setSelectedStage(effectiveStageNumber);
      setSelectedRoundId(selectedRound.execution_round_id);

      setSelectedExecutionBatchId(navigationRestore?.executionBatchId ?? null);

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
      console.log("========== EXECUTION BATCH DEBUG ==========");
      console.log("Execution Batches:", data.executionBatches);
      console.log("Execution Batch Count:", data.executionBatches.length);

      data.executionBatches.forEach((batch) => {
        console.log({
          id: batch.execution_round_id,
          parent: batch.parent_execution_round_id,
          stage: batch.stage_number,
          name: batch.round_name,
        });
      });
      if (navigationRestore) {
        restoreWorkspaceNavigation(data);
      } else if (selectedRoundId) {
        const existingRound = data.rounds.find((r) => r.execution_round_id === selectedRoundId);

        if (!existingRound) {
          restoreWorkspaceNavigation(data);
          return;
        }

        setSelectedStage(getEffectiveStageNumber(existingRound, data.rounds));

        setSelectedExecutionBatchId((previous) => previous);
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
        data.historySummary.map((item) => [
          `${item.execution_round_id}:${item.execution_participant_id}`,
          item,
        ]),
      );

      const runtimeSnapshot = data.runtimeSnapshot;
      console.log("Runtime Snapshot", runtimeSnapshot);
      console.log("Runtime Snapshot Participants", runtimeSnapshot?.participants);
      console.log("History Summary", data.historySummary);
      const initialState: Record<string, Record<string, RecruitmentExecutionEditedRow>> = {};

      data.rounds.forEach((round) => {
        initialState[round.execution_round_id] = {};

        data.participants.forEach((participant) => {
          const history = historyLookup.get(
            `${round.execution_round_id}:${participant.execution_participant_id}`,
          );

          const snapshotParticipant =
            round.stage_number === 1
              ? runtimeSnapshot.participants[participant.execution_participant_id]
              : undefined;

          initialState[round.execution_round_id][participant.execution_participant_id] = {
            attendanceStatus:
              history?.attendance_status ?? snapshotParticipant?.attendanceStatus ?? null,

            gateStatus:
              history?.gate_status ??
              snapshotParticipant?.gateStatus ??
              (participant.effective_gate_status === "RESTRICTED" ? "RESTRICTED" : "ALLOWED"),

            progressionStatus:
              history?.progression_status ?? snapshotParticipant?.progressionStatus ?? "NONE",

            remarks: history?.remarks ?? "",

            absenceDisposition: history?.absence_disposition ?? null,

            absenceReason: history?.absence_reason ?? "",

            restrictionOverride: history?.restriction_override ?? false,

            overrideReason: history?.restriction_override_reason ?? "",
          };
        });
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
      .filter((round) => getEffectiveStageNumber(round, workspace.rounds) === selectedStage)
      .sort((a, b) => {
        if (a.parent_execution_round_id == null && b.parent_execution_round_id != null) {
          return -1;
        }

        if (a.parent_execution_round_id != null && b.parent_execution_round_id == null) {
          return 1;
        }

        return a.round_order - b.round_order;
      });
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
    if (!workspace || !selectedExecutionBatchId || !selectedRound) {
      return null;
    }

    const batch =
      workspace.executionBatches.find((b) => b.execution_round_id === selectedExecutionBatchId) ??
      null;

    if (!batch) {
      return null;
    }

    // Validate against the resolved stage object,
    // not against asynchronously updated UI state.
    if (batch.parent_execution_round_id !== selectedRound.execution_round_id) {
      return null;
    }

    return batch;
  }, [workspace, selectedExecutionBatchId, selectedRound]);

  const isMultipleExecutionStage = useMemo(() => {
    if (!workspace || !selectedRound) {
      return false;
    }

    //
    // A stage is considered MULTIPLE only if the admin
    // explicitly configured execution batches for THIS stage.
    //
    return workspace.executionBatches.some(
      (batch) => getEffectiveStageNumber(batch, workspace.rounds) === selectedStage,
    );
  }, [workspace, selectedRound, selectedStage]);

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
    return !roundDirty && !hasUnsavedChanges;
  }, [roundDirty, hasUnsavedChanges]);

  //---------------------------------------------------------------------------------------------------------Participant Memo ---------------------------------------------------------------------------------------------------------

  const [participants, setParticipants] = useState<RecruitmentExecutionParticipantWithStudent[]>(
    [],
  );

  // -----------------------------------------------------------------------------
  // Participant Filters
  // -----------------------------------------------------------------------------

  const [searchQuery, setSearchQuery] = useState("");

  const [attendanceFilter, setAttendanceFilter] = useState<
    "ALL" | "PRESENT" | "ABSENT" | "PENDING"
  >("ALL");

  const [progressFilter, setProgressFilter] = useState<"ALL" | "NONE" | "SHORTLISTED" | "SELECTED">(
    "ALL",
  );

  const [gateFilter, setGateFilter] = useState<"ALL" | "ALLOWED" | "RESTRICTED" | "OVERRIDE">(
    "ALL",
  );

  const [roleFilter, setRoleFilter] = useState("ALL");

  const [batchFilter, setBatchFilter] = useState("ALL");

  useEffect(() => {
    if (!selectedRound) {
      return;
    }

    setSelectedExecutionBatchId(null);

    setBatchFilter("ALL");
    setRoleFilter("ALL");
    setAttendanceFilter("ALL");
    setProgressFilter("ALL");
    setGateFilter("ALL");
    setSearchQuery("");

    const firstBatch =
      workspace?.executionBatches
        .filter((batch) => batch.parent_execution_round_id === selectedRound.execution_round_id)
        .sort((a, b) => a.round_order - b.round_order)[0] ?? null;

    setSelectedExecutionBatchId(firstBatch?.execution_round_id ?? null);
  }, [selectedRound, workspace]);

  useEffect(() => {
    let cancelled = false;

    const syncParticipants = async () => {
      if (!workspace || !selectedRound) {
        setParticipants([]);
        return;
      }

      if (getEffectiveStageNumber(selectedRound, workspace.rounds) === 1) {
        setParticipants(workspace.participants);
        return;
      }
      console.log("WORKSPACE SELECTION", {
        selectedRoundId: selectedRound.execution_round_id,
        selectedRoundName: selectedRound.round_name,
        selectedExecutionBatchId,
      });
      try {
        const data = await recruitmentExecutionService.loadRoundParticipants(
          selectedRound.execution_round_id,
        );

        if (!cancelled) {
          setParticipants(data);
        }
      } catch (error) {
        console.error(error);

        if (!cancelled) {
          setParticipants([]);
          toast.error(
            error instanceof Error ? error.message : "Unable to load stage participants.",
          );
        }
      }
    };

    void syncParticipants();

    return () => {
      cancelled = true;
    };
  }, [workspace, selectedRound, selectedExecutionBatchId]);

  //---------------------------------------------------------------------------------------Completed Participant Memo----------------------------------------------------------------------------------------------

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
      const effectiveStageNumber = getEffectiveStageNumber(round, workspace.rounds);

      const existing = groups.get(effectiveStageNumber);

      if (existing) {
        existing.rounds.push(round);
      } else {
        groups.set(effectiveStageNumber, {
          stageNumber: effectiveStageNumber,
          rounds: [round],
        });
      }
    });

    return [...groups.values()]
      .sort((a, b) => a.stageNumber - b.stageNumber)
      .filter((stage) => (selectedStage === null ? true : stage.stageNumber === selectedStage));
  }, [workspace, selectedTimeline, selectedStage]);

  const stageParticipants = useMemo(() => {
    return participants;
  }, [participants]);

  const shortlistedParticipants = useMemo(
    () =>
      stageParticipants.filter((participant) => {
        const row = getEditedRow(
          selectedRound!.execution_round_id,
          participant.execution_participant_id,
        );
        const attendanceAllowed =
          row?.attendanceStatus === "PRESENT" ||
          (row?.attendanceStatus === "ABSENT" && row?.absenceDisposition === "ALLOWED");

        const gateAllowed = row?.restrictionOverride === true || row?.gateStatus === "ALLOWED";

        return row?.progressionStatus === "SHORTLISTED" && attendanceAllowed && gateAllowed;
      }),
    [participants, editedRows],
  );

  const unassignedStageParticipants = useMemo(() => {
    if (!isMultipleExecutionStage) {
      return [];
    }

    return stageParticipants.filter((participant) => {
      const assignedBatchId = executionBatchAssignments[participant.execution_participant_id];

      return !assignedBatchId;
    });
  }, [stageParticipants, executionBatchAssignments, isMultipleExecutionStage]);

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

  const roundRoleLookup = useMemo(() => {
    const lookup = new Map<string, string[]>();

    if (!workspace) {
      return lookup;
    }

    workspace.roundRoleMappings.forEach((mapping) => {
      const existing = lookup.get(mapping.execution_round_id) ?? [];

      const role = workspace.participants
        .flatMap((participant) => participant.selected_roles)
        .find((r) => r.drive_role_id === mapping.drive_role_id);

      existing.push(role?.drive_role_name ?? "Unknown Role");

      lookup.set(mapping.execution_round_id, existing);
    });

    return lookup;
  }, [workspace]);

  const shortlistedRoleSummary = useMemo<ActiveRoleOption[]>(() => {
    const roleMap = new Map<string, ActiveRoleOption>();

    const allowedRoleIds = new Set(currentRoundRoleIds ?? []);

    shortlistedParticipants.forEach((participant) => {
      participant.selected_roles
        .filter((role) => allowedRoleIds.size === 0 || allowedRoleIds.has(role.drive_role_id))
        .forEach((role) => {
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
  }, [shortlistedParticipants, currentRoundRoleIds]);

  const currentRoundRoleSummary = useMemo(() => {
    if (!currentRoundRoleIds) {
      return shortlistedRoleSummary;
    }

    return shortlistedRoleSummary.filter((role) => currentRoundRoleIds.includes(role.driveRoleId));
  }, [currentRoundRoleIds, shortlistedRoleSummary]);

  const workspaceParticipants = useMemo(() => {
    if (!selectedRound) {
      return [];
    }

    // Common round -> everyone
    if (selectedRound.scope === "COMMON") {
      return participants;
    }

    const allowedRoleIds = new Set(
      workspace?.roundRoleMappings
        .filter((mapping) => mapping.execution_round_id === selectedRound.execution_round_id)
        .map((mapping) => mapping.drive_role_id) ?? [],
    );

    return participants.filter((participant) =>
      participant.selected_roles.some((role) => allowedRoleIds.has(role.drive_role_id)),
    );
  }, [workspace, participants, selectedRound]);

  const currentRoundBatches = useMemo(() => {
    if (!workspace || !selectedRound) {
      return [];
    }

    return workspace.executionBatches
      .filter((batch) => batch.parent_execution_round_id === selectedRound.execution_round_id)
      .map((batch) => {
        const assignedRows = workspaceParticipants.filter(
          (participant) =>
            executionBatchAssignments[participant.execution_participant_id] ===
            batch.execution_round_id,
        );

        const completed = assignedRows.every((participant) => {
          const row = getEditedRow(
            selectedRound!.execution_round_id,
            participant.execution_participant_id,
          );

          return row?.attendanceStatus !== null;
        });

        return {
          ...batch,

          participant_count: assignedRows.length,

          present_count: assignedRows.filter((participant) => {
            const row = getEditedRow(
              selectedRound!.execution_round_id,
              participant.execution_participant_id,
            );

            return row?.attendanceStatus === "PRESENT";
          }).length,

          absent_count: assignedRows.filter((participant) => {
            const row = getEditedRow(
              selectedRound!.execution_round_id,
              participant.execution_participant_id,
            );

            return row?.attendanceStatus === "ABSENT";
          }).length,

          shortlisted_count: assignedRows.filter((participant) => {
            const row = getEditedRow(
              selectedRound!.execution_round_id,
              participant.execution_participant_id,
            );

            return row?.progressionStatus === "SHORTLISTED";
          }).length,

          selected_count: assignedRows.filter((participant) => {
            const row = getEditedRow(
              selectedRound!.execution_round_id,
              participant.execution_participant_id,
            );

            return row?.progressionStatus === "SELECTED";
          }).length,

          completed,

          pending:
            assignedRows.length -
            assignedRows.filter((participant) => {
              const row = getEditedRow(
                selectedRound!.execution_round_id,
                participant.execution_participant_id,
              );

              return row?.attendanceStatus !== null;
            }).length,

          selected: batch.execution_round_id === selectedExecutionBatch?.execution_round_id,
        };
      })
      .sort((a, b) => a.round_order - b.round_order);
  }, [
    workspaceParticipants,
    selectedStage,
    selectedExecutionBatch?.execution_round_id,
    editedRows,
    stageParticipants,
    executionBatchAssignments,
  ]);

  const filteredParticipants = useMemo(() => {
    let rows = [...workspaceParticipants];

    // ------------------------------------------------------------
    // Search
    // ------------------------------------------------------------

    const query = searchQuery.trim().toLowerCase();

    if (query) {
      rows = rows.filter((participant) => {
        const fullName =
          `${participant.student.first_name} ${participant.student.last_name}`.toLowerCase();

        const enrollment = participant.student.enrollment_no.toLowerCase();

        const email = participant.student.institute_email.toLowerCase();

        const roles = participant.selected_roles
          .map((role) => role.drive_role_name)
          .join(" ")
          .toLowerCase();

        return (
          fullName.includes(query) ||
          enrollment.includes(query) ||
          email.includes(query) ||
          roles.includes(query)
        );
      });
    }

    // ------------------------------------------------------------
    // Attendance
    // ------------------------------------------------------------

    if (attendanceFilter !== "ALL") {
      rows = rows.filter((participant) => {
        const row = getEditedRow(
          selectedRound!.execution_round_id,
          participant.execution_participant_id,
        );

        if (attendanceFilter === "PENDING") {
          return row?.attendanceStatus == null;
        }

        return row?.attendanceStatus === attendanceFilter;
      });
    }

    // ------------------------------------------------------------
    // Progress
    // ------------------------------------------------------------

    if (progressFilter !== "ALL") {
      rows = rows.filter((participant) => {
        const row = getEditedRow(
          selectedRound!.execution_round_id,
          participant.execution_participant_id,
        );

        return (row?.progressionStatus ?? "NONE") === progressFilter;
      });
    }

    // ------------------------------------------------------------
    // Gate
    // ------------------------------------------------------------

    if (gateFilter !== "ALL") {
      rows = rows.filter((participant) => {
        const row = getEditedRow(
          selectedRound!.execution_round_id,
          participant.execution_participant_id,
        );

        if (gateFilter === "OVERRIDE") {
          return row?.restrictionOverride === true;
        }

        return (row?.gateStatus ?? "ALLOWED") === gateFilter;
      });
    }

    // ------------------------------------------------------------
    // Role
    // ------------------------------------------------------------

    if (roleFilter !== "ALL") {
      rows = rows.filter((participant) =>
        participant.selected_roles.some((role) => role.drive_role_id === roleFilter),
      );
    }

    // ------------------------------------------------------------
    // Batch
    // ------------------------------------------------------------

    if (batchFilter !== "ALL") {
      rows = rows.filter(
        (participant) =>
          executionBatchAssignments[participant.execution_participant_id] === batchFilter,
      );
    }

    return rows;
  }, [
    workspaceParticipants,
    searchQuery,
    attendanceFilter,
    progressFilter,
    gateFilter,
    roleFilter,
    batchFilter,
    executionBatchAssignments,
    editedRows,
  ]);

  const stageCompletionSummary = useMemo(() => {
    if (!workspace) {
      return {};
    }

    const summary: Record<
      number,
      {
        completed: boolean;
        totalParticipants: number;
        markedAttendance: number;
        pendingAttendance: number;
      }
    > = {};

    const stageNumbers = [
      ...new Set(workspace.rounds.map((round) => getEffectiveStageNumber(round, workspace.rounds))),
    ];

    stageNumbers.forEach((stageNumber) => {
      const participantIds = new Set<string>();

      //
      // Stage 1
      // Everyone in execution
      //
      if (stageNumber === 1) {
        workspace.participants.forEach((p) => participantIds.add(p.execution_participant_id));
      }

      //
      // Stage 2+
      // Everyone progressed into this stage
      //
      else {
        workspace.rounds
          .filter((r) => getEffectiveStageNumber(r, workspace.rounds) === stageNumber)
          .forEach((round) => {
            if (round.scope === "COMMON") {
              workspace.participants.forEach((p) => participantIds.add(p.execution_participant_id));
              return;
            }

            workspace.roundRoleMappings
              .filter((m) => m.execution_round_id === round.execution_round_id)
              .forEach((mapping) => {
                workspace.participants.forEach((participant) => {
                  if (
                    participant.selected_roles.some(
                      (role) => role.drive_role_id === mapping.drive_role_id,
                    )
                  ) {
                    participantIds.add(participant.execution_participant_id);
                  }
                });
              });
          });
      }

      const ids = [...participantIds];

      const stageRounds = workspace.rounds.filter(
        (r) => getEffectiveStageNumber(r, workspace.rounds) === stageNumber,
      );

      const markedAttendance = ids.filter((id) =>
        stageRounds.some((round) => {
          const row = getEditedRow(round.execution_round_id, id);
          return row?.attendanceStatus !== null;
        }),
      ).length;

      const pendingAttendance = ids.length - markedAttendance;

      summary[stageNumber] = {
        completed: pendingAttendance === 0,
        totalParticipants: ids.length,
        markedAttendance,
        pendingAttendance,
      };
    });

    return summary;
  }, [workspace, editedRows]);

  const metrics = useMemo(
    () => ({
      totalParticipants: isMultipleExecutionStage
        ? currentRoundBatches.reduce((sum, batch) => sum + batch.participant_count, 0)
        : participants.length,
      totalRounds: workspace?.rounds.length ?? 0,
      finalizedRounds: 0,
    }),
    [participants, workspace, isMultipleExecutionStage, currentRoundBatches],
  );

  const allExecutionBatchesCompleted = useMemo(() => {
    if (!isMultipleExecutionStage) {
      return true;
    }

    if (unassignedStageParticipants.length > 0) {
      return false;
    }

    return currentRoundBatches.every((batch) => {
      if (batch.participant_count === 0) {
        return true;
      }

      return batch.completed;
    });
  }, [isMultipleExecutionStage, currentRoundBatches, unassignedStageParticipants]);

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

      const savePayload = {
        executionId: workspace.execution.execution_id,
        executionRoundId: selectedRound.execution_round_id,
        executionRevision: workspace.execution.revision_number,
        batchAssignments: Object.entries(executionBatchAssignments)
          .filter(([, executionRoundId]) => Boolean(executionRoundId))
          .map(([executionParticipantId, executionRoundId]) => ({
            executionParticipantId,
            executionRoundId,
          })),
        participantRoles: workspaceParticipants.map((participant) => ({
          executionParticipantId: participant.execution_participant_id,
          roles: participant.selected_roles.map((role) => ({
            driveRoleId: role.drive_role_id,
            driveRoleName: role.drive_role_name,
          })),
        })),
        rows: workspaceParticipants.map((participant) => {
          const row = getEditedRow(
            selectedRound.execution_round_id,
            participant.execution_participant_id,
          );

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
      };

      const result =
        progressToNextRound && pendingExecutionRoundId
          ? await recruitmentExecutionService.executeStageProgression({
              ...savePayload,
              nextRoundId: pendingExecutionRoundId,
            })
          : await recruitmentExecutionService.saveRound(savePayload);

      console.log("SAVE ROUND - SERVICE RETURNED");
      toast.success("Round saved successfully.");
      setAttendanceReviewOpen(false);

      if (progressToNextRound) {
        toast.success(
          result.progressedParticipants > 0
            ? `${result.progressedParticipants} participant(s) progressed.`
            : "Stage progression completed.",
        );
      } else {
        toast.success("Round saved successfully.");
      }

      await loadWorkspace();

      console.log("SAVE ROUND - WORKSPACE RELOADED");

      /*
       * Progress workflow is complete.
       * Consume the pending progression context so
       * subsequent saves become pure Save commands.
       */
      if (progressToNextRound) {
        setPendingExecutionRoundId(null);
        setProgressToNextRound(false);
      }

      setRoundDirty(false);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error(error);

      toast.error(error instanceof Error ? error.message : "Unable to save round.");
    } finally {
      setSaving(false);
    }
  };

  const handlePreAttendanceExport = async () => {
    if (!selectedRound) return;

    try {
      const data = await recruitmentExecutionAttendanceExportService.getAttendanceExportData(
        executionId,
        selectedRound.execution_round_id,
      );

      const configuration = buildAttendanceExportConfiguration(data, "PRE");

      await exportExcelBuilder.export(
        configuration,
        configuration.dataset.columns.map((column) => column.key),
      );
    } catch (error) {
      console.error(error);
      toast.error("Unable to export attendance sheet.");
    }
  };

  const handlePostAttendanceExport = async () => {
    if (!selectedRound) return;

    try {
      const data = await recruitmentExecutionAttendanceExportService.getAttendanceExportData(
        executionId,
        selectedRound.execution_round_id,
      );

      const configuration = buildAttendanceExportConfiguration(data, "POST");

      await exportExcelBuilder.export(
        configuration,
        configuration.dataset.columns.map((column) => column.key),
      );
    } catch (error) {
      console.error(error);
      toast.error("Unable to export attendance report.");
    }
  };

  const handleProgressToNextRound = async () => {
    const shortlistedParticipants = workspaceParticipants.filter((participant) => {
      const row = getEditedRow(
        selectedRound!.execution_round_id,
        participant.execution_participant_id,
      );
      return row?.progressionStatus === "SHORTLISTED";
    });

    if (isMultipleExecutionStage) {
      const unassigned = unassignedStageParticipants.length;

      if (unassigned > 0) {
        toast.error(`${unassigned} participant(s) have not been assigned to an execution batch.`);
        return;
      }
    }

    if (shortlistedParticipants.length === 0) {
      toast.info(
        "No shortlisted participants remain. Please use Final Save to complete this execution.",
      );
      return;
    }
    setProgressSummaryOpen(true);
  };

  const canProgressToNextStage = useMemo(() => {
    if (participants.length === 0) {
      return false;
    }

    const pendingAttendance = participants.every((participant) => {
      const row = getEditedRow(
        selectedRound!.execution_round_id,
        participant.execution_participant_id,
      );

      return row?.attendanceStatus == null;
    });

    if (pendingAttendance) {
      return false;
    }

    if (isMultipleExecutionStage && unassignedStageParticipants.length > 0) {
      return false;
    }

    return true;
  }, [participants, editedRows, isMultipleExecutionStage, unassignedStageParticipants]);

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

  const workspaceData = workspace;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-[3000px] gap-4 px-0 xl:px-4 2xl:px-8">
        {/* Future Admin Menu */}
        <aside className="hidden xl:block w-[220px] shrink-0 border-r bg-background">
          {/* Reserved for Admin Sidebar */}
        </aside>

        <div className="min-w-0 flex-1">
          <div className="relative overflow-hidden rounded-3xl border border-blue-200 bg-gradient-to-r from-blue-800 via-blue-700 to-cyan-600 text-white shadow-xl">
            <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-white/10 blur-sm" />

            <div className="absolute bottom-0 right-20 h-28 w-28 rounded-full bg-white/10 blur-sm" />

            <div className="absolute -left-10 top-10 h-32 w-32 rounded-full bg-cyan-300/10 blur-xl" />
            <div className="relative z-10 flex flex-col gap-5 px-8 py-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.30em] text-white/70">
                    Execution Workspace
                  </p>
                  <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">
                    Recruitment Execution
                  </h1>
                  <p className="mt-1 max-w-2xl text-sm leading-6 text-white/85">
                    Execute recruitment rounds, shortlist candidates and finalize selections.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex rounded-full bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
                    Revision {workspaceData.execution.revision_number}
                  </span>

                  <span className="inline-flex rounded-full bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
                    {metrics.totalRounds} Rounds
                  </span>

                  <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
                    {executionFinalized ? "Finalized" : "In Progress"}
                  </span>
                </div>
              </div>

              <Link
                to="/admin/recruitment"
                className="inline-flex h-16 w-56 items-center justify-center rounded-full border border-white/80 bg-white/15 px-5 text-[24px] font-semibold text-white backdrop-blur-sm transition hover:bg-white/25"
              >
                Back
              </Link>
            </div>

            <div className="grid gap-4 border-t border-white/20 bg-white/10 px-8 py-6 backdrop-blur-sm md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-blue-400 bg-white px-5 py-3 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl">
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-600">
                  Participants
                </div>
                <div className="mt-2 text-5xl font-bold tracking-tight text-slate-900">
                  {metrics.totalParticipants}
                </div>
                <div className="mt-1 text-sm text-slate-500">Active in this execution</div>
              </div>

              <div className="rounded-2xl border border-violet-400 bg-white p-4 shadow-sm">
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-600">
                  Rounds
                </div>
                <div className="mt-1 text-4xl font-bold tracking-tight text-slate-900">
                  {metrics.totalRounds}
                </div>
                <div className="mt-0.5 text-xs text-slate-500">Available in this stage flow</div>
              </div>

              <div className="rounded-2xl border border-emerald-400 bg-white p-4 shadow-sm">
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-600">
                  Finalized
                </div>
                <div className="mt-1 text-4xl font-bold tracking-tight text-slate-900">
                  {metrics.finalizedRounds}
                </div>
                <div className="mt-0.5 text-xs text-slate-500">Saved rounds so far</div>
              </div>

              <div className="rounded-2xl border border-amber-400 bg-white p-4 shadow-sm">
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-600">
                  Revision
                </div>
                <div className="mt-2 text-5xl font-bold tracking-tight text-slate-900">
                  {workspaceData.execution.revision_number}
                </div>
                <div className="mt-1 text-sm text-slate-500">Current execution revision</div>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
            <ExecutionProgressBar
              rounds={workspaceData.rounds}
              roundRoleMappings={workspaceData.roundRoleMappings}
              timelines={executionTimelines}
              remainingActiveRoles={workspaceData.remainingActiveRoles}
              stageCompletionSummary={stageCompletionSummary}
              selectedStage={selectedStage}
              onStageSelect={(stageNumber) => {
                setViewingExecutionBatchId(null);
                setPendingExecutionRoundId(null);
                setSelectedStage(stageNumber);

                const firstRound = workspaceData.rounds
                  .filter((r) => getEffectiveStageNumber(r, workspaceData.rounds) === stageNumber)
                  .sort((a, b) => {
                    if (
                      a.parent_execution_round_id == null &&
                      b.parent_execution_round_id != null
                    ) {
                      return -1;
                    }

                    if (
                      a.parent_execution_round_id != null &&
                      b.parent_execution_round_id == null
                    ) {
                      return 1;
                    }

                    return a.round_order - b.round_order;
                  })[0];

                if (!firstRound) {
                  return;
                }

                setSelectedRoundId(firstRound.execution_round_id);

                const firstBatch = workspaceData.executionBatches
                  .filter((b) => b.parent_execution_round_id === firstRound.execution_round_id)
                  .sort((a, b) => a.round_order - b.round_order)[0];

                setSelectedExecutionBatchId(firstBatch?.execution_round_id ?? null);

                if (firstRound.scope === "COMMON") {
                  setSelectedTimeline("COMMON");
                  return;
                }

                const mapping = workspaceData.roundRoleMappings.find(
                  (m) => m.execution_round_id === firstRound.execution_round_id,
                );

                if (mapping) {
                  setSelectedTimeline(mapping.drive_role_id);
                }
              }}
            />
          </div>
          <div className="h-3" />
          <div className="mt-5 grid grid-cols-[340px_minmax(0,1fr)] gap-6">
            <div className="sticky top-6 self-start rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
              <ExecutionNavigator
                workspace={workspace}
                selectedStage={selectedStage}
                selectedRoundId={selectedRoundId}
                selectedTimeline={selectedTimeline}
                selectedExecutionBatchId={selectedExecutionBatchId}
                onStageSelect={(stageNumber) => {
                  setViewingExecutionBatchId(null);
                  setPendingExecutionRoundId(null);

                  setSelectedStage(stageNumber);

                  const firstRound = workspaceData.rounds
                    .filter((r) => getEffectiveStageNumber(r, workspaceData.rounds) === stageNumber)
                    .sort((a, b) => {
                      if (
                        a.parent_execution_round_id == null &&
                        b.parent_execution_round_id != null
                      ) {
                        return -1;
                      }

                      if (
                        a.parent_execution_round_id != null &&
                        b.parent_execution_round_id == null
                      ) {
                        return 1;
                      }

                      return a.round_order - b.round_order;
                    })[0];

                  if (!firstRound) return;

                  setSelectedRoundId(firstRound.execution_round_id);

                  const firstBatch = workspaceData.executionBatches
                    .filter((b) => b.parent_execution_round_id === firstRound.execution_round_id)
                    .sort((a, b) => a.round_order - b.round_order)[0];

                  setSelectedExecutionBatchId(firstBatch?.execution_round_id ?? null);

                  if (firstRound.scope === "COMMON") {
                    setSelectedTimeline("COMMON");
                    return;
                  }

                  const mapping = workspaceData.roundRoleMappings.find(
                    (m) => m.execution_round_id === firstRound.execution_round_id,
                  );

                  if (mapping) {
                    setSelectedTimeline(mapping.drive_role_id);
                  }
                }}
                onRoundSelect={(executionRoundId) => {
                  setSelectedRoundId(executionRoundId);

                  const round = workspaceData.rounds.find(
                    (r) => r.execution_round_id === executionRoundId,
                  );

                  if (!round) return;

                  const firstBatch = workspaceData.executionBatches
                    .filter((b) => b.parent_execution_round_id === executionRoundId)
                    .sort((a, b) => a.round_order - b.round_order)[0];

                  setSelectedExecutionBatchId(firstBatch?.execution_round_id ?? null);

                  if (round.scope === "COMMON") {
                    setSelectedTimeline("COMMON");
                    return;
                  }

                  const mapping = workspaceData.roundRoleMappings.find(
                    (m) => m.execution_round_id === executionRoundId,
                  );

                  if (mapping) {
                    setSelectedTimeline(mapping.drive_role_id);
                  }
                }}

                onTimelineSelect={setSelectedTimeline}
                onBatchSelect={(executionBatchId) => {
                  setSelectedExecutionBatchId(executionBatchId);
                }}
              />
            </div>

            <div className="min-w-0">
              <div className="min-w-0 flex-1">
                <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-2">
                      <div>
                        <h2 className="text-xl font-bold tracking-tight text-slate-900">
                          Stage {selectedStage}
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                          {selectedStageRounds.length} Execution Round
                          {selectedStageRounds.length === 1 ? "" : "s"}
                        </p>
                      </div>

                      <p className="text-sm text-slate-600">
                        Manage attendance, gate status and progression.
                      </p>
                    </div>

                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-600">
                      <span className="font-medium text-slate-900">
                        {workspaceParticipants.length}
                      </span>
                      Participants
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                    {selectedStageRounds.map((round) => (
                      <button
                        key={round.execution_round_id}
                        type="button"
                        onClick={() => {
                          setSelectedRoundId(round.execution_round_id);

                          const firstBatch = workspaceData.executionBatches
                            .filter(
                              (batch) =>
                                batch.parent_execution_round_id === round.execution_round_id,
                            )
                            .sort((a, b) => a.round_order - b.round_order)[0];

                          setSelectedExecutionBatchId(firstBatch?.execution_round_id ?? null);
                        }}
                        className={`shrink-0 rounded-2xl border px-5 py-3 text-left transition-all ${
                          selectedRoundId === round.execution_round_id
                            ? "border-blue-600 bg-blue-50 shadow-md"
                            : "border-slate-200 bg-white hover:border-blue-300"
                        }`}
                      >
                        <div className="flex flex-col items-start">
                          <div className="font-medium text-slate-900">{round.round_name}</div>

                          {round.scope === "ROLE_SPECIFIC" && (
                            <div className="mt-1 text-xs text-slate-500">
                              {(roundRoleLookup.get(round.execution_round_id) ?? []).join(" + ")}
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>

                  {isMultipleExecutionStage && (
                    <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-1">
                          <h3 className="text-base font-semibold text-slate-900">
                            Execution Batches
                          </h3>

                          <p className="text-sm text-slate-600">
                            {currentRoundBatches.filter((b) => b.participant_count > 0).length} of{" "}
                            {currentRoundBatches.length} batches in use ·{" "}
                            {currentRoundBatches.reduce(
                              (sum, batch) => sum + batch.participant_count,
                              0,
                            )}{" "}
                            students assigned
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            className="inline-flex h-10 items-center rounded-full border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                            onClick={() => {
                              setManageExecutionBatchesOpen(true);
                            }}
                          >
                            ⚙ Manage Batch Settings
                          </button>

                          <button
                            type="button"
                            className="inline-flex h-10 items-center rounded-full bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700"
                            onClick={() => {
                              setViewingExecutionBatchId(null);
                              setBatchParticipantDialogOpen(true);
                            }}
                          >
                            👥 Assign Participants
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Search */}

                      <div className="flex min-w-[320px] flex-1 items-center">
                        <div className="flex h-11 items-center rounded-l-xl border border-r-0 border-slate-300 bg-slate-100 px-4 font-semibold">
                          IU
                        </div>

                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search Name, Enrollment, Email or Role"

                          className="h-11 w-full rounded-r-xl border border-slate-300 bg-white px-4 text-sm shadow-sm transition-all focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200"
                        />
                      </div>

                      {/* Attendance */}

                      <select
                        value={attendanceFilter}
                        onChange={(e) =>
                          setAttendanceFilter(
                            e.target.value as "ALL" | "PRESENT" | "ABSENT" | "PENDING",
                          )
                        }
                        className="h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium shadow-sm transition-all hover:border-slate-500 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200"
                      >
                        <option value="ALL">All Attendance</option>
                        <option value="PRESENT">Present</option>
                        <option value="ABSENT">Absent</option>
                        <option value="PENDING">Pending</option>
                      </select>

                      {/* Progress */}

                      <select
                        value={progressFilter}
                        onChange={(e) =>
                          setProgressFilter(
                            e.target.value as "ALL" | "NONE" | "SHORTLISTED" | "SELECTED",
                          )
                        }
                        className="h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium shadow-sm transition-all hover:border-slate-500 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200"
                      >
                        <option value="ALL">All Progress</option>
                        <option value="NONE">No Progress</option>
                        <option value="SHORTLISTED">Shortlisted</option>
                        <option value="SELECTED">Selected</option>
                      </select>

                      {/* Batch */}

                      {isMultipleExecutionStage && (
                        <select
                          value={batchFilter}
                          onChange={(e) => setBatchFilter(e.target.value)}
                          className="h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium shadow-sm transition-all hover:border-slate-500 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200"
                        >
                          <option value="ALL">All Batches</option>

                          {currentRoundBatches.map((batch) => (
                            <option key={batch.execution_round_id} value={batch.execution_round_id}>
                              {batch.round_name}
                            </option>
                          ))}
                        </select>
                      )}

                      {/* Role Filter*/}

                      <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium shadow-sm transition-all hover:border-slate-500 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200"
                      >
                        <option value="ALL">All Roles</option>

                        {currentRoundRoleSummary.map((role) => (
                          <option key={role.driveRoleId} value={role.driveRoleId}>
                            {role.roleName}
                          </option>
                        ))}
                      </select>

                      {/* Import Attendance Excel */}

                      <button
                        type="button"
                        onClick={() => toast.info("Coming Soon")}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md"
                      >
                        📥 Import Excel
                      </button>

                      {/* Download Pre-Attendance Sheet */}

                      <button
                        type="button"
                        onClick={handlePreAttendanceExport}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-slate-100 px-4 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-200"
                      >
                        ⬇ Pre-Attendance
                      </button>

                      {/* Download Post-Attendance Report */}

                      <button
                        type="button"
                        onClick={handlePostAttendanceExport}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow-md"
                      >
                        📊 Post-Attendance
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
                    <div className="max-h-[78vh] overflow-auto">
                      <table className="min-w-full border-collapse text-sm">
                        <thead className="sticky top-0 z-30 bg-slate-50 shadow-sm">
                          <tr className="border-b border-slate-200">
                            <th className="sticky left-0 z-40 border-r border-slate-200 bg-slate-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 shadow-[6px_0_8px_-8px_rgba(15,23,42,0.18)]">
                              Student
                            </th>

                            <th className="sticky left-0 z-40 border-r border-slate-200 bg-slate-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 shadow-[6px_0_8px_-8px_rgba(15,23,42,0.18)]">
                              Enrollment
                            </th>

                            <th className="sticky left-0 z-40 border-r border-slate-200 bg-slate-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 shadow-[6px_0_8px_-8px_rgba(15,23,42,0.18)]">
                              Selected Roles
                            </th>

                            <th className="sticky left-0 z-40 border-r border-slate-200 bg-slate-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 shadow-[6px_0_8px_-8px_rgba(15,23,42,0.18)]">
                              Attendance
                            </th>

                            <th className="sticky left-0 z-40 border-r border-slate-200 bg-slate-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 shadow-[6px_0_8px_-8px_rgba(15,23,42,0.18)]">
                              Gate
                            </th>

                            <th className="sticky left-0 z-40 border-r border-slate-200 bg-slate-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 shadow-[6px_0_8px_-8px_rgba(15,23,42,0.18)]">
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
                          {filteredParticipants.map((participant) => {
                            const editedRow = getEditedRow(
                              selectedRound!.execution_round_id,
                              participant.execution_participant_id,
                            );

                            const effectiveGateStatus: ExecutionGateStatus | "ALLOWED_OVERRIDE" =
                              editedRow?.restrictionOverride
                                ? "ALLOWED_OVERRIDE"
                                : editedRow?.gateStatus === "RESTRICTED"
                                  ? "RESTRICTED"
                                  : "ALLOWED";

                            const effectiveAttendanceStatus = editedRow?.attendanceStatus ?? null;

                            const attendanceRecorded = effectiveAttendanceStatus !== null;

                            const attendanceEligible =
                              effectiveAttendanceStatus === "PRESENT" ||
                              (effectiveAttendanceStatus === "ABSENT" &&
                                editedRow?.absenceDisposition === "ALLOWED");

                            const effectiveGateAllowed = effectiveGateStatus !== "RESTRICTED";

                            const canProgress = attendanceEligible && effectiveGateAllowed;

                            return (
                              <tr
                                key={participant.execution_participant_id}
                                className="border-b border-slate-200 odd:bg-white even:bg-slate-50/50 transition-colors hover:bg-blue-50/60"
                              >
                                <td className="sticky left-0 z-20 border-r border-slate-200 bg-inherit px-4 py-3 align-top shadow-[6px_0_8px_-8px_rgba(15,23,42,0.18)]">
                                  <div className="truncate font-semibold text-slate-900">
                                    {`${participant.student.first_name} ${participant.student.last_name}`}
                                  </div>

                                  <div className="mt-1 truncate text-xs text-slate-500">
                                    {participant.student.institute_email}
                                  </div>
                                </td>

                                <td className="sticky left-0 z-20 border-r border-slate-200 bg-inherit px-4 py-3 align-top shadow-[6px_0_8px_-8px_rgba(15,23,42,0.18)]">
                                  {participant.student.enrollment_no}
                                </td>

                                <td className="sticky left-0 z-20 border-r border-slate-200 bg-inherit px-4 py-3 align-top shadow-[6px_0_8px_-8px_rgba(15,23,42,0.18)]">
                                  <div className="flex flex-wrap gap-1.5">
                                    {participant.selected_roles.map((role) => (
                                      <span
                                        key={role.drive_role_id}
                                        className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xg font-semibold text-blue-700"
                                      >
                                        💼 {role.drive_role_name}
                                      </span>
                                    ))}
                                  </div>
                                </td>

                                <td className="sticky left-0 z-20 border-r border-slate-200 bg-inherit px-4 py-3 align-top shadow-[6px_0_8px_-8px_rgba(15,23,42,0.18)]">
                                  <select
                                    className={`w-full min-w-37.5 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                                      editedRow?.attendanceStatus === "PRESENT"
                                        ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                                        : editedRow?.attendanceStatus === "ABSENT"
                                          ? "border-amber-300 bg-amber-50 text-amber-700"
                                          : "border-slate-300 bg-white text-slate-700"
                                    }`}
                                    value={editedRow?.attendanceStatus ?? ""}
                                    onChange={(e) => {
                                      setEditedRow(
                                        selectedRound!.execution_round_id,
                                        participant.execution_participant_id,
                                        {
                                          attendanceStatus: (e.target.value ||
                                            null) as ExecutionAttendanceStatus | null,
                                        },
                                      );

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
                                      <p className="mt-1 text-xs text-emerald-600">
                                        Allowed Absence
                                      </p>
                                    )}
                                </td>

                                <td className="sticky left-0 z-20 border-r border-slate-200 bg-inherit px-4 py-3 align-top shadow-[6px_0_8px_-8px_rgba(15,23,42,0.18)]">
                                  <div className="space-y-2">
                                    {effectiveGateStatus === "RESTRICTED" ? (
                                      <span className="inline-flex rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                                        ⛔ Restricted
                                      </span>
                                    ) : effectiveGateStatus === "ALLOWED_OVERRIDE" ? (
                                      <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                                        ⚠ Allowed (Override)
                                      </span>
                                    ) : (
                                      <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                        ✔ Allowed
                                      </span>
                                    )}

                                    {participant.restriction_reason && (
                                      <p className="max-w-xs text-xs text-slate-500">
                                        {participant.restriction_reason}
                                      </p>
                                    )}
                                  </div>
                                </td>

                                <td className="sticky left-0 z-20 border-r border-slate-200 bg-inherit px-4 py-3 align-top shadow-[6px_0_8px_-8px_rgba(15,23,42,0.18)]">
                                  <select
                                    className="w-full min-w-37.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                                    value={editedRow?.progressionStatus ?? "NONE"}
                                    onChange={(e) => {
                                      setHasUnsavedChanges(true);
                                      setRoundDirty(true);

                                      setEditedRow(
                                        selectedRound!.execution_round_id,
                                        participant.execution_participant_id,
                                        {
                                          progressionStatus: e.target
                                            .value as ExecutionProgressionStatus,
                                        },
                                      );
                                    }}
                                  >
                                    <option value="NONE">⬜ No Progress</option>

                                    <option value="SHORTLISTED" disabled={!canProgress}>
                                      🔵 Shortlisted
                                    </option>

                                    <option value="SELECTED" disabled={!canProgress}>
                                      🟢 Selected
                                    </option>
                                  </select>

                                  {!canProgress && (
                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                      {!attendanceRecorded && (
                                        <span className="inline-flex flex-wrap items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                                          ⚠ Attendance Required
                                        </span>
                                      )}

                                      {!effectiveGateAllowed && (
                                        <span className="inline-flex flex-wrap items-center gap-2 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700">
                                          ⛔ Restriction Pending
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </td>

                                {isMultipleExecutionStage && (
                                  <td className="sticky left-0 z-20 border-r border-slate-200 bg-inherit px-4 py-3 align-top shadow-[6px_0_8px_-8px_rgba(15,23,42,0.18)]">
                                    {isMultipleExecutionStage ? (
                                      <select
                                        className="w-full min-w-37.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                                        value={
                                          executionBatchAssignments[
                                            participant.execution_participant_id
                                          ] ?? ""
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

                                        {currentRoundBatches.map((batch) => (
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
                          <div className="text-sm font-semibold text-slate-900">
                            Attendance Review
                          </div>

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

                        {workspaceData.transition.requiresRoleAssignment &&
                          workspaceData.remainingActiveRoles.length > 0 && (
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
                            !canProgressToNextStage ||
                            (workspaceData.transition.requiresRoleAssignment &&
                              workspaceData.remainingActiveRoles.length > 0) ||
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
                      {workspaceData.transition.requiresRoleAssignment &&
                        workspaceData.remainingActiveRoles.length > 0 && (
                          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                            <div className="font-medium text-amber-800">
                              Assign shortlisted candidates to role-specific execution rounds.
                            </div>

                            <div className="mt-1 text-sm text-amber-700">
                              Before Stage {workspaceData.transition.nextStage} can begin,
                              shortlisted candidates must be routed into the correct role-specific
                              round.
                            </div>

                            <ul className="mt-3 list-disc pl-5 text-sm text-amber-700">
                              {workspaceData.remainingActiveRoles.map((role) => (
                                <li key={role.drive_role_id}>
                                  💼 {role.drive_role_name} ({role.candidate_count} candidate
                                  {role.candidate_count !== 1 ? "s" : ""})
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                      {showExecutionBatchPanel && !allExecutionBatchesCompleted && (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                          Complete all execution batches and assign every shortlisted participant
                          before progressing to the next stage.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ProgressSummaryDialog
        open={progressSummaryOpen}
        shortlistedCount={shortlistedParticipants.length}
        totalParticipants={workspaceParticipants.length}
        roleSummary={currentRoundRoleSummary}
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
            /*
             * Keep the progression context alive.
             *
             * The destination round has been created,
             * but Stage 1 has not yet been saved.
             *
             * handleSaveRound() is responsible for consuming
             * pendingExecutionRoundId after progression completes.
             */

            setCreateRoundOpen(false);

            setExecutionModeDialogOpen(false);

            setProgressSummaryOpen(false);

            setStageConfigurationMode(false);

            await loadWorkspace();

            toast.success(
              "Stage created. Save the current stage to progress shortlisted participants.",
            );

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
        nextRoundOrder={(workspaceData?.rounds.length ?? 0) + 1}
        activeRoles={
          progressToNextRound
            ? currentRoundRoleSummary
            : workspaceData.remainingActiveRoles.map((role) => ({
                driveRoleId: role.drive_role_id,
                roleName: role.drive_role_name,
                candidateCount: role.candidate_count,
              }))
        }
        loading={saving}

        // configurationStage={currentConfigurationStage}
        // configurationRoleId={currentConfigurationRoleId}
        onCancel={() => {
          setCreateRoundOpen(false);

          /*
           * Progress workflow cancelled.
           * Clear any pending destination.
           */
          setPendingExecutionRoundId(null);
          setProgressToNextRound(false);
        }}
        commonStageLocked={workspaceData.commonStageLocked}

        commonStageLockReason={workspaceData.commonStageLockReason ?? undefined}
        onCreate={async (data) => {
          if (saving || !workspace) {
            return;
          }

          setSaving(true);

          try {
            if (!selectedRound) {
              throw new Error("No execution round selected.");
            }

            const round =
              !progressToNextRound && data.roundType === "ROLE_SPECIFIC"
                ? await recruitmentExecutionService.createRoleSpecificParallelStage({
                    executionId: workspaceData.execution.execution_id,
                    parentExecutionRoundId: selectedRound.execution_round_id,
                    roundName: data.roundName.trim(),
                    roleIds: data.roleIds,
                    scheduledDate: data.scheduledDate,
                    scheduledTime: data.scheduledTime,
                    venue: data.venue,
                    remarks: data.remarks,
                  })
                : await recruitmentExecutionService.createExecutionBatch({
                    executionId: workspaceData.execution.execution_id,

                    sourceStageNumber: selectedRound.stage_number,

                    creationMode: progressToNextRound ? "NEXT_STAGE" : "PARALLEL_STAGE",

                    roundOrder: Math.max(0, ...workspaceData.rounds.map((r) => r.round_order)) + 1,

                    roundName: data.roundName.trim(),

                    scope: data.roundType === "COMMON" ? "COMMON" : "ROLE_SPECIFIC",

                    roleIds: data.roundType === "COMMON" ? [] : data.roleIds,

                    executionParticipantIds: shortlistedParticipants.map(
                      (participant) => participant.execution_participant_id,
                    ),

                    scheduledDate: data.scheduledDate,
                    scheduledTime: data.scheduledTime,
                    venue: data.venue,
                    remarks: data.remarks,
                  });

            if (!progressToNextRound && data.roundType === "ROLE_SPECIFIC") {
              const selectedRoleIds = new Set(data.roleIds);

              const participantIds = shortlistedParticipants
                .filter((participant) =>
                  participant.selected_roles.some((role) =>
                    selectedRoleIds.has(role.drive_role_id),
                  ),
                )
                .map((participant) => participant.execution_participant_id);

              if (participantIds.length > 0) {
                await recruitmentExecutionService.assignExecutionBatchParticipants({
                  executionRoundId: round.execution_round_id,
                  executionParticipantIds: participantIds,
                });
              }
            }
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
          editingExecutionBatchId ? stageParticipants.length : unassignedStageParticipants.length
        }
        defaultBatchName={`Batch ${currentRoundBatches.length + 1}`}
        editingBatch={
          editingExecutionBatchId
            ? (() => {
                const batch = currentRoundBatches.find(
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
              executionId: workspaceData.execution.execution_id,

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
            console.log("========================================");
            console.log("AFTER loadWorkspace()");
            console.log("selectedStage:", selectedStage);

            console.log(
              "workspaceData.executionBatches.length:",
              workspaceData?.executionBatches?.length ?? 0,
            );

            console.log("workspaceData.executionBatches:", workspaceData?.executionBatches ?? []);

            const debugcurrentRoundBatches = (workspaceData?.executionBatches ?? []).filter(
              (batch) => batch.stage_number === selectedStage,
            );

            console.log("currentRoundBatches:", debugcurrentRoundBatches);

            console.log("Opening ManageExecutionBatchesDialog...");
            console.log("========================================");
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
            ? currentRoundBatches.find(
                (batch) => batch.execution_round_id === viewingExecutionBatchId,
              )?.round_name
            : undefined
        }
        participants={workspaceData.participants.filter(
          (participant) => !executionBatchAssignments[participant.execution_participant_id],
        )}
        availableBatches={currentRoundBatches.map((batch) => ({
          execution_round_id: batch.execution_round_id,
          round_name: batch.round_name,
        }))}
        alreadyAssignedParticipantIds={
          workspaceData?.executionBatchParticipants
            .filter((assignment) => {
              if (assignment.execution_round_id === pendingExecutionRoundId) {
                return false;
              }

              const batch = workspaceData.executionBatches.find(
                (b) => b.execution_round_id === assignment.execution_round_id,
              );

              return batch
                ? getEffectiveStageNumber(batch, workspaceData.rounds) === selectedStage
                : false;
            })
            .map((assignment) => assignment.execution_participant_id) ?? []
        }
        roleName="Execution Batch"
        stageNumber={selectedStage ?? 1}
        onCancel={() => {
          setBatchParticipantDialogOpen(false);

          setViewingExecutionBatchId(null);
        }}
        onContinue={async ({ executionRoundId, participantIds }) => {
          if (!pendingExecutionRoundId) {
            return;
          }

          try {
            setLoading(true);

            if (!assignmentExecutionBatchId) {
              throw new Error("Execution batch not selected.");
            }

            await recruitmentExecutionService.assignExecutionBatchParticipants({
              executionRoundId,
              executionParticipantIds: participantIds,
            });

            await loadWorkspace();

            setExecutionBatchAssignments((prev) => ({ ...prev }));

            setBatchParticipantDialogOpen(false);

            setViewingExecutionBatchId(null);
            console.log("========================================");
            console.log("AFTER loadWorkspace()");
            console.log("selectedStage:", selectedStage);

            console.log(
              "workspaceData.executionBatches.length:",
              workspaceData?.executionBatches?.length ?? 0,
            );

            console.log("workspaceData.executionBatches:", workspaceData?.executionBatches ?? []);

            const debugcurrentRoundBatches = (workspaceData?.executionBatches ?? []).filter(
              (batch) => batch.stage_number === selectedStage,
            );

            console.log("currentRoundBatches:", debugcurrentRoundBatches);

            console.log("Opening ManageExecutionBatchesDialog...");
            console.log("========================================");
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
        batches={currentRoundBatches as unknown as ManageExecutionBatch[]}
        students={
          workspaceData.participants.map((participant) => ({
            execution_participant_id: participant.execution_participant_id,

            execution_round_id:
              executionBatchAssignments[participant.execution_participant_id] ?? null,

            enrollment_no: participant.student.enrollment_no,

            student_name: `${participant.student.first_name} ${participant.student.last_name}`,
          })) as ManageExecutionBatchStudent[]
        }
        onClose={() => {
          setManageExecutionBatchesOpen(false);
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
            workspaceData.executionBatches.find((b) => b.execution_round_id === executionRoundId)
              ?.parent_execution_round_id ?? selectedRoundId,
          );

          setCreateExecutionBatchOpen(true);
        }}
        onViewStudents={(executionRoundId) => {
          setManageExecutionBatchesOpen(false);
          setViewingExecutionBatchId(executionRoundId);
          setSelectedExecutionBatchId(executionRoundId);
          setAssignmentExecutionBatchId(executionRoundId);
          const batch = workspaceData.executionBatches.find(
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
        editedRows={selectedRound ? (editedRows[selectedRound.execution_round_id] ?? {}) : {}}
        onEditedRowChange={(participantId, changes) => {
          const current = getEditedRow(selectedRound!.execution_round_id, participantId) ?? {
            attendanceStatus: null,
            gateStatus: "ALLOWED",
            progressionStatus: "NONE",
            remarks: "",
            absenceDisposition: null,
            absenceReason: "",
            restrictionOverride: false,
            overrideReason: "",
          };

          const next = {
            ...current,
            ...changes,
          };

          const attendanceAllowed =
            next.attendanceStatus === "PRESENT" ||
            (next.attendanceStatus === "ABSENT" && next.absenceDisposition === "ALLOWED");

          const gateAllowed = next.restrictionOverride || next.gateStatus === "ALLOWED";

          if (!attendanceAllowed || !gateAllowed) {
            next.progressionStatus = "NONE";
          }

          setEditedRow(selectedRound!.execution_round_id, participantId, next);

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
