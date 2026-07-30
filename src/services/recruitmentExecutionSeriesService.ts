import { supabase } from "@/integrations/supabase/client";

import type {
  RecruitmentExecutionRow,
  RecruitmentExecutionSeriesRow,
  RecruitmentExecutionSeriesSnapshot,
  RecruitmentExecutionSnapshot,
} from "@/types/recruitmentExecution";

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

export class RecruitmentExecutionSeriesService {
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
}

export type ExecutionSeriesService = RecruitmentExecutionSeriesService;

export const recruitmentExecutionSeriesService = new RecruitmentExecutionSeriesService();
