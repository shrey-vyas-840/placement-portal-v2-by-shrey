import { supabase } from "@/integrations/supabase/client";
import { recruitmentExecutionRestrictionService } from "./recruitmentExecutionRestrictionService";
import { canCreateCommonStage } from "./executionValidation";
import type { ExecutionSeriesService } from "./recruitmentExecutionSeriesService";
import {
  ExecutionGraphResolver,
  DefaultStagePlanningProvider,
  DefaultRoundTransitionProvider,
  createExecutionBatchValidationProvider,
} from "./executionGraphResolver";
import { recruitmentExecutionSeriesService } from "./recruitmentExecutionSeriesService";
import type { ExecutionBatchValidationProvider } from "./executionGraphResolver";
import { ExecutionBatchPlanner } from "./executionBatchPlanner";
import { ExecutionBatchValidator } from "./executionBatchValidator";
import type {
  RecruitmentExecutionSeriesRow,
  RecruitmentExecutionRow,
  RecruitmentExecutionSeriesSnapshot,
  RecruitmentExecutionSnapshot,
  RecruitmentExecutionRoundRow,
  RecruitmentExecutionParticipantWithStudent,
  RecruitmentExecutionRoundRoleMapping,
  RecruitmentExecutionHistorySummary,
  RecruitmentExecutionHistoryCreateInput,
  RecruitmentExecutionWorkspace,
  RecruitmentExecutionRemainingRole,
  ExecutionScope,
  ExecutionAttendanceStatus,
  ExecutionGateStatus,
  ExecutionProgressionStatus,
  ExecutionRoundCreationMode,
  RecruitmentExecutionBatch,
  RecruitmentExecutionBatchParticipant,
} from "@/types/recruitmentExecution";
import { recruitmentExecutionParticipantInitializationService } from "./recruitmentExecutionParticipantInitializationService";
import { recruitmentExecutionHistoryService } from "./recruitmentExecutionHistoryService";
import { recruitmentExecutionSelectionService } from "./recruitmentExecutionSelectionService";
import { recruitmentExecutionContextService } from "./recruitmentExecutionContextService";
import { RecruitmentExecutionProgressionService } from "./recruitmentExecutionProgressionService";
import { RecruitmentExecutionRoundService } from "./recruitmentExecutionRoundService";
import { RecruitmentExecutionParticipantAssignmentService } from "./recruitmentExecutionParticipantAssignmentService";
import { RecruitmentExecutionReadService } from "./recruitmentExecutionReadService";
import { RecruitmentExecutionRoundSaveService } from "./recruitmentExecutionRoundSaveService";
import { RecruitmentExecutionParticipantService } from "./recruitmentExecutionParticipantService";
import { recruitmentExecutionSnapshotService } from "./recruitmentExecutionSnapshotService";

/**
 * Recruitment Execution Service
 *
 * This service is the single orchestration layer for the
 * Recruitment Execution Engine.
 *
 * Responsibilities:
 * - Execution Series
 * - Execution Revisions
 * - Rounds
 * - Participants
 * - History
 * - Final Selection
 *
 * NOTE:
 * This file intentionally centralizes orchestration.
 * Internal helper functions may be extracted later if needed,
 * but pages/components should continue importing only this service.
 */

const EXECUTION_SERIES_TABLE = "recruitment_execution_series";
const EXECUTIONS_TABLE = "recruitment_executions";

function requireData<T>(data: T | null, error: unknown, operation: string): T {
  if (error) {
    throw error;
  }

  if (data === null) {
    throw new Error(`${operation} returned no data.`);
  }

  return data;
}

class RecruitmentExecutionService {
  private executionBatchValidationProvider?: ExecutionBatchValidationProvider;

  private executionGraphResolver!: ExecutionGraphResolver;

  private executionSeriesService?: ExecutionSeriesService;

  private readonly roundService = new RecruitmentExecutionRoundService({
    getRound: (executionRoundId) => this.getRound(executionRoundId),

    loadRounds: (executionId) => this.loadRounds(executionId),

    loadExecutionRounds: (executionId) => this.loadExecutionRounds(executionId),

    loadRoundRoleMappings: (executionId) => this.loadRoundRoleMappings(executionId),

    getRoundTransition: (executionId) => this.getRoundTransition(executionId),

    getActiveRoleIdsForStage: (executionId, stageNumber) =>
      this.getActiveRoleIdsForStage(executionId, stageNumber),

    getRoundRoleIds: (executionRoundId) => this.getRoundRoleIds(executionRoundId),

    canCreateCommonStage: (executionId: string, targetStageNumber: number) =>
      this.canCreateCommonStage(executionId, targetStageNumber),

    getExecutionBatches: (executionId) => this.loadExecutionBatches(executionId),

    getExecutionGraphResolver: () => this.executionGraphResolver,
  });

  private readonly participantService = new RecruitmentExecutionParticipantService({
    getExecutionRevision: (executionId) => this.getExecutionRevision(executionId),

    getExecutionSeries: (seriesId) => this.getExecutionSeries(seriesId),

    getRound: (executionRoundId) => this.getRound(executionRoundId),

    loadRounds: (executionId) => this.loadRounds(executionId),

    loadExecutionBatches: (executionId) => this.loadExecutionBatches(executionId),

    loadRoundParticipantIds: (executionRoundId) => this.loadRoundParticipantIds(executionRoundId),
  });

  private readonly participantAssignmentService =
    new RecruitmentExecutionParticipantAssignmentService({
      getRound: (executionRoundId) => this.getRound(executionRoundId),

      loadExecutionBatches: (executionId) => this.loadExecutionBatches(executionId),
    });

  private readonly readService = new RecruitmentExecutionReadService();

  private readonly progressionService = new RecruitmentExecutionProgressionService({
    getRound: (executionRoundId) => this.getRound(executionRoundId),

    loadHistorySummary: (executionId) => this.loadHistorySummary(executionId),

    loadParticipants: (executionId) => this.loadParticipants(executionId),

    loadRounds: (executionId) => this.loadRounds(executionId),

    loadRoundRoleMappings: (executionId) => this.loadRoundRoleMappings(executionId),

    getRoundRoleIds: (executionRoundId) => this.getRoundRoleIds(executionRoundId),

    assignParticipantsToRound: (input) => this.assignParticipantsToRound(input),

    removeRoundParticipants: (executionRoundId) => this.removeRoundParticipants(executionRoundId),
  });

  private readonly roundSaveService = new RecruitmentExecutionRoundSaveService(
    {
      getRound: (executionRoundId) => this.getRound(executionRoundId),

      getRoundRoleIds: (executionRoundId) => this.getRoundRoleIds(executionRoundId),
    },
    this.progressionService,
  );

  registerExecutionBatchValidationProvider(provider?: ExecutionBatchValidationProvider) {
    this.executionBatchValidationProvider =
      provider ??
      createExecutionBatchValidationProvider(
        {
          loadRounds: (executionId: string) => this.loadRounds(executionId),

          loadRoundRoleMappings: (executionId: string) => this.loadRoundRoleMappings(executionId),

          getActiveRoleIdsForStage: (executionId: string, stageNumber: number) =>
            this.getActiveRoleIdsForStage(executionId, stageNumber),
        },
        {
          canCreateCommonStage,
        },
      );
    this.initializeExecutionGraphResolver();
  }

  private initializeExecutionGraphResolver() {
    if (!this.executionBatchValidationProvider) {
      return;
    }

    this.executionGraphResolver = new ExecutionGraphResolver(
      new ExecutionBatchPlanner(new DefaultStagePlanningProvider()),

      new ExecutionBatchValidator(
        {
          getRoundTransition: (executionId: string) => this.getRoundTransition(executionId),
        },

        this.executionBatchValidationProvider,
      ),
    );
  }

  registerExecutionSeriesService(service: ExecutionSeriesService) {
    this.executionSeriesService = service;
  }

  getSupabaseClient() {
    return supabase;
  }

  /**
   * --------------------------------------------------------------------------
   * Execution Series
   * --------------------------------------------------------------------------
   */

  async getExecutionSeries(seriesId: string): Promise<RecruitmentExecutionSeriesRow | null> {
    return this.executionSeriesService!.getExecutionSeries(seriesId);
  }

  async createExecutionSeries(input: {
    opportunityId: string;
    driveId: string;
    companyId: string;
    snapshot: RecruitmentExecutionSeriesSnapshot;
    createdBy?: string | null;
  }): Promise<RecruitmentExecutionSeriesRow> {
    return this.executionSeriesService!.createExecutionSeries(input);
  }

  /**
   * --------------------------------------------------------------------------
   * Execution Revisions
   * --------------------------------------------------------------------------
   */

  async getLatestExecution(seriesId: string): Promise<RecruitmentExecutionRow | null> {
    return this.executionSeriesService!.getLatestExecution(seriesId);
  }

  async createExecutionRevision(input: {
    seriesId: string;
    revisionNumber: number;
    snapshot: RecruitmentExecutionSnapshot;
    reopenedFromExecutionId?: string | null;
    startedBy?: string | null;
    reopenReason?: string | null;
  }): Promise<RecruitmentExecutionRow> {
    return this.executionSeriesService!.createExecutionRevision(input);
  }

  async startExecutionWorkflow(input: {
    opportunityId: string;
    driveId: string;
    companyId: string;
    seriesSnapshot: RecruitmentExecutionSeriesSnapshot;
    startedBy?: string | null;
  }) {
    // --------------------------------------------------
    // Locate existing execution series
    // --------------------------------------------------

    const { data: existingSeries, error: seriesLookupError } = await (supabase as any)
      .from(EXECUTION_SERIES_TABLE)
      .select("*")
      .eq("opportunity_id", input.opportunityId)
      .maybeSingle();

    if (seriesLookupError) {
      throw seriesLookupError;
    }

    let series = existingSeries as RecruitmentExecutionSeriesRow | null;

    // --------------------------------------------------
    // Create execution series (first launch)
    // --------------------------------------------------

    if (!series) {
      series = await this.createExecutionSeries({
        opportunityId: input.opportunityId,
        driveId: input.driveId,
        companyId: input.companyId,
        snapshot: input.seriesSnapshot,
        createdBy: input.startedBy,
      });
    }

    // --------------------------------------------------
    // Existing execution?
    // --------------------------------------------------

    const latestExecution = await this.getLatestExecution(series.series_id);

    if (latestExecution) {
      return latestExecution;
    }

    // --------------------------------------------------
    // Create Revision 1
    // --------------------------------------------------

    const executionSnapshot: RecruitmentExecutionSnapshot = {
      series_id: series.series_id,

      revision_number: 1,

      started_by: input.startedBy ?? null,

      started_at: new Date().toISOString(),

      participant_application_ids: [],

      planned_rounds: [],
    };

    const execution = await this.createExecutionRevision({
      seriesId: series.series_id,
      revisionNumber: 1,
      snapshot: executionSnapshot,
      startedBy: input.startedBy,
    });

    // --------------------------------------------------
    // Initialize participants
    // --------------------------------------------------

    await this.initializeParticipants(execution.execution_id);

    return execution;
  }

  async finalizeExecution(input: {
    executionId: string;
    finalizedBy?: string | null;
    finalizationNotes?: string | null;
  }): Promise<RecruitmentExecutionRow> {
    return this.executionSeriesService!.finalizeExecution(input);
  }

  async reopenExecution(input: {
    previousExecution: RecruitmentExecutionRow;
    startedBy?: string | null;
    reopenReason: string;
    snapshot: RecruitmentExecutionSnapshot;
  }): Promise<RecruitmentExecutionRow> {
    return this.executionSeriesService!.reopenExecution(input);
  }

  async getExecutionRevision(executionId: string): Promise<RecruitmentExecutionRow | null> {
    return this.executionSeriesService!.getExecutionRevision(executionId);
  }

  async listExecutionRevisions(seriesId: string): Promise<RecruitmentExecutionRow[]> {
    return this.executionSeriesService!.listExecutionRevisions(seriesId);
  }

  // --------------------------------------------------------------------------
  // Round Management
  // --------------------------------------------------------------------------

  private readonly EXECUTION_ROUNDS_TABLE = "recruitment_execution_rounds";

  private readonly EXECUTION_PARTICIPANTS_TABLE = "recruitment_execution_participants";

  private readonly EXECUTION_ROUND_ROLES_TABLE = "recruitment_execution_round_roles";

  private readonly EXECUTION_HISTORY_TABLE = "recruitment_execution_history";

  private readonly APPLICATIONS_TABLE = "student_opportunity_applications";

  private readonly EXECUTION_FINAL_SELECTION_TABLE = "recruitment_execution_final_selection";

  private readonly PLACEMENT_HISTORY_TABLE = "student_placement_history";

  private readonly STUDENT_MASTER_TABLE = "student_master";

  private readonly OPPORTUNITY_TABLE = "opportunity_master";

  private readonly EXECUTION_ROUND_ROLE_MAPPING_TABLE = "recruitment_execution_round_roles";

  private readonly DRIVE_ROLE_TIMELINE_TABLE = "drive_role_timeline";

  private readonly EXECUTION_ROUND_PARTICIPANTS_TABLE = "recruitment_execution_round_participants";

  private readonly DRIVE_ROLES_TABLE = "drive_roles";

  async createExecutionBatch(input: {
    executionId: string;
    creationMode: ExecutionRoundCreationMode;
    roundOrder: number;
    roundName: string;
    scope: ExecutionScope;
    roleIds: string[];
    executionParticipantIds: string[];
    scheduledDate?: string | null;
    scheduledTime?: string | null;
    venue?: string | null;
    remarks?: string | null;
    createdBy?: string | null;
  }): Promise<RecruitmentExecutionRoundRow> {
    return this.roundService.createExecutionBatch(input);
  }

  async createExecutionChildBatch(input: {
    executionId: string;
    parentExecutionRoundId: string;
    batchName: string;
    scheduledDate?: string | null;
    scheduledTime?: string | null;
    venue?: string | null;
    remarks?: string | null;
    createdBy?: string | null;
  }): Promise<RecruitmentExecutionRoundRow> {
    return this.roundService.createExecutionChildBatch(input);
  }

  async createRound(input: {
    executionId: string;
    creationMode: ExecutionRoundCreationMode;
    roundOrder: number;
    roundName: string;
    scope: ExecutionScope;
    scheduledDate?: string | null;
    scheduledTime?: string | null;
    venue?: string | null;
    remarks?: string | null;
    createdBy?: string | null;
  }): Promise<RecruitmentExecutionRoundRow> {
    return this.roundService.createRound(input);
  }

  async assignRolesToRound(executionRoundId: string, roleIds: string[]): Promise<void> {
    return this.roundService.assignRolesToRound(executionRoundId, roleIds);
  }

  async updateExecutionBatch(input: {
    executionRoundId: string;
    batchName: string;
    scheduledDate?: string | null;
    scheduledTime?: string | null;
    venue?: string | null;
    remarks?: string | null;
  }): Promise<RecruitmentExecutionRoundRow> {
    return this.roundService.updateExecutionBatch(input);
  }

  async updateRound(input: {
    executionRoundId: string;
    roundName: string;
    scheduledDate?: string | null;
    scheduledTime?: string | null;
    venue?: string | null;
    remarks?: string | null;
  }): Promise<RecruitmentExecutionRoundRow> {
    return this.roundService.updateRound(input);
  }

  async loadRounds(executionId: string): Promise<RecruitmentExecutionRoundRow[]> {
    return this.readService.loadRounds(executionId);
  }

  private async loadExecutionRounds(executionId: string): Promise<RecruitmentExecutionRoundRow[]> {
    return this.readService.loadExecutionRounds(executionId);
  }

  async populateRoundParticipants(input: {
    sourceExecutionId: string;
    sourceRoundId: string;
    targetRoundId: string;
    roleIds: string[];
  }): Promise<number> {
    const targetRound = await this.getRound(input.targetRoundId);

    if (!targetRound) {
      throw new Error("Target round not found.");
    }

    if (targetRound.scope === "ROLE_SPECIFIC" && input.roleIds.length === 0) {
      throw new Error("Role-specific rounds require at least one assigned role.");
    }

    const participants = await this.progressionService.deriveNextRoundParticipants({
      executionId: input.sourceExecutionId,
      currentRoundId: input.sourceRoundId,
      nextRoundId: input.targetRoundId,
    });

    //
    // Persist batch membership.
    // Every participant should belong to this execution batch exactly once.
    //
    await this.removeRoundParticipants(input.targetRoundId);

    await this.assignParticipantsToRound({
      executionRoundId: input.targetRoundId,
      executionParticipantIds: participants.map(
        (participant) => participant.execution_participant_id,
      ),
    });

    return participants.length;
  }

  async getRound(executionRoundId: string): Promise<RecruitmentExecutionRoundRow | null> {
    return this.readService.getRound(executionRoundId);
  }

  private async loadPublishedTimeline(driveId: string): Promise<
    Array<{
      drive_role_id: string;
      stage_name: string;
      stage_date: string | null;
      description: string | null;
      display_order: number;
    }>
  > {
    return this.readService.loadPublishedTimeline(driveId);
  }

  private async loadRoundParticipantIds(executionRoundId: string): Promise<string[]> {
    return this.participantAssignmentService.loadRoundParticipantIds(executionRoundId);
  }

  async assignExecutionBatchParticipants(input: {
    executionRoundId: string;
    executionParticipantIds: string[];
  }): Promise<void> {
    return this.participantAssignmentService.assignExecutionBatchParticipants(input);
  }

  private async assignParticipantsToRound(input: {
    executionRoundId: string;
    executionParticipantIds: string[];
  }): Promise<void> {
    return this.participantAssignmentService.assignParticipantsToRound(input);
  }

  private async removeRoundParticipants(executionRoundId: string): Promise<void> {
    return this.participantAssignmentService.removeRoundParticipants(executionRoundId);
  }

  // --------------------------------------------------------------------------
  // Participants
  // --------------------------------------------------------------------------

  async loadParticipants(
    executionId: string,
  ): Promise<RecruitmentExecutionParticipantWithStudent[]> {
    return this.participantService.loadParticipants(executionId);
  }

  async loadRoundParticipants(
    executionRoundId: string,
  ): Promise<RecruitmentExecutionParticipantWithStudent[]> {
    return this.participantService.loadRoundParticipants(executionRoundId);
  }

  async loadRoundRoleMappings(
    executionId: string,
  ): Promise<RecruitmentExecutionRoundRoleMapping[]> {
    return this.participantService.loadRoundRoleMappings(executionId);
  }

  private async loadExecutionBatches(executionId: string): Promise<RecruitmentExecutionBatch[]> {
    return this.readService.loadExecutionBatches(executionId);
  }

  private async loadExecutionBatchParticipants(
    executionId: string,
  ): Promise<RecruitmentExecutionBatchParticipant[]> {
    return this.participantService.loadExecutionBatchParticipants(executionId);
  }

  // --------------------------------------------------------------------------
  // History
  // --------------------------------------------------------------------------

  async loadHistorySummary(executionId: string): Promise<RecruitmentExecutionHistorySummary[]> {
    return recruitmentExecutionHistoryService.loadHistorySummary(executionId);
  }

  // --------------------------------------------------------------------------
  // Participant Initialization
  // --------------------------------------------------------------------------

  async initializeParticipants(executionId: string): Promise<number> {
    return recruitmentExecutionParticipantInitializationService.initializeParticipants(executionId);
  }

  // --------------------------------------------------------------------------
  // Round Save Helpers
  // --------------------------------------------------------------------------

  private async validateRound(executionRoundId: string): Promise<RecruitmentExecutionRoundRow> {
    return this.roundSaveService.validateRound(executionRoundId);
  }

  // --------------------------------------------------------------------------
  // Round Save
  // --------------------------------------------------------------------------
  async saveRound(input: {
    executionId: string;
    executionRoundId: string;
    executionRevision: number;
    nextRoundId?: string;
    changedBy?: string | null;
    batchAssignments?: {
      executionParticipantId: string;
      executionRoundId: string;
    }[];
    participantRoles: Array<{
      executionParticipantId: string;
      roles: Array<{
        driveRoleId: string;
        driveRoleName: string;
      }>;
    }>;
    rows: Array<{
      executionParticipantId: string;
      attendanceStatus: ExecutionAttendanceStatus | null;
      gateStatus: ExecutionGateStatus | null;
      progressionStatus: ExecutionProgressionStatus;
      remarks?: string | null;
      absenceDisposition?: "ALLOWED" | "UNALLOWED" | null;
      absenceReason?: string | null;
      restrictionOverride?: boolean;
      restrictionOverrideReason?: string | null;
    }>;
  }): Promise<{
    savedEvents: number;
    progressedParticipants: number;
  }> {
    return this.roundSaveService.saveRound(input);
  }
  // --------------------------------------------------------------------------
  // Progression Engine
  // --------------------------------------------------------------------------

  private async getRoundRoleIds(executionRoundId: string): Promise<string[]> {
    return this.readService.getRoundRoleIds(executionRoundId);
  }

  private async getExecutionContext(executionId: string) {
    const execution = await this.getExecutionRevision(executionId);

    if (!execution) {
      throw new Error("Execution not found.");
    }

    const series = await this.getExecutionSeries(execution.series_id);

    if (!series) {
      throw new Error("Execution series not found.");
    }

    return recruitmentExecutionContextService.getExecutionContext({
      execution,
      series,
    });
  }

  private async validateOpportunityClosed(executionId: string): Promise<void> {
    const execution = await this.getExecutionRevision(executionId);

    if (!execution) {
      throw new Error("Execution not found.");
    }

    const series = await this.getExecutionSeries(execution.series_id);

    if (!series) {
      throw new Error("Execution series not found.");
    }

    await recruitmentExecutionContextService.validateOpportunityClosed({
      execution,
      series,
    });
  }

  // --------------------------------------------------------------------------
  // Round Progression
  // --------------------------------------------------------------------------

  async progressToNextRound(input: {
    executionId: string;
    currentRoundId: string;
    nextRoundId: string;
  }): Promise<{
    progressedParticipants: number;
  }> {
    await this.validateRound(input.currentRoundId);
    await this.validateRound(input.nextRoundId);

    const participants = await this.progressionService.deriveNextRoundParticipants({
      executionId: input.executionId,
      currentRoundId: input.currentRoundId,
      nextRoundId: input.nextRoundId,
    });

    return {
      progressedParticipants: participants.length,
    };
  }

  async finalizeExecutionWorkflow(input: {
    executionId: string;
    finalizedBy?: string | null;
    finalizationNotes?: string | null;
  }) {
    const [participants, history] = await Promise.all([
      this.loadParticipants(input.executionId),
      this.loadHistorySummary(input.executionId),
    ]);

    recruitmentExecutionSelectionService.validateExecutionCompletion({
      participants,
      history,
    });
    await this.validateOpportunityClosed(input.executionId);

    const selectedParticipants = recruitmentExecutionSelectionService.getSelectedParticipants({
      history,
      participants,
    });

    const finalSelectionRows = recruitmentExecutionSelectionService.buildFinalSelectionRows({
      executionId: input.executionId,
      participants: selectedParticipants,
    });

    const execution = await this.getExecutionRevision(input.executionId);

    if (!execution) {
      throw new Error("Execution not found.");
    }

    const series = await this.getExecutionSeries(execution.series_id);

    if (!series) {
      throw new Error("Execution series not found.");
    }

    const companyName = await recruitmentExecutionContextService.getCompanyName({
      execution,
      series,
    });

    const placementHistoryRows = recruitmentExecutionSelectionService.buildPlacementHistoryRows({
      participants: selectedParticipants,
      opportunityId: series.opportunity_id,
      driveId: series.drive_id,
      companyId: series.company_id,
      companyName,
    });

    const studentIds = recruitmentExecutionSelectionService.buildStudentPlacementUpdates({
      participants: selectedParticipants,
    });

    const { data: finalizedExecution, error } = await (supabase as any).rpc(
      "finalize_recruitment_execution",
      {
        p_execution_id: input.executionId,
        p_finalized_by: input.finalizedBy ?? null,
        p_finalization_notes: input.finalizationNotes ?? null,
        p_final_selection_rows: finalSelectionRows,
        p_placement_history_rows: placementHistoryRows,
        p_student_ids: studentIds,
      },
    );

    if (error) {
      throw error;
    }

    return {
      execution: finalizedExecution,
      finalSelectionCount: finalSelectionRows.length,
      placementHistoryCount: placementHistoryRows.length,
      updatedStudents: studentIds.length,
    };
  }

  // --------------------------------------------------------------------------
  // Dashboard
  // --------------------------------------------------------------------------

  async getExecutionDashboard(executionId: string) {
    const workspace = await this.loadExecutionWorkspace(executionId);

    const totalParticipants = workspace.participants.length;

    const totalRounds = workspace.rounds.length;

    const finalizedRounds = 0;

    return {
      ...workspace,
      metrics: {
        totalParticipants,
        totalRounds,
        finalizedRounds,
      },
    };
  }

  // --------------------------------------------------------------------------
  // Workspace Facade
  // --------------------------------------------------------------------------

  async getRoundTransition(executionId: string): Promise<{
    currentStage: number | null;
    currentScope: ExecutionScope | null;
    nextStage: number | null;
    nextScope: ExecutionScope | null;
    requiresRoleAssignment: boolean;
    requiresSynchronization: boolean;
  }> {
    const rounds = await this.loadRounds(executionId);

    if (rounds.length === 0) {
      return {
        currentStage: null,
        currentScope: null,
        nextStage: null,
        nextScope: null,
        requiresRoleAssignment: false,
        requiresSynchronization: false,
      };
    }

    const latestStage = Math.max(...rounds.map((round) => round.stage_number));

    const currentRounds = rounds.filter((round) => round.stage_number === latestStage);

    const currentScope = currentRounds.some((round) => round.scope === "ROLE_SPECIFIC")
      ? "ROLE_SPECIFIC"
      : "COMMON";

    const nextRounds = rounds.filter((round) => round.stage_number === latestStage + 1);

    if (nextRounds.length === 0) {
      return {
        currentStage: latestStage,
        currentScope,
        nextStage: null,
        nextScope: null,
        requiresRoleAssignment: false,
        requiresSynchronization: false,
      };
    }

    const nextScope = nextRounds.some((round) => round.scope === "ROLE_SPECIFIC")
      ? "ROLE_SPECIFIC"
      : "COMMON";

    return {
      currentStage: latestStage,
      currentScope,
      nextStage: latestStage + 1,
      nextScope,
      requiresRoleAssignment: currentScope === "COMMON" && nextScope === "ROLE_SPECIFIC",
      requiresSynchronization: currentScope === "ROLE_SPECIFIC" && nextScope === "COMMON",
    };
  }

  private async getActiveRoleIdsForStage(
    executionId: string,
    stageNumber: number,
  ): Promise<Set<string>> {
    const rounds = await this.loadRounds(executionId);

    const mappings = await this.loadRoundRoleMappings(executionId);

    const activeRoleIds = new Set<string>();

    rounds
      .filter((round) => round.stage_number === stageNumber && round.scope === "ROLE_SPECIFIC")
      .forEach((round) => {
        mappings
          .filter((mapping) => mapping.execution_round_id === round.execution_round_id)
          .forEach((mapping) => {
            activeRoleIds.add(mapping.drive_role_id);
          });
      });

    return activeRoleIds;
  }

  async canCreateCommonStage(executionId: string, targetStageNumber: number): Promise<boolean> {
    const rounds = await this.loadRounds(executionId);

    const mappings = await this.loadRoundRoleMappings(executionId);

    const previousStage = targetStageNumber - 1;

    const activeRoleIds = await this.getActiveRoleIdsForStage(executionId, previousStage);

    return canCreateCommonStage({
      targetStageNumber,
      rounds,
      mappings,
      activeRoleIds,
    });
  }

  private async calculatePendingRoles(
    executionId: string,
  ): Promise<RecruitmentExecutionRemainingRole[]> {
    const [participants, historySummary, roundRoleMappings, rounds] = await Promise.all([
      this.loadParticipants(executionId),
      this.loadHistorySummary(executionId),
      this.loadRoundRoleMappings(executionId),
      this.loadRounds(executionId),
    ]);
    const transition = await this.getRoundTransition(executionId);

    if (!transition.requiresRoleAssignment) {
      return [];
    }
    // ------------------------------------------------------------------
    // Pure Common Execution
    //
    // If the execution does not contain ANY role-specific rounds,
    // then there are no pending role assignments.
    //
    // This allows:
    //
    // Common -> Common
    // Common -> Common -> Common
    //
    // workflows to progress normally.
    // ------------------------------------------------------------------

    const remaining = new Map<string, RecruitmentExecutionRemainingRole>();

    historySummary.forEach((history) => {
      if (history.progression_status !== "SHORTLISTED") {
        return;
      }

      const participant = participants.find(
        (p) => p.execution_participant_id === history.execution_participant_id,
      );

      if (!participant) {
        return;
      }

      const currentRound = rounds.find((r) => r.execution_round_id === history.execution_round_id);

      if (!currentRound) {
        return;
      }
      if (
        transition.currentStage !== null &&
        currentRound.stage_number !== transition.currentStage
      ) {
        return;
      }
      //
      // A COMMON round never consumes roles.
      //
      // After a common screening every shortlisted role is still active
      // until it is explicitly assigned to a ROLE_SPECIFIC round.
      //
      const consumedRoleIds =
        currentRound.scope === "ROLE_SPECIFIC"
          ? new Set(
              roundRoleMappings
                .filter((mapping) => mapping.execution_round_id === currentRound.execution_round_id)
                .map((mapping) => mapping.drive_role_id),
            )
          : new Set<string>();

      participant.selected_roles.forEach((role) => {
        if (consumedRoleIds.has(role.drive_role_id)) {
          return;
        }

        const existing = remaining.get(role.drive_role_id);

        if (existing) {
          existing.candidate_count += 1;
        } else {
          remaining.set(role.drive_role_id, {
            drive_role_id: role.drive_role_id,
            drive_role_name: role.drive_role_name,
            candidate_count: 1,
          });
        }
      });
    });

    return [...remaining.values()].sort((a, b) =>
      a.drive_role_name.localeCompare(b.drive_role_name),
    );
  }

  async loadExecutionWorkspace(executionId: string): Promise<RecruitmentExecutionWorkspace> {
    const execution = await this.getExecutionRevision(executionId);

    if (!execution) {
      throw new Error("Execution not found.");
    }

    const series = await this.getExecutionSeries(execution.series_id);

    if (!series) {
      throw new Error("Execution series not found.");
    }

    // Always synchronize newly applied students.
    // Existing participants are ignored because initializeParticipants()
    // only inserts missing application_ids.
    await this.initializeParticipants(executionId);

    const rounds = await this.loadRounds(executionId);

    const participants = await this.loadParticipants(executionId);

    const roundRoleMappings = await this.loadRoundRoleMappings(executionId);

    const historySummary = await this.loadHistorySummary(executionId);

    const runtimeSnapshot = await recruitmentExecutionSnapshotService.loadSnapshot(executionId);

    const allExecutionBatches = await this.loadExecutionBatches(executionId);

    const executionBatches = allExecutionBatches.filter((batch) => {
      const parent = rounds.find(
        (round) => round.execution_round_id === batch.parent_execution_round_id,
      );

      // Ignore orphaned child batches.
      if (!parent) {
        return false;
      }

      // Role-specific execution batches are always administrator-managed.
      if (parent.scope !== "COMMON") {
        return true;
      }

      const siblingBatches = allExecutionBatches.filter(
        (candidate) => candidate.parent_execution_round_id === parent.execution_round_id,
      );

      // Legacy COMMON execution model:
      // A single automatically-created execution batch exists only to own
      // participant membership. Keep it hidden from the workspace.
      if (siblingBatches.length <= 1) {
        return false;
      }

      // Multiple execution batches:
      // Keep the automatically-created default execution batch hidden while
      // exposing administrator-created execution batches.
      const hiddenDefaultBatch = siblingBatches.reduce((earliest, current) =>
        current.round_order < earliest.round_order ? current : earliest,
      );

      return batch.execution_round_id !== hiddenDefaultBatch.execution_round_id;
    });

    const executionBatchParticipants = await this.loadExecutionBatchParticipants(executionId);

    const transition = await this.getRoundTransition(executionId);

    const remainingActiveRoles = transition.requiresRoleAssignment
      ? await this.calculatePendingRoles(executionId)
      : [];

    const commonStageLocked =
      transition.requiresSynchronization &&
      transition.currentStage !== null &&
      !(await this.canCreateCommonStage(executionId, transition.currentStage + 1));

    const commonStageLockReason = commonStageLocked
      ? "One or more role-specific pipelines have already configured their immediate next stage. Complete those configured stages before merging into a Common stage."
      : null;

    return {
      series,
      execution,
      rounds,
      participants,
      roundRoleMappings,
      historySummary,
      runtimeSnapshot,

      executionBatches,
      executionBatchParticipants,

      remainingActiveRoles,
      transition,
      commonStageLocked,
      commonStageLockReason,
    };
  }
}

export const recruitmentExecutionService = new RecruitmentExecutionService();

recruitmentExecutionService.registerExecutionSeriesService(recruitmentExecutionSeriesService);

recruitmentExecutionService.registerExecutionBatchValidationProvider();

recruitmentExecutionParticipantInitializationService.registerProviders({
  getExecutionRevision: recruitmentExecutionService.getExecutionRevision.bind(
    recruitmentExecutionService,
  ),

  getExecutionSeries: recruitmentExecutionService.getExecutionSeries.bind(
    recruitmentExecutionService,
  ),
});
