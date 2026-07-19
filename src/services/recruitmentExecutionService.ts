import { supabase } from "@/integrations/supabase/client";

import type {
  RecruitmentExecutionSeriesRow,
  RecruitmentExecutionRow,
  RecruitmentExecutionSeriesSnapshot,
  RecruitmentExecutionSnapshot,
  RecruitmentExecutionRoundRow,
  RecruitmentExecutionParticipantWithStudent,
  ExecutionScope,
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

function requireData<T>(
  data: T | null,
  error: unknown,
  operation: string
): T {
  if (error) {
    throw error;
  }

  if (data === null) {
    throw new Error(`${operation} returned no data.`);
  }

  return data;
}

class RecruitmentExecutionService {
  /**
   * --------------------------------------------------------------------------
   * Execution Series
   * --------------------------------------------------------------------------
   */

  async getExecutionSeries(
    opportunityId: string
  ): Promise<RecruitmentExecutionSeriesRow | null> {
    const { data, error } = await (supabase as any)
      .from(EXECUTION_SERIES_TABLE)
      .select("*")
      .eq("opportunity_id", opportunityId)
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
      "createExecutionSeries"
    );
  }

  /**
   * --------------------------------------------------------------------------
   * Execution Revisions
   * --------------------------------------------------------------------------
   */

  async getLatestExecution(
    seriesId: string
  ): Promise<RecruitmentExecutionRow | null> {
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
        reopened_from_execution_id:
          input.reopenedFromExecutionId ?? null,
        started_by: input.startedBy ?? null,
        reopen_reason: input.reopenReason ?? null,
      })
      .select()
      .single();

    return requireData(
      data as RecruitmentExecutionRow | null,
      error,
      "createExecutionRevision"
    );
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

    return requireData(
      data as RecruitmentExecutionRow | null,
      error,
      "finalizeExecution"
    );
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

  async getExecutionRevision(
    executionId: string
  ): Promise<RecruitmentExecutionRow | null> {
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

  async listExecutionRevisions(
    seriesId: string
  ): Promise<RecruitmentExecutionRow[]> {
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

  private readonly EXECUTION_ROUNDS_TABLE =
    "recruitment_execution_rounds";

    private readonly EXECUTION_PARTICIPANTS_TABLE =
  "recruitment_execution_participants";

  async loadRounds(
    executionId: string
  ): Promise<RecruitmentExecutionRoundRow[]> {
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
    roundOrder: number;
    roundName: string;
    scope: ExecutionScope;
    scheduledDate?: string | null;
    scheduledTime?: string | null;
    venue?: string | null;
    remarks?: string | null;
    createdBy?: string | null;
  }): Promise<RecruitmentExecutionRoundRow> {
    const { data, error } = await (supabase as any)
      .from(this.EXECUTION_ROUNDS_TABLE)
      .insert({
        execution_id: input.executionId,
        round_order: input.roundOrder,
        round_name: input.roundName,
        scope: input.scope,
        scheduled_date: input.scheduledDate ?? null,
        scheduled_time: input.scheduledTime ?? null,
        venue: input.venue ?? null,
        remarks: input.remarks ?? null,
        created_by: input.createdBy ?? null,
      })
      .select()
      .single();

    return requireData(
      data as RecruitmentExecutionRoundRow | null,
      error,
      "createRound"
    );
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

    return requireData(
      data as RecruitmentExecutionRoundRow | null,
      error,
      "updateRound"
    );
  }

  async getRound(
    executionRoundId: string
  ): Promise<RecruitmentExecutionRoundRow | null> {
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

  // --------------------------------------------------------------------------
  // Participants
  // --------------------------------------------------------------------------

  async loadParticipants(
    executionId: string
  ): Promise<RecruitmentExecutionParticipantWithStudent[]> {
    const { data, error } = await (supabase as any)
      .from(this.EXECUTION_PARTICIPANTS_TABLE)
      .select(`
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
      `)
      .eq("execution_id", executionId);

    if (error) {
      throw error;
    }

    return (data ?? []).map((participant: any) => ({
      execution_participant_id: participant.execution_participant_id,
      execution_id: participant.execution_id,
      application_id: participant.application_id,
      student_id: participant.student_id,
      created_at: participant.created_at,
      updated_at: participant.updated_at,

      application_status:
        participant.student_opportunity_applications
          ?.application_status ?? "Applied",

      student:
        participant.student_opportunity_applications
          ?.student_master,

      selected_roles:
        (
          participant.student_opportunity_applications
            ?.student_application_selected_roles ?? []
        ).map((role: any) => ({
          selected_role_id: role.selected_role_id,
          drive_role_id: role.drive_role_id,
          preference_order: role.preference_order,
          drive_role_name:
            role.drive_roles?.drive_role_name ?? "",
        })),
    }));
  }

  
}

export const recruitmentExecutionService =
  new RecruitmentExecutionService();

  