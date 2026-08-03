import { supabase } from "@/integrations/supabase/client";

import type {
  RecruitmentExecutionRoundRow,
  RecruitmentExecutionRoundRoleMapping,
  RecruitmentExecutionBatch,
  ExecutionScope,
  ExecutionRoundCreationMode,
} from "@/types/recruitmentExecution";

function requireData<T>(data: T | null, error: unknown, operation: string): T {
  if (error) {
    throw error;
  }

  if (data === null) {
    throw new Error(`${operation} returned no data.`);
  }

  return data;
}

export class RecruitmentExecutionRoundService {
  constructor(
    private readonly provider: {
      getRound(executionRoundId: string): Promise<RecruitmentExecutionRoundRow | null>;

      loadRounds(executionId: string): Promise<RecruitmentExecutionRoundRow[]>;

      loadExecutionRounds(executionId: string): Promise<RecruitmentExecutionRoundRow[]>;

      loadRoundRoleMappings(executionId: string): Promise<RecruitmentExecutionRoundRoleMapping[]>;

      getRoundTransition(executionId: string): Promise<any>;

      getActiveRoleIdsForStage(executionId: string, stageNumber: number): Promise<Set<string>>;

      getRoundRoleIds(executionRoundId: string): Promise<string[]>;

      canCreateCommonStage(executionId: string, targetStageNumber: number): Promise<boolean>;

      getExecutionBatches(executionId: string): Promise<RecruitmentExecutionBatch[]>;

      getExecutionGraphResolver(): any;
    },
  ) {}
  private readonly EXECUTION_ROUNDS_TABLE = "recruitment_execution_rounds";

  private readonly EXECUTION_ROUND_ROLE_MAPPING_TABLE = "recruitment_execution_round_roles";

  private readonly DRIVE_ROLE_TIMELINE_TABLE = "drive_role_timeline";

  // ==========================
  // COPY METHODS BELOW
  // ==========================

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
    sourceStageNumber: number;
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
    const rounds = await this.provider.loadExecutionRounds(input.executionId);

    const creationPlan = await this.provider
      .getExecutionGraphResolver()
      .resolveExecutionBatchCreation({
        executionId: input.executionId,
        sourceStageNumber: input.sourceStageNumber,
        creationMode: input.creationMode,
        scope: input.scope,
        existingRounds: rounds,
      });

    console.log("=== STAGE REUSE PLAN ===", {
      creationPlan,
      roundOrder: input.roundOrder,
      scope: input.scope,
      creationMode: input.creationMode,
      roleIds: input.roleIds,
    });

    const nextRoundOrder = creationPlan.nextRoundOrder!;

    const stageNumber =
      creationPlan.reuseExistingStageRoundId != null
        ? (await this.provider.getRound(creationPlan.reuseExistingStageRoundId))!.stage_number
        : creationPlan.stageNumber!;

    const existingStage =
      creationPlan.reuseExistingStageRoundId != null
        ? await this.provider.getRound(creationPlan.reuseExistingStageRoundId)
        : null;

    if (creationPlan.reuseExistingStageRoundId != null && !existingStage) {
      throw new Error("Planner returned an invalid reusable stage.");
    }

    await this.provider.getExecutionGraphResolver().resolveExecutionBatchValidation({
      executionId: input.executionId,
      stageNumber,
      scope: input.scope,
    });

    /*
     * Stage reuse will be implemented incrementally.
     * For now simply keep a reference to the reusable stage
     * so subsequent steps don't need to reload it.
     */
    const reusableStage =
      creationPlan.reuseExistingStageRoundId != null
        ? await this.provider.getRound(creationPlan.reuseExistingStageRoundId)
        : null;

    const { data, error } = await (supabase as any).rpc("create_execution_batch_transaction", {
      p_execution_id: input.executionId,
      p_creation_mode: input.creationMode,
      p_round_order: nextRoundOrder,
      p_round_name: input.roundName,
      p_scope: input.scope,
      p_stage_number: reusableStage?.stage_number ?? stageNumber,
      p_scheduled_date: input.scheduledDate ?? null,
      p_scheduled_time: input.scheduledTime ?? null,
      p_venue: input.venue ?? null,
      p_remarks: input.remarks ?? null,
      p_created_by: input.createdBy ?? null,
      p_role_ids: input.roleIds,
      p_execution_participant_ids: input.executionParticipantIds,
      p_existing_execution_round_id: creationPlan.reuseExistingStageRoundId,
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
    const parent = await this.provider.getRound(input.parentExecutionRoundId);

    if (!parent) {
      throw new Error("Parent execution stage not found.");
    }

    //
    // Every execution_round row must have a unique round_order.
    //
    const rounds = await this.provider.loadExecutionRounds(input.executionId);

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
    const rounds = await this.provider.loadExecutionRounds(input.executionId);

    const currentHighestStage =
      rounds.length === 0 ? 0 : Math.max(...rounds.map((r) => r.stage_number));

    const creationPlan = await this.provider
      .getExecutionGraphResolver()
      .resolveExecutionBatchCreation({
        executionId: input.executionId,
        creationMode: input.creationMode,
        scope: input.scope,
        existingRounds: rounds,

        /*
         * Current stage from which the admin is progressing.
         * For now we continue using the latest stage.
         * The next step will replace this with the actual
         * selected source stage.
         */
        sourceStageNumber: currentHighestStage,
      });

    const nextRoundOrder = creationPlan.nextRoundOrder!;

    const stageNumber = creationPlan.stageNumber!;

    await this.provider.getExecutionGraphResolver().resolveExecutionBatchValidation({
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

    const round = await this.provider.getRound(executionRoundId);

    if (!round) {
      throw new Error("Execution round not found.");
    }

    const rounds = await this.provider.loadRounds(round.execution_id);

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
}
