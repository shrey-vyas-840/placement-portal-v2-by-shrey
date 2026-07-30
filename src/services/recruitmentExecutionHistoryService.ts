import { supabase } from "@/integrations/supabase/client";
import type {
  RecruitmentExecutionHistorySummary,
  RecruitmentExecutionHistoryCreateInput,
  ExecutionAttendanceStatus,
  ExecutionGateStatus,
  ExecutionProgressionStatus,
} from "@/types/recruitmentExecution";

export class RecruitmentExecutionHistoryService {
  constructor(private readonly historyTable: string) {}

  async loadHistorySummary(executionId: string): Promise<RecruitmentExecutionHistorySummary[]> {
    const { data, error } = await (supabase as any)
      .from(this.historyTable)
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

  async getNextHistoryRevision(executionId: string): Promise<number> {
    const { data, error } = await (supabase as any)
      .from(this.historyTable)
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

  buildHistoryEvents(input: {
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

  async getLatestParticipantState(
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

  
}

export const recruitmentExecutionHistoryService = new RecruitmentExecutionHistoryService(
  "recruitment_execution_history",
);
