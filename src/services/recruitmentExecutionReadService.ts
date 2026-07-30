import { supabase } from "@/integrations/supabase/client";

import type {
  RecruitmentExecutionRoundRow,
  RecruitmentExecutionRoundRoleMapping,
  RecruitmentExecutionBatch,
} from "@/types/recruitmentExecution";

function requireData<T>(data: T | null, error: unknown, operation: string): T {
  if (error) throw error;

  if (data === null) {
    throw new Error(`${operation} returned no data.`);
  }

  return data;
}

export class RecruitmentExecutionReadService {
  private readonly EXECUTION_ROUNDS_TABLE = "recruitment_execution_rounds";

  private readonly EXECUTION_ROUND_ROLE_MAPPING_TABLE = "recruitment_execution_round_roles";

  private readonly DRIVE_ROLE_TIMELINE_TABLE = "drive_role_timeline";

  // ============================
  // COPY METHODS BELOW
  // ============================

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

  async loadExecutionRounds(executionId: string): Promise<RecruitmentExecutionRoundRow[]> {
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

  async loadPublishedTimeline(driveId: string): Promise<
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

  buildExecutionRounds(
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

  async loadExecutionBatches(executionId: string): Promise<RecruitmentExecutionBatch[]> {
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

  async getRoundRoleIds(executionRoundId: string): Promise<string[]> {
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
