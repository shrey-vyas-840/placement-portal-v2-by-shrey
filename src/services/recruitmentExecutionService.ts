import { supabase } from "@/integrations/supabase/client";
import { recruitmentExecutionRestrictionService } from "./recruitmentExecutionRestrictionService";
import { executionGraphResolver } from "./executionGraphResolver";
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
  getSupabaseClient() {
    return supabase;
  }

  /**
   * --------------------------------------------------------------------------
   * Execution Series
   * --------------------------------------------------------------------------
   */

  async getExecutionSeries(seriesId: string): Promise<RecruitmentExecutionSeriesRow | null> {
    const { data, error } = await (supabase as any)
      .from(EXECUTION_SERIES_TABLE)
      .select("*")
      .eq("series_id", seriesId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data as RecruitmentExecutionSeriesRow | null;
  }

  async createExecutionSeries(input: {
    opportunityId: string;
    driveId: string;
    companyId: string;
    snapshot: RecruitmentExecutionSeriesSnapshot;
    createdBy?: string | null;
  }): Promise<RecruitmentExecutionSeriesRow> {
    const { data, error } = await (supabase as any)
      .from(EXECUTION_SERIES_TABLE)
      .insert({
        opportunity_id: input.opportunityId,
        drive_id: input.driveId,
        company_id: input.companyId,
        series_snapshot: input.snapshot,
        created_by: input.createdBy ?? null,
      })
      .select()
      .single();

    return requireData(
      data as RecruitmentExecutionSeriesRow | null,
      error,
      "createExecutionSeries",
    );
  }

  /**
   * --------------------------------------------------------------------------
   * Execution Revisions
   * --------------------------------------------------------------------------
   */

  async getLatestExecution(seriesId: string): Promise<RecruitmentExecutionRow | null> {
    const { data, error } = await (supabase as any)
      .from(EXECUTIONS_TABLE)
      .select("*")
      .eq("series_id", seriesId)
      .order("revision_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data as RecruitmentExecutionRow | null;
  }

  async createExecutionRevision(input: {
    seriesId: string;
    revisionNumber: number;
    snapshot: RecruitmentExecutionSnapshot;
    reopenedFromExecutionId?: string | null;
    startedBy?: string | null;
    reopenReason?: string | null;
  }): Promise<RecruitmentExecutionRow> {
    const { data, error } = await (supabase as any)
      .from(EXECUTIONS_TABLE)
      .insert({
        series_id: input.seriesId,
        revision_number: input.revisionNumber,
        execution_snapshot: input.snapshot,
        reopened_from_execution_id: input.reopenedFromExecutionId ?? null,
        started_by: input.startedBy ?? null,
        reopen_reason: input.reopenReason ?? null,
      })
      .select()
      .single();

    return requireData(data as RecruitmentExecutionRow | null, error, "createExecutionRevision");
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
    const { data, error } = await (supabase as any)
      .from(EXECUTIONS_TABLE)
      .update({
        execution_status: "FINALIZED",
        finalized_by: input.finalizedBy ?? null,
        finalized_at: new Date().toISOString(),
        finalization_notes: input.finalizationNotes ?? null,
      })
      .eq("execution_id", input.executionId)
      .select()
      .single();

    return requireData(data as RecruitmentExecutionRow | null, error, "finalizeExecution");
  }

  async reopenExecution(input: {
    previousExecution: RecruitmentExecutionRow;
    startedBy?: string | null;
    reopenReason: string;
    snapshot: RecruitmentExecutionSnapshot;
  }): Promise<RecruitmentExecutionRow> {
    return this.createExecutionRevision({
      seriesId: input.previousExecution.series_id,
      revisionNumber: input.previousExecution.revision_number + 1,
      snapshot: input.snapshot,
      reopenedFromExecutionId: input.previousExecution.execution_id,
      startedBy: input.startedBy,
      reopenReason: input.reopenReason,
    });
  }

  async getExecutionRevision(executionId: string): Promise<RecruitmentExecutionRow | null> {
    const { data, error } = await (supabase as any)
      .from(EXECUTIONS_TABLE)
      .select("*")
      .eq("execution_id", executionId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data as RecruitmentExecutionRow | null;
  }

  async listExecutionRevisions(seriesId: string): Promise<RecruitmentExecutionRow[]> {
    const { data, error } = await (supabase as any)
      .from(EXECUTIONS_TABLE)
      .select("*")
      .eq("series_id", seriesId)
      .order("revision_number", {
        ascending: false,
      });

    if (error) {
      throw error;
    }

    return (data ?? []) as RecruitmentExecutionRow[];
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

  async loadRounds(executionId: string): Promise<RecruitmentExecutionRoundRow[]> {
    const { data, error } = await (supabase as any)
      .from(this.EXECUTION_ROUNDS_TABLE)
      .select("*")
      .eq("execution_id", executionId)
      .is("parent_execution_round_id", null)
      .order("round_order", {
        ascending: true,
      });

    if (error) {
      throw error;
    }

    return (data ?? []) as RecruitmentExecutionRoundRow[];
  }

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
    //informed to remove this code -
    // await executionGraphResolver.resolveExecutionBatchCreation({
    //   executionId: input.executionId,
    //   creationMode: input.creationMode,
    //   scope: input.scope,
    // });

    const rounds = await this.loadExecutionRounds(input.executionId);

    const creationPlan = await executionGraphResolver.resolveExecutionBatchCreation({
      executionId: input.executionId,
      creationMode: input.creationMode,
      scope: input.scope,
      existingRounds: rounds,
    });

    const nextRoundOrder = creationPlan.nextRoundOrder!;
    const stageNumber = creationPlan.stageNumber!;

    await executionGraphResolver.resolveExecutionBatchValidation({
      executionId: input.executionId,
      stageNumber,
      scope: input.scope,
    });

    const { data, error } = await (supabase as any).rpc("create_execution_batch_transaction", {
      p_execution_id: input.executionId,
      p_creation_mode: input.creationMode,
      p_round_order: nextRoundOrder,
      p_round_name: input.roundName,
      p_scope: input.scope,
      p_stage_number: stageNumber,
      p_scheduled_date: input.scheduledDate ?? null,
      p_scheduled_time: input.scheduledTime ?? null,
      p_venue: input.venue ?? null,
      p_remarks: input.remarks ?? null,
      p_created_by: input.createdBy ?? null,
      p_role_ids: input.roleIds,
      p_execution_participant_ids: input.executionParticipantIds,
    });

    return requireData(data as RecruitmentExecutionRoundRow | null, error, "createExecutionBatch");
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
    const parent = await this.getRound(input.parentExecutionRoundId);

    if (!parent) {
      throw new Error("Parent execution stage not found.");
    }

    //
    // Every execution_round row must have a unique round_order.
    //
    const rounds = await this.loadExecutionRounds(input.executionId);

    const nextRoundOrder = Math.max(...rounds.map((r) => r.round_order), 0) + 1;

    const { data, error } = await (supabase as any)
      .from(this.EXECUTION_ROUNDS_TABLE)
      .insert({
        execution_id: input.executionId,

        stage_number: parent.stage_number,

        round_order: nextRoundOrder,

        round_name: input.batchName,

        scope: parent.scope,

        scheduled_date: input.scheduledDate ?? parent.scheduled_date,

        scheduled_time: input.scheduledTime ?? parent.scheduled_time,

        venue: input.venue ?? parent.venue,

        remarks: input.remarks ?? parent.remarks,

        created_by: input.createdBy ?? null,

        parent_execution_round_id: parent.execution_round_id,
      })
      .select()
      .single();

    return requireData(
      data as RecruitmentExecutionRoundRow | null,
      error,
      "createExecutionChildBatch",
    );
  }

  private async loadExecutionRounds(executionId: string): Promise<RecruitmentExecutionRoundRow[]> {
    const { data, error } = await (supabase as any)
      .from(this.EXECUTION_ROUNDS_TABLE)
      .select("*")
      .eq("execution_id", executionId)
      .order("round_order", {
        ascending: true,
      });

    if (error) {
      throw error;
    }

    return (data ?? []) as RecruitmentExecutionRoundRow[];
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
    const rounds = await this.loadExecutionRounds(input.executionId);

    const creationPlan = await executionGraphResolver.resolveExecutionBatchCreation({
      executionId: input.executionId,
      creationMode: input.creationMode,
      scope: input.scope,
      existingRounds: rounds,
    });

    const nextRoundOrder = creationPlan.nextRoundOrder!;

    const stageNumber = creationPlan.stageNumber!;

    await executionGraphResolver.resolveExecutionBatchValidation({
      executionId: input.executionId,
      stageNumber,
      scope: input.scope,
    });

    const { data, error } = await (supabase as any)
      .from(this.EXECUTION_ROUNDS_TABLE)
      .insert({
        execution_id: input.executionId,
        stage_number: stageNumber,
        round_order: nextRoundOrder,
        round_name: input.roundName,
        scope: input.scope,
        scheduled_date: input.scheduledDate ?? null,
        scheduled_time: input.scheduledTime ?? null,
        venue: input.venue ?? null,
        remarks: input.remarks ?? null,
        created_by: input.createdBy ?? null,
        parent_execution_round_id: null,
      })
      .select()
      .single();

    return requireData(data as RecruitmentExecutionRoundRow | null, error, "createRound");
  }

  async assignRolesToRound(executionRoundId: string, roleIds: string[]): Promise<void> {
    if (roleIds.length === 0) {
      return;
    }

    const round = await this.getRound(executionRoundId);

    if (!round) {
      throw new Error("Execution round not found.");
    }

    const rounds = await this.loadRounds(round.execution_id);

    const siblingRounds = rounds.filter(
      (r) => r.stage_number === round.stage_number && r.execution_round_id !== executionRoundId,
    );

    if (siblingRounds.length === 0) {
      const rows = roleIds.map((roleId) => ({
        execution_round_id: executionRoundId,
        drive_role_id: roleId,
      }));

      const { error } = await (supabase as any)
        .from(this.EXECUTION_ROUND_ROLE_MAPPING_TABLE)
        .insert(rows);

      if (error) {
        throw error;
      }

      return;
    }

    const siblingRoundIds = siblingRounds.map((r) => r.execution_round_id);

    const { data, error } = await (supabase as any)
      .from(this.EXECUTION_ROUND_ROLE_MAPPING_TABLE)
      .select("drive_role_id")
      .in("execution_round_id", siblingRoundIds);

    if (error) {
      throw error;
    }

    const assignedRoleIds = new Set((data ?? []).map((row: any) => row.drive_role_id));

    const duplicateRole = roleIds.find((id) => assignedRoleIds.has(id));

    if (duplicateRole) {
      throw new Error(
        "One or more selected roles are already assigned to another round in this stage.",
      );
    }

    const rows = roleIds.map((roleId) => ({
      execution_round_id: executionRoundId,
      drive_role_id: roleId,
    }));

    const { error: insertError } = await (supabase as any)
      .from(this.EXECUTION_ROUND_ROLE_MAPPING_TABLE)
      .insert(rows);

    if (insertError) {
      throw insertError;
    }
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

    const participants = await this.deriveNextRoundParticipants({
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

  async updateExecutionBatch(input: {
    executionRoundId: string;
    batchName: string;
    scheduledDate?: string | null;
    scheduledTime?: string | null;
    venue?: string | null;
    remarks?: string | null;
  }): Promise<RecruitmentExecutionRoundRow> {
    const { data, error } = await (supabase as any)
      .from(this.EXECUTION_ROUNDS_TABLE)
      .update({
        round_name: input.batchName,
        scheduled_date: input.scheduledDate ?? null,
        scheduled_time: input.scheduledTime ?? null,
        venue: input.venue ?? null,
        remarks: input.remarks ?? null,
      })
      .eq("execution_round_id", input.executionRoundId)
      .not("parent_execution_round_id", "is", null)
      .select()
      .single();

    return requireData(data as RecruitmentExecutionRoundRow | null, error, "updateExecutionBatch");
  }

  async updateRound(input: {
    executionRoundId: string;
    roundName: string;
    scheduledDate?: string | null;
    scheduledTime?: string | null;
    venue?: string | null;
    remarks?: string | null;
  }): Promise<RecruitmentExecutionRoundRow> {
    const { data, error } = await (supabase as any)
      .from(this.EXECUTION_ROUNDS_TABLE)
      .update({
        round_name: input.roundName,
        scheduled_date: input.scheduledDate ?? null,
        scheduled_time: input.scheduledTime ?? null,
        venue: input.venue ?? null,
        remarks: input.remarks ?? null,
      })
      .eq("execution_round_id", input.executionRoundId)
      .select()
      .single();

    return requireData(data as RecruitmentExecutionRoundRow | null, error, "updateRound");
  }

  async getRound(executionRoundId: string): Promise<RecruitmentExecutionRoundRow | null> {
    const { data, error } = await (supabase as any)
      .from(this.EXECUTION_ROUNDS_TABLE)
      .select("*")
      .eq("execution_round_id", executionRoundId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data as RecruitmentExecutionRoundRow | null;
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
    const { data, error } = await (supabase as any)
      .from(this.DRIVE_ROLE_TIMELINE_TABLE)
      .select(
        `
        drive_role_id,
        stage_name,
        stage_date,
        description,
        display_order,
        drive_roles!inner(
          drive_id
        )
      `,
      )
      .eq("drive_roles.drive_id", driveId)
      .order("display_order", {
        ascending: true,
      });

    if (error) {
      throw error;
    }

    return (data ?? []).map((row: any) => ({
      drive_role_id: row.drive_role_id,
      stage_name: row.stage_name,
      stage_date: row.stage_date,
      description: row.description,
      display_order: row.display_order,
    }));
  }

  private buildExecutionRounds(
    timeline: Array<{
      drive_role_id: string;
      stage_name: string;
      stage_date: string | null;
      description: string | null;
      display_order: number;
    }>,
  ): Array<{
    roundOrder: number;
    roundName: string;
    scheduledDate: string | null;
    remarks: string | null;
    roleIds: string[];
  }> {
    const grouped = new Map<
      string,
      {
        roundOrder: number;
        roundName: string;
        scheduledDate: string | null;
        remarks: string | null;
        roleIds: Set<string>;
      }
    >();

    for (const stage of timeline) {
      const key = `${stage.display_order}::${stage.stage_name.trim().toLowerCase()}`;

      if (!grouped.has(key)) {
        grouped.set(key, {
          roundOrder: stage.display_order,
          roundName: stage.stage_name,
          scheduledDate: stage.stage_date,
          remarks: stage.description,
          roleIds: new Set(),
        });
      }

      grouped.get(key)!.roleIds.add(stage.drive_role_id);
    }

    return [...grouped.values()]
      .sort((a, b) => a.roundOrder - b.roundOrder)
      .map((round) => ({
        roundOrder: round.roundOrder,
        roundName: round.roundName,
        scheduledDate: round.scheduledDate,
        remarks: round.remarks,
        roleIds: [...round.roleIds],
      }));
  }

  private async loadRoundParticipantIds(executionRoundId: string): Promise<string[]> {
    const { data, error } = await (supabase as any)
      .from(this.EXECUTION_ROUND_PARTICIPANTS_TABLE)
      .select("execution_participant_id")
      .eq("execution_round_id", executionRoundId);

    if (error) {
      throw error;
    }

    return (data ?? []).map((row: any) => row.execution_participant_id as string);
  }

  async assignExecutionBatchParticipants(input: {
    executionRoundId: string;
    executionParticipantIds: string[];
  }): Promise<void> {
    console.log("ASSIGN BATCH", {
      executionRoundId: input.executionRoundId,
      participantCount: input.executionParticipantIds.length,
      participantIds: input.executionParticipantIds,
    });

    await this.removeRoundParticipants(input.executionRoundId);

    await this.assignParticipantsToRound(input);
  }

  private async assignParticipantsToRound(input: {
    executionRoundId: string;
    executionParticipantIds: string[];
  }): Promise<void> {
    if (input.executionParticipantIds.length === 0) {
      return;
    }

    const round = await this.getRound(input.executionRoundId);

    if (!round) {
      throw new Error("Execution round not found.");
    }

    //
    // A participant may belong to only ONE execution batch
    // within the same stage.
    //
    const parentRoundId = round.parent_execution_round_id ?? round.execution_round_id;

    const siblingRounds = (await this.loadExecutionBatches(round.execution_id)).filter(
      (candidate) =>
        candidate.parent_execution_round_id === parentRoundId &&
        candidate.execution_round_id !== input.executionRoundId,
    );

    if (siblingRounds.length > 0 && input.executionParticipantIds.length > 0) {
      const siblingRoundIds = siblingRounds.map((candidate) => candidate.execution_round_id);

      const { error: deleteError } = await (supabase as any)
        .from(this.EXECUTION_ROUND_PARTICIPANTS_TABLE)
        .delete()
        .in("execution_round_id", siblingRoundIds)
        .in("execution_participant_id", input.executionParticipantIds);

      if (deleteError) {
        throw deleteError;
      }
    }

    const rows = input.executionParticipantIds.map((executionParticipantId) => ({
      execution_round_id: input.executionRoundId,
      execution_participant_id: executionParticipantId,
    }));

    console.log("INSERTING ROUND PARTICIPANTS", {
      executionRoundId: input.executionRoundId,
      rows,
    });

    const { data: inserted, error } = await (supabase as any)
      .from(this.EXECUTION_ROUND_PARTICIPANTS_TABLE)
      .insert(rows)
      .select();

    console.log("INSERT RESULT", inserted);

    if (error) {
      console.error("INSERT ERROR", error);
      throw error;
    }

    const { data: verify } = await (supabase as any)
      .from(this.EXECUTION_ROUND_PARTICIPANTS_TABLE)
      .select("*")
      .eq("execution_round_id", input.executionRoundId);

    console.log("VERIFY AFTER INSERT", verify);
  }

  private async removeRoundParticipants(executionRoundId: string): Promise<void> {
    const { error } = await (supabase as any)
      .from(this.EXECUTION_ROUND_PARTICIPANTS_TABLE)
      .delete()
      .eq("execution_round_id", executionRoundId);

    if (error) {
      throw error;
    }
  }

  // --------------------------------------------------------------------------
  // Participants
  // --------------------------------------------------------------------------

  async loadParticipants(
    executionId: string,
  ): Promise<RecruitmentExecutionParticipantWithStudent[]> {
    const { data, error } = await (supabase as any)
      .from(this.EXECUTION_PARTICIPANTS_TABLE)
      .select(
        `
        *,
        student_opportunity_applications (
          application_status,
          student_master (
            student_id,
            enrollment_no,
            first_name,
            middle_name,
            last_name,
            institute_email,
            contact_number,
            placement_status,
            placement_preference
          ),
          student_application_selected_roles (
            selected_role_id,
            drive_role_id,
            preference_order,
            drive_roles (
              drive_role_name
            )
          )
        )
      `,
      )
      .eq("execution_id", executionId);

    if (error) {
      throw error;
    }

    const participantRows = (data ?? []) as any[];

    const studentIds = participantRows.map((participant) => participant.student_id).filter(Boolean);

    const execution = await this.getExecutionRevision(executionId);

    if (!execution) {
      throw new Error("Execution not found.");
    }

    const series = await this.getExecutionSeries(execution.series_id);

    if (!series) {
      throw new Error("Execution series not found.");
    }

    const restrictionStates =
      await recruitmentExecutionRestrictionService.resolveParticipantRestrictions(
        series.opportunity_id,
        studentIds,
      );

    const { data: batchAssignments, error: batchAssignmentError } = await (supabase as any)
      .from(this.EXECUTION_ROUND_PARTICIPANTS_TABLE)
      .select(
        `
        execution_participant_id,
      recruitment_execution_rounds (
        execution_round_id,
        parent_execution_round_id,
        round_name,
        scheduled_date,
        scheduled_time
      )
    `,
      );

    if (batchAssignmentError) {
      throw batchAssignmentError;
    }

    const participantBatchMap = new Map<string, any>();

    (batchAssignments ?? []).forEach((row: any) => {
      const round = row.recruitment_execution_rounds;

      if (!round.parent_execution_round_id) {
        return;
      }

      if (!round) {
        return;
      }

      participantBatchMap.set(row.execution_participant_id, {
        execution_round_id: round.execution_round_id,
        batch_name: round.round_name,
        batch_date: round.scheduled_date,
        batch_time: round.scheduled_time,
      });
    });

    return participantRows.map((participant: any) => {
      const restriction = restrictionStates.get(participant.student_id);

      return {
        execution_participant_id: participant.execution_participant_id,
        execution_id: participant.execution_id,
        application_id: participant.application_id,
        student_id: participant.student_id,
        created_at: participant.created_at,
        updated_at: participant.updated_at,

        application_status:
          participant.student_opportunity_applications?.application_status ?? "Applied",

        student: participant.student_opportunity_applications?.student_master,

        selected_roles: (
          participant.student_opportunity_applications?.student_application_selected_roles ?? []
        ).map((role: any) => ({
          selected_role_id: role.selected_role_id,
          drive_role_id: role.drive_role_id,
          preference_order: role.preference_order,
          drive_role_name: role.drive_roles?.drive_role_name ?? "",
        })),
        is_globally_restricted: restriction?.isGloballyRestricted ?? false,

        restriction_reason: restriction?.restrictionReason ?? null,

        effective_gate_status: restriction?.effectiveGateStatus ?? "ALLOWED",

        can_override_gate: restriction?.canOverride ?? false,

        has_opportunity_override: restriction?.hasOpportunityOverride ?? false,

        execution_batch: participantBatchMap.get(participant.execution_participant_id) ?? null,
      };
    });
  }

  async loadRoundParticipants(
    executionRoundId: string,
  ): Promise<RecruitmentExecutionParticipantWithStudent[]> {
    const round = await this.getRound(executionRoundId);

    if (!round) {
      throw new Error("Execution round not found.");
    }

    const participants = await this.loadParticipants(round.execution_id);

    // Child execution batches always load their own persisted membership.
    if (round.parent_execution_round_id) {
      const participantIds = await this.loadRoundParticipantIds(executionRoundId);

      if (participantIds.length === 0) {
        return [];
      }

      const participantIdSet = new Set(participantIds);

      return participants.filter((participant) =>
        participantIdSet.has(participant.execution_participant_id),
      );
    }

    // Parent execution stage
    const childBatches = (await this.loadExecutionBatches(round.execution_id)).filter(
      (batch) => batch.parent_execution_round_id === round.execution_round_id,
    );

    // If the stage has not yet been split into execution batches,
    // preserve the existing Stage 1 behaviour by showing every
    // execution participant.
    if (childBatches.length === 0) {
      return participants;
    }

    // Once execution batches exist, the union of all child batch
    // memberships becomes the source of truth for the stage.
    const participantIdSet = new Set<string>();

    for (const batch of childBatches) {
      const batchParticipantIds = await this.loadRoundParticipantIds(batch.execution_round_id);

      batchParticipantIds.forEach((participantId) => {
        participantIdSet.add(participantId);
      });
    }

    if (participantIdSet.size === 0) {
      return [];
    }

    return participants.filter((participant) =>
      participantIdSet.has(participant.execution_participant_id),
    );
  }

  async loadRoundRoleMappings(
    executionId: string,
  ): Promise<RecruitmentExecutionRoundRoleMapping[]> {
    const rounds = await this.loadRounds(executionId);

    if (rounds.length === 0) {
      return [];
    }

    const roundIds = rounds.map((r) => r.execution_round_id);

    const { data, error } = await (supabase as any)
      .from(this.EXECUTION_ROUND_ROLES_TABLE)
      .select(
        `
      *,
      drive_roles (
        drive_role_id,
        drive_role_name
      )
    `,
      )
      .in("execution_round_id", roundIds);

    if (error) throw error;

    return (data ?? []).map((mapping: any) => ({
      execution_round_role_id: mapping.execution_round_role_id,
      execution_round_id: mapping.execution_round_id,
      drive_role_id: mapping.drive_role_id,
      created_at: mapping.created_at,
      drive_role: {
        drive_role_id: mapping.drive_roles?.drive_role_id,
        drive_role_name: mapping.drive_roles?.drive_role_name ?? "",
      },
    }));
  }

  private async loadExecutionBatches(executionId: string): Promise<RecruitmentExecutionBatch[]> {
    const { data, error } = await (supabase as any)
      .from(this.EXECUTION_ROUNDS_TABLE)
      .select("*")
      .eq("execution_id", executionId)
      .not("parent_execution_round_id", "is", null)
      .order("stage_number", { ascending: true })
      .order("round_order", { ascending: true });

    if (error) {
      throw error;
    }

    return (data ?? []).map((batch: any) => ({
      execution_round_id: batch.execution_round_id,
      parent_execution_round_id: batch.parent_execution_round_id,
      stage_number: batch.stage_number,
      round_order: batch.round_order,
      round_name: batch.round_name,
      scope: batch.scope,
      scheduled_date: batch.scheduled_date,
      scheduled_time: batch.scheduled_time,
      venue: batch.venue,
      remarks: batch.remarks,
      participant_count: 0,
    }));
  }

  private async loadExecutionBatchParticipants(
    executionId: string,
  ): Promise<RecruitmentExecutionBatchParticipant[]> {
    const batches = await this.loadExecutionBatches(executionId);

    if (batches.length === 0) {
      return [];
    }

    const roundIds = batches.map((batch) => batch.execution_round_id);

    const { data, error } = await (supabase as any)
      .from(this.EXECUTION_ROUND_PARTICIPANTS_TABLE)
      .select(
        `
      execution_round_id,
      execution_participant_id
    `,
      )
      .in("execution_round_id", roundIds);

    if (error) {
      throw error;
    }
    console.log("loadExecutionBatchParticipants", executionId, batches.length, data);
    return (data ?? []).map((row: any) => ({
      execution_round_id: row.execution_round_id,
      execution_participant_id: row.execution_participant_id,
    }));
  }

  // --------------------------------------------------------------------------
  // History
  // --------------------------------------------------------------------------

  async loadHistorySummary(executionId: string): Promise<RecruitmentExecutionHistorySummary[]> {
    const { data, error } = await (supabase as any)
      .from(this.EXECUTION_HISTORY_TABLE)
      .select(
        `
execution_history_id,
execution_participant_id,
execution_round_id,
drive_role_id,
attendance_status,
gate_status,
progression_status,
remarks,
absence_disposition,
absence_reason,
restriction_override,
restriction_override_reason,
changed_at,
history_revision
      `,
      )
      .eq("execution_id", executionId)
      .order("history_revision", { ascending: false });

    if (error) {
      throw error;
    }

    const latest = new Map<string, RecruitmentExecutionHistorySummary>();

    for (const row of data ?? []) {
      const key = `${row.execution_participant_id}:${row.execution_round_id}`;

      if (latest.has(key)) {
        continue;
      }

      latest.set(key, {
        execution_history_id: row.execution_history_id,

        execution_participant_id: row.execution_participant_id,

        execution_round_id: row.execution_round_id,

        drive_role_id: row.drive_role_id,

        attendance_status: row.attendance_status,

        gate_status: row.gate_status,

        progression_status: row.progression_status,

        remarks: row.remarks,

        absence_disposition: row.absence_disposition,

        absence_reason: row.absence_reason,

        restriction_override: row.restriction_override,

        restriction_override_reason: row.restriction_override_reason,

        changed_at: row.changed_at,
      });
    }

    return [...latest.values()];
  }

  // --------------------------------------------------------------------------
  // Participant Initialization
  // --------------------------------------------------------------------------

  async initializeParticipants(executionId: string): Promise<number> {
    const execution = await this.getExecutionRevision(executionId);

    if (!execution) {
      throw new Error("Execution not found.");
    }

    const series = await this.getExecutionSeries(execution.series_id);

    if (!series) {
      throw new Error("Execution series not found.");
    }

    const { data: applications, error: applicationError } = await (supabase as any)
      .from(this.APPLICATIONS_TABLE)
      .select(
        `
          application_id,
          student_id
        `,
      )
      .eq("opportunity_id", series.opportunity_id);

    if (applicationError) {
      throw applicationError;
    }

    const { data: existingParticipants, error: existingError } = await (supabase as any)
      .from(this.EXECUTION_PARTICIPANTS_TABLE)
      .select("application_id")
      .eq("execution_id", executionId);

    if (existingError) {
      throw existingError;
    }

    const existingApplicationIds = new Set(
      (existingParticipants ?? []).map((participant: any) => participant.application_id),
    );

    const rowsToInsert = (applications ?? [])
      .filter((application: any) => !existingApplicationIds.has(application.application_id))
      .map((application: any) => ({
        execution_id: executionId,
        application_id: application.application_id,
        student_id: application.student_id,
      }));

    if (rowsToInsert.length === 0) {
      return 0;
    }

    const { error: insertError } = await (supabase as any)
      .from(this.EXECUTION_PARTICIPANTS_TABLE)
      .insert(rowsToInsert);

    if (insertError) {
      throw insertError;
    }

    return rowsToInsert.length;
  }

  // --------------------------------------------------------------------------
  // Round Save Helpers
  // --------------------------------------------------------------------------

  private async validateRound(executionRoundId: string): Promise<RecruitmentExecutionRoundRow> {
    const round = await this.getRound(executionRoundId);

    if (!round) {
      throw new Error("Execution round not found.");
    }

    return round;
  }

  private async getNextHistoryRevision(executionId: string): Promise<number> {
    const { data, error } = await (supabase as any)
      .from(this.EXECUTION_HISTORY_TABLE)
      .select("history_revision")
      .eq("execution_id", executionId)
      .order("history_revision", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return (data?.history_revision ?? 0) + 1;
  }

  private async getLatestParticipantState(
    executionId: string,
    executionRoundId: string,
  ): Promise<Map<string, RecruitmentExecutionHistorySummary>> {
    const history = await this.loadHistorySummary(executionId);

    const lookup = new Map<string, RecruitmentExecutionHistorySummary>();

    history
      .filter((item) => item.execution_round_id === executionRoundId)
      .forEach((item) => {
        lookup.set(item.execution_participant_id, item);
      });

    return lookup;
  }

  private buildHistoryEvents(input: {
    executionId: string;
    executionRoundId: string;
    executionRevision: number;
    historyRevision: number;

    driveRoleId?: string | null;

    changedBy?: string | null;

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

      previousHistoryId?: string | null;
    }>;
  }): RecruitmentExecutionHistoryCreateInput[] {
    return input.rows.map((row) => ({
      execution_id: input.executionId,

      execution_round_id: input.executionRoundId,

      drive_role_id: input.driveRoleId ?? null,

      execution_participant_id: row.executionParticipantId,

      execution_revision: input.executionRevision,

      history_revision: input.historyRevision,

      attendance_status: row.attendanceStatus,

      gate_status: row.gateStatus,

      progression_status: row.progressionStatus,

      remarks: row.remarks ?? null,

      absence_disposition: row.absenceDisposition ?? null,

      absence_reason: row.absenceReason ?? null,

      restriction_override: row.restrictionOverride ?? false,

      restriction_override_reason: row.restrictionOverrideReason ?? null,

      previous_history_id: row.previousHistoryId ?? null,

      changed_by: input.changedBy ?? null,
    }));
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
    const round = await this.validateRound(input.executionRoundId);

    const latestState = await this.getLatestParticipantState(
      input.executionId,
      input.executionRoundId,
    );

    const historyRevision = await this.getNextHistoryRevision(input.executionId);

    let driveRoleId: string | null = null;

    if (round.scope === "ROLE_SPECIFIC") {
      const roleIds = await this.getRoundRoleIds(input.executionRoundId);

      if (roleIds.length > 1) {
        throw new Error("A role-specific execution batch cannot be mapped to multiple roles.");
      }

      driveRoleId = roleIds.length === 1 ? roleIds[0] : null;
    }

    const historyEvents = this.buildHistoryEvents({
      executionId: input.executionId,
      executionRoundId: input.executionRoundId,
      executionRevision: input.executionRevision,
      historyRevision,
      driveRoleId,
      changedBy: input.changedBy,
      rows: input.rows.map((row) => {
        const previous = latestState.get(row.executionParticipantId);

        return {
          executionParticipantId: row.executionParticipantId,
          attendanceStatus: row.attendanceStatus,
          gateStatus: row.gateStatus,
          progressionStatus: row.progressionStatus,
          remarks: row.remarks,
          absenceDisposition: row.absenceDisposition,
          absenceReason: row.absenceReason,
          restrictionOverride: row.restrictionOverride,
          restrictionOverrideReason: row.restrictionOverrideReason,
          previousHistoryId: previous?.execution_history_id ?? null,
        };
      }),
    });

    const { data, error } = await (supabase as any).rpc("save_round_transaction", {
      p_execution_id: input.executionId,
      p_execution_round_id: input.executionRoundId,
      p_execution_revision: input.executionRevision,
      p_changed_by: input.changedBy ?? null,
      p_history_rows: historyEvents,
      p_batch_assignments: input.batchAssignments ?? [],
      p_next_round_id: input.nextRoundId ?? null,
    });

    if (error) {
      throw error;
    }

    let progressedParticipants = 0;

    console.log("NEXT ROUND ID:", input.nextRoundId);

    if (input.nextRoundId) {
      console.log("CALLING populateNextRoundParticipants");

      progressedParticipants = await this.populateNextRoundParticipants({
        executionId: input.executionId,
        currentRoundId: input.executionRoundId,
        nextRoundId: input.nextRoundId,
      });
    } else {
      console.log("NO NEXT ROUND ID PASSED TO saveRound()");
    }

    return {
      savedEvents: data.savedEvents ?? 0,
      progressedParticipants,
    };
  }

  // --------------------------------------------------------------------------
  // Progression Engine
  // --------------------------------------------------------------------------

  private async getRoundRoleIds(executionRoundId: string): Promise<string[]> {
    const { data, error } = await (supabase as any)
      .from(this.EXECUTION_ROUND_ROLE_MAPPING_TABLE)
      .select("drive_role_id")
      .eq("execution_round_id", executionRoundId);

    if (error) {
      throw error;
    }

    return (data ?? []).map((row: any) => row.drive_role_id);
  }

  private filterParticipantsForNextRound(input: {
    participants: RecruitmentExecutionParticipantWithStudent[];
    history: RecruitmentExecutionHistorySummary[];
    allowedRoleIds: string[];
    scope: ExecutionScope;
    currentRoundId: string;
  }): RecruitmentExecutionParticipantWithStudent[] {
    const latestCurrentRound = new Map<string, RecruitmentExecutionHistorySummary>();

    input.history
      .filter((history) => history.execution_round_id === input.currentRoundId)
      .forEach((history) => {
        latestCurrentRound.set(history.execution_participant_id, history);
      });

    return input.participants.filter((participant) => {
      const latest = latestCurrentRound.get(participant.execution_participant_id);

      if (latest?.progression_status !== "SHORTLISTED") {
        return false;
      }

      if (input.scope === "COMMON") {
        return true;
      }

      return participant.selected_roles.some((role) =>
        input.allowedRoleIds.includes(role.drive_role_id),
      );
    });
  }

  private async deriveNextRoundParticipants(input: {
    executionId: string;
    currentRoundId: string;
    nextRoundId: string;
  }): Promise<RecruitmentExecutionParticipantWithStudent[]> {
    const [currentRound, nextRound, history, participants, rounds, roundRoleMappings] =
      await Promise.all([
        this.getRound(input.currentRoundId),
        this.getRound(input.nextRoundId),
        this.loadHistorySummary(input.executionId),
        this.loadParticipants(input.executionId),
        this.loadRounds(input.executionId),
        this.loadRoundRoleMappings(input.executionId),
      ]);

    if (!currentRound) {
      throw new Error("Current round not found.");
    }

    if (!nextRound) {
      throw new Error("Next round not found.");
    }

    const allowedRoleIds =
      nextRound.scope === "ROLE_SPECIFIC" ? await this.getRoundRoleIds(input.nextRoundId) : [];

    const allowedRoleSet = new Set(allowedRoleIds);
    const roundById = new Map(rounds.map((round) => [round.execution_round_id, round]));
    const rolesByRound = new Map<string, string[]>();

    roundRoleMappings.forEach((mapping) => {
      const existing = rolesByRound.get(mapping.execution_round_id) ?? [];
      existing.push(mapping.drive_role_id);
      rolesByRound.set(mapping.execution_round_id, existing);
    });

    const eligibleRoundIds = new Set(
      rounds
        .filter((round) => round.stage_number <= currentRound.stage_number)
        .map((round) => round.execution_round_id),
    );

    const historyByParticipant = new Map<string, RecruitmentExecutionHistorySummary[]>();

    history.forEach((row) => {
      if (!eligibleRoundIds.has(row.execution_round_id)) {
        return;
      }

      const rows = historyByParticipant.get(row.execution_participant_id) ?? [];
      rows.push(row);
      historyByParticipant.set(row.execution_participant_id, rows);
    });

    const progressed = participants.filter((participant) => {
      const roleState = new Map<string, { active: boolean; terminal: boolean }>();

      participant.selected_roles.forEach((role) => {
        roleState.set(role.drive_role_id, { active: false, terminal: false });
      });

      const participantHistories = (
        historyByParticipant.get(participant.execution_participant_id) ?? []
      ).sort((a, b) => {
        const roundA = roundById.get(a.execution_round_id);
        const roundB = roundById.get(b.execution_round_id);

        const stageDiff = (roundA?.stage_number ?? 0) - (roundB?.stage_number ?? 0);
        if (stageDiff !== 0) {
          return stageDiff;
        }

        const orderDiff = (roundA?.round_order ?? 0) - (roundB?.round_order ?? 0);
        if (orderDiff !== 0) {
          return orderDiff;
        }

        return (a.changed_at ?? "").localeCompare(b.changed_at ?? "");
      });

      participantHistories.forEach((row) => {
        const round = roundById.get(row.execution_round_id);

        if (!round) {
          return;
        }

        const affectedRoleIds =
          round.scope === "COMMON"
            ? participant.selected_roles.map((role) => role.drive_role_id)
            : row.drive_role_id
              ? [row.drive_role_id]
              : (rolesByRound.get(round.execution_round_id) ?? []);

        affectedRoleIds.forEach((roleId) => {
          const state = roleState.get(roleId);

          if (!state) {
            return;
          }

          if (row.progression_status === "SHORTLISTED") {
            if (!state.terminal) {
              state.active = true;
            }
            return;
          }

          state.active = false;
          state.terminal = true;
        });
      });

      return [...roleState.entries()].some(([roleId, state]) => {
        return state.active && (nextRound.scope === "COMMON" || allowedRoleSet.has(roleId));
      });
    });

    return progressed;
  }

  private async populateNextRoundParticipants(input: {
    executionId: string;
    currentRoundId: string;
    nextRoundId: string;
  }): Promise<number> {
    const participants = await this.deriveNextRoundParticipants({
      executionId: input.executionId,
      currentRoundId: input.currentRoundId,
      nextRoundId: input.nextRoundId,
    });

    console.log("========== NEXT ROUND ==========");
    console.log("Current Round:", input.currentRoundId);
    console.log("Next Round:", input.nextRoundId);
    console.log("Progressed Count:", participants.length);
    console.log(
      participants.map((p) => ({
        id: p.execution_participant_id,
        name: `${p.student.first_name} ${p.student.last_name}`,
        roles: p.selected_roles.map((r) => r.drive_role_name),
      })),
    );

    await this.removeRoundParticipants(input.nextRoundId);

    await this.assignParticipantsToRound({
      executionRoundId: input.nextRoundId,
      executionParticipantIds: participants.map(
        (participant) => participant.execution_participant_id,
      ),
    });

    return participants.length;
  }

  private async getSelectedParticipants(executionId: string) {
    const [history, participants] = await Promise.all([
      this.loadHistorySummary(executionId),
      this.loadParticipants(executionId),
    ]);

    const selectedIds = new Set<string>();

    history.forEach((row) => {
      if (row.progression_status === "SELECTED") {
        selectedIds.add(row.execution_participant_id);
      }
    });

    return participants.filter((participant) =>
      selectedIds.has(participant.execution_participant_id),
    );
  }

  private async validateExecutionCompletion(executionId: string): Promise<void> {
    const [participants, history] = await Promise.all([
      this.loadParticipants(executionId),
      this.loadHistorySummary(executionId),
    ]);

    const latestHistory = new Map<string, RecruitmentExecutionHistorySummary>();

    history.forEach((row) => {
      latestHistory.set(row.execution_participant_id, row);
    });

    const pending = participants.filter((participant) => {
      const latest = latestHistory.get(participant.execution_participant_id);

      if (!latest) {
        // Participant never entered any round.
        // Treat as pending.
        return true;
      }

      if (latest.progression_status === "SHORTLISTED") {
        // Still moving through the recruitment pipeline.
        return true;
      }

      // SELECTED and every other persisted state are treated as
      // terminal for the current pipeline.
      return false;
      // NO_PROGRESS
      // Present / Absent / Allowed Absent
      // means this participant's pipeline has ended for now.

      return false;
    });

    if (pending.length > 0) {
      throw new Error(
        "Recruitment execution cannot be finalized because one or more participant pipelines are still active.",
      );
    }
  }

  private async buildFinalSelectionRows(executionId: string) {
    const participants = await this.getSelectedParticipants(executionId);

    return participants.map((participant) => ({
      execution_id: executionId,
      execution_participant_id: participant.execution_participant_id,
      application_id: participant.application_id,
      student_id: participant.student_id,
    }));
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

    const { data: opportunity, error } = await (supabase as any)
      .from(this.OPPORTUNITY_TABLE)
      .select("*")
      .eq("opportunity_id", series.opportunity_id)
      .single();

    if (error) {
      throw error;
    }

    return {
      execution,
      series,
      opportunity,
    };
  }

  private async validateOpportunityClosed(executionId: string): Promise<void> {
    const context = await this.getExecutionContext(executionId);

    if (context.opportunity.application_status !== "Closed") {
      throw new Error(
        "Recruitment execution cannot be finalized while applications are still accepting submissions.",
      );
    }
  }

  private async buildPlacementHistoryRows(executionId: string) {
    const participants = await this.getSelectedParticipants(executionId);

    if (participants.length === 0) {
      return [];
    }

    const { series, opportunity } = await this.getExecutionContext(executionId);

    return participants.map((participant) => ({
      student_id: participant.student_id,
      opportunity_id: series.opportunity_id,
      drive_id: series.drive_id,
      company_id: series.company_id,
      company_name: opportunity.company_name ?? "",
      package_lpa: 0,
      placement_type: "On Campus Placement",
      placed_at: new Date().toISOString().slice(0, 10),
      is_current: true,
    }));
  }

  private async buildStudentPlacementUpdates(executionId: string) {
    const participants = await this.getSelectedParticipants(executionId);
    if (participants.length === 0) {
      return [];
    }
    return participants.map((participant) => participant.student_id);
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

    const participants = await this.deriveNextRoundParticipants({
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
    await this.validateExecutionCompletion(input.executionId);
    await this.validateOpportunityClosed(input.executionId);
    const finalSelectionRows = await this.buildFinalSelectionRows(input.executionId);
    const placementHistoryRows = await this.buildPlacementHistoryRows(input.executionId);
    const studentIds = await this.buildStudentPlacementUpdates(input.executionId);
    const { data: execution, error } = await (supabase as any).rpc(
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
      execution,
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

    const previousStageRoleSpecificRounds = rounds.filter(
      (round) => round.stage_number === previousStage && round.scope === "ROLE_SPECIFIC",
    );

    if (previousStageRoleSpecificRounds.length === 0) {
      return true;
    }

    const previousStageRoleIds = new Set<string>();

    previousStageRoleSpecificRounds.forEach((round) => {
      mappings
        .filter((mapping) => mapping.execution_round_id === round.execution_round_id)
        .forEach((mapping) => {
          previousStageRoleIds.add(mapping.drive_role_id);
        });
    });

    const nextStageRoleSpecificRounds = rounds.filter(
      (round) => round.stage_number === targetStageNumber && round.scope === "ROLE_SPECIFIC",
    );

    for (const round of nextStageRoleSpecificRounds) {
      const configuredRoleIds = mappings
        .filter((mapping) => mapping.execution_round_id === round.execution_round_id)
        .map((mapping) => mapping.drive_role_id);

      if (
        configuredRoleIds.some(
          (roleId) => previousStageRoleIds.has(roleId) && activeRoleIds.has(roleId),
        )
      ) {
        return false;
      }
    }

    return true;
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
      return batch.round_name !== parent.round_name;
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

executionGraphResolver.setValidationProvider({
  canCreateCommonStage: (executionId, stageNumber) =>
    recruitmentExecutionService.canCreateCommonStage(executionId, stageNumber),
});

executionGraphResolver.setTransitionProvider({
  getRoundTransition: (executionId) => recruitmentExecutionService.getRoundTransition(executionId),
});
