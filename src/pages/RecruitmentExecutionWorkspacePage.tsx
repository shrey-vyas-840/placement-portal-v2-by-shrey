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
import { recruitmentExecutionAttendanceExportService } from "@/services/recruitmentExecutionAttendanceExportService";
import { exportExcelBuilder } from "@/services/export/exportExcelBuilder";
import { buildAttendanceExportConfiguration } from "@/services/recruitmentExecution/attendanceExportConfig";

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

  const getEditedRow = (
    executionRoundId: string,
    executionParticipantId: string,
  ): RecruitmentExecutionEditedRow | undefined => {
    return editedRows[executionRoundId]?.[executionParticipantId];
  };

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

        const stageBatches = data.executionBatches
          .filter((b) => b.parent_execution_round_id === existingRound.execution_round_id)
          .sort((a, b) => a.round_order - b.round_order);

        const preservedBatch =
          selectedExecutionBatchId != null
            ? stageBatches.find((batch) => batch.execution_round_id === selectedExecutionBatchId)
            : undefined;

        setSelectedExecutionBatchId(
          preservedBatch?.execution_round_id ?? stageBatches[0]?.execution_round_id ?? null,
        );
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

      const initialState: Record<string, Record<string, RecruitmentExecutionEditedRow>> = {};

      data.rounds.forEach((round) => {
        initialState[round.execution_round_id] = {};

        data.participants.forEach((participant) => {
          const history = historyLookup.get(
            `${round.execution_round_id}:${participant.execution_participant_id}`,
          );

          initialState[round.execution_round_id][participant.execution_participant_id] = {
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
  }, [
    executionId,
    navigationRestore,
    restoreWorkspaceNavigation,
    selectedRoundId,
    selectedExecutionBatchId,
  ]);

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

  const currentExecutionRoundId = selectedRound?.execution_round_id ?? null;

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
    let cancelled = false;

    const syncParticipants = async () => {
      if (!workspace || !selectedRound) {
        setParticipants([]);
        return;
      }

      if (selectedRound.stage_number === 1) {
        setParticipants(workspace.participants);
        return;
      }

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
  }, [workspace, selectedRound?.execution_round_id, selectedRound?.stage_number]);

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

  const stageParticipants = useMemo(() => {
    return participants;
  }, [participants]);

  const shortlistedParticipants = useMemo(
    () =>
      stageParticipants.filter((participant) => {
        const row = getEditedRow(currentExecutionRoundId!, participant.execution_participant_id);
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
        const assignedRows = stageParticipants.filter(
          (participant) =>
            executionBatchAssignments[participant.execution_participant_id] ===
            batch.execution_round_id,
        );

        const completed = assignedRows.every((participant) => {
          const row = getEditedRow(batch.execution_round_id, participant.execution_participant_id);

          return row?.attendanceStatus !== null;
        });

        return {
          ...batch,

          participant_count: assignedRows.length,

          present_count: assignedRows.filter((participant) => {
            const row = getEditedRow(
              batch.execution_round_id,
              participant.execution_participant_id,
            );

            return row?.attendanceStatus === "PRESENT";
          }).length,

          absent_count: assignedRows.filter((participant) => {
            const row = getEditedRow(
              batch.execution_round_id,
              participant.execution_participant_id,
            );

            return row?.attendanceStatus === "ABSENT";
          }).length,

          shortlisted_count: assignedRows.filter((participant) => {
            const row = getEditedRow(
              batch.execution_round_id,
              participant.execution_participant_id,
            );

            return row?.progressionStatus === "SHORTLISTED";
          }).length,

          selected_count: assignedRows.filter((participant) => {
            const row = getEditedRow(
              batch.execution_round_id,
              participant.execution_participant_id,
            );

            return row?.progressionStatus === "SELECTED";
          }).length,

          completed,

          pending:
            assignedRows.length -
            assignedRows.filter((participant) => {
              const row = getEditedRow(
                batch.execution_round_id,
                participant.execution_participant_id,
              );

              return row?.attendanceStatus !== null;
            }).length,

          selected: batch.execution_round_id === selectedExecutionBatch?.execution_round_id,
        };
      })
      .sort((a, b) => a.round_order - b.round_order);
  }, [
    workspace,
    selectedStage,
    selectedExecutionBatch?.execution_round_id,
    editedRows,
    stageParticipants,
    executionBatchAssignments,
  ]);

  const filteredParticipants = useMemo(() => {
    let rows = [...participants];

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
        const row = getEditedRow(currentExecutionRoundId!, participant.execution_participant_id);

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
        const row = getEditedRow(currentExecutionRoundId!, participant.execution_participant_id);

        return (row?.progressionStatus ?? "NONE") === progressFilter;
      });
    }

    // ------------------------------------------------------------
    // Gate
    // ------------------------------------------------------------

    if (gateFilter !== "ALL") {
      rows = rows.filter((participant) => {
        const row = getEditedRow(currentExecutionRoundId!, participant.execution_participant_id);

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
    participants,
    searchQuery,
    attendanceFilter,
    progressFilter,
    gateFilter,
    roleFilter,
    batchFilter,
    executionBatchAssignments,
    currentExecutionRoundId,
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

    const stageNumbers = [...new Set(workspace.rounds.map((r) => r.stage_number))];

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
          .filter((r) => r.stage_number === stageNumber)
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

      const stageRounds = workspace.rounds.filter((r) => r.stage_number === stageNumber);

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

    if (unassignedStageParticipants.length > 0) {
      return false;
    }

    return currentStageBatches.every((batch) => {
      if (batch.participant_count === 0) {
        return true;
      }

      return batch.completed;
    });
  }, [isMultipleExecutionStage, currentStageBatches, unassignedStageParticipants]);

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

  const handlePreAttendanceExport = async () => {
    if (!currentExecutionRoundId) return;

    try {
      const data = await recruitmentExecutionAttendanceExportService.getAttendanceExportData(
        executionId,
        currentExecutionRoundId,
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
    if (!currentExecutionRoundId) return;

    try {
      const data = await recruitmentExecutionAttendanceExportService.getAttendanceExportData(
        executionId,
        currentExecutionRoundId,
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
    const shortlistedParticipants = participants.filter((participant) => {
      const row = getEditedRow(currentExecutionRoundId!, participant.execution_participant_id);
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

    const pendingAttendance = participants.some((participant) => {
      const row = getEditedRow(currentExecutionRoundId!, participant.execution_participant_id);

      return row?.attendanceStatus == null;
    });

    if (pendingAttendance) {
      return false;
    }

    if (isMultipleExecutionStage && unassignedStageParticipants.length > 0) {
      return false;
    }

    return true;
  }, [
    participants,
    currentExecutionRoundId,
    editedRows,
    isMultipleExecutionStage,
    unassignedStageParticipants,
  ]);

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
      <div className="mx-auto w-full max-w-[1750px] px-6 py-6">
        <div className="relative overflow-hidden rounded-3xl border border-blue-200 bg-gradient-to-r from-blue-800 via-blue-700 to-cyan-600 text-white shadow-xl">
          <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-white/10 blur-sm" />

          <div className="absolute bottom-0 right-20 h-28 w-28 rounded-full bg-white/10 blur-sm" />

          <div className="absolute -left-10 top-10 h-32 w-32 rounded-full bg-cyan-300/10 blur-xl" />
          <div className="relative z-10 flex flex-col gap-5 px-8 py-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.30em] text-white/70">
                  Execution Workspace
                </p>
                <h1 className="mt-2 text-4xl font-bold tracking-tight text-white">
                  Recruitment Execution
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/85">
                  Execute recruitment rounds, shortlist candidates and finalize selections.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="inline-flex rounded-full bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
                  Revision {workspace.execution.revision_number}
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
            <div className="rounded-2xl border border-blue-400 bg-white p-5 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl">
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
              <div className="mt-2 text-5xl font-bold tracking-tight text-slate-900">
                {metrics.totalRounds}
              </div>
              <div className="mt-1 text-sm text-slate-500">Available in this stage flow</div>
            </div>

            <div className="rounded-2xl border border-emerald-400 bg-white p-4 shadow-sm">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-600">
                Finalized
              </div>
              <div className="mt-2 text-5xl font-bold tracking-tight text-slate-900">
                {metrics.finalizedRounds}
              </div>
              <div className="mt-1 text-sm text-slate-500">Saved rounds so far</div>
            </div>

            <div className="rounded-2xl border border-amber-400 bg-white p-4 shadow-sm">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-600">
                Revision
              </div>
              <div className="mt-2 text-5xl font-bold tracking-tight text-slate-900">
                {workspace.execution.revision_number}
              </div>
              <div className="mt-1 text-sm text-slate-500">Current execution revision</div>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <ExecutionProgressBar
            rounds={workspace.rounds}
            roundRoleMappings={workspace.roundRoleMappings}
            timelines={executionTimelines}
            remainingActiveRoles={workspace.remainingActiveRoles}
            stageCompletionSummary={stageCompletionSummary}
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

        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900">
                  Stage {selectedStage}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {selectedStageRounds.length} Round
                  {selectedStageRounds.length === 1 ? "" : "s"}
                </p>
              </div>

              <p className="text-sm text-slate-600">
                Manage attendance, gate status and progression.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-600">
              <span className="font-medium text-slate-900">{participants.length}</span>
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
            <div className="flex items-center gap-3 overflow-x-auto">
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
                  setAttendanceFilter(e.target.value as "ALL" | "PRESENT" | "ABSENT" | "PENDING")
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
                  setProgressFilter(e.target.value as "ALL" | "NONE" | "SHORTLISTED" | "SELECTED")
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

                  {currentStageBatches.map((batch) => (
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

                {shortlistedRoleSummary.map((role) => (
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

          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
            <div className="max-h-[72vh] overflow-auto">
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
                      currentExecutionRoundId!,
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
                                currentExecutionRoundId!,
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
                              <p className="mt-1 text-xs text-emerald-600">Allowed Absence</p>
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
                                currentExecutionRoundId!,
                                participant.execution_participant_id,
                                {
                                  progressionStatus: e.target.value as ExecutionProgressionStatus,
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
                                <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                                  ⚠ Attendance Required
                                </span>
                              )}

                              {!effectiveGateAllowed && (
                                <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-700">
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
                    !canProgressToNextStage ||
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
                          💼 {role.drive_role_name} ({role.candidate_count} candidate
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

              executionParticipantIds: shortlistedParticipants.map(
                (participant) => participant.execution_participant_id,
              ),

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
          editingExecutionBatchId ? stageParticipants.length : unassignedStageParticipants.length
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
            console.log("========================================");
            console.log("AFTER loadWorkspace()");
            console.log("selectedStage:", selectedStage);

            console.log(
              "workspace.executionBatches.length:",
              workspace?.executionBatches?.length ?? 0,
            );

            console.log("workspace.executionBatches:", workspace?.executionBatches ?? []);

            const debugCurrentStageBatches = (workspace?.executionBatches ?? []).filter(
              (batch) => batch.stage_number === selectedStage,
            );

            console.log("currentStageBatches:", debugCurrentStageBatches);

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
            ? currentStageBatches.find(
                (batch) => batch.execution_round_id === viewingExecutionBatchId,
              )?.round_name
            : undefined
        }
        participants={unassignedStageParticipants}
        availableBatches={currentStageBatches.map((batch) => ({
          execution_round_id: batch.execution_round_id,
          round_name: batch.round_name,
        }))}
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
              "workspace.executionBatches.length:",
              workspace?.executionBatches?.length ?? 0,
            );

            console.log("workspace.executionBatches:", workspace?.executionBatches ?? []);

            const debugCurrentStageBatches = (workspace?.executionBatches ?? []).filter(
              (batch) => batch.stage_number === selectedStage,
            );

            console.log("currentStageBatches:", debugCurrentStageBatches);

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
        batches={currentStageBatches as unknown as ManageExecutionBatch[]}
        students={
          stageParticipants.map((participant) => ({
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
            workspace.executionBatches.find((b) => b.execution_round_id === executionRoundId)
              ?.parent_execution_round_id ?? selectedRoundId,
          );

          setCreateExecutionBatchOpen(true);
        }}
        onViewStudents={(executionRoundId) => {
          setManageExecutionBatchesOpen(false);
          setViewingExecutionBatchId(executionRoundId);
          setSelectedExecutionBatchId(executionRoundId);
          setAssignmentExecutionBatchId(executionRoundId);
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
        editedRows={selectedRound ? (editedRows[selectedRound.execution_round_id] ?? {}) : {}}
        onEditedRowChange={(participantId, changes) => {
          const current = getEditedRow(currentExecutionRoundId!, participantId) ?? {
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

          setEditedRow(currentExecutionRoundId!, participantId, next);

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
