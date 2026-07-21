import { supabase } from "@/integrations/supabase/client";

import type {
  RecruitmentExecutionAttendanceReviewRow,
  RecruitmentExecutionAttendanceReviewDraft,
  RecruitmentExecutionAttendanceReviewSummary,
} from "@/types/recruitmentExecution";

const TABLE = "recruitment_execution_attendance_review";

class RecruitmentExecutionAttendanceReviewService {
  async loadDraft(
    executionRoundId: string,
  ): Promise<Map<string, RecruitmentExecutionAttendanceReviewDraft>> {
    const { data, error } = await (supabase as any)
      .from(TABLE)
      .select("*")
      .eq("execution_round_id", executionRoundId)
      .eq("is_draft", true);

    if (error) {
      throw error;
    }

    const map = new Map<
      string,
      RecruitmentExecutionAttendanceReviewDraft
    >();

    (data ?? []).forEach(
      (row: RecruitmentExecutionAttendanceReviewRow) => {
        map.set(row.execution_participant_id, {
          execution_participant_id: row.execution_participant_id,

          absence_disposition: row.absence_disposition,

          absence_reason: row.absence_reason ?? "",

          restriction_override: row.restriction_override,

          override_reason: row.override_reason ?? "",
        });
      },
    );

    return map;
  }

  async autosaveDraft(
    executionId: string,
    executionRoundId: string,
    rows: RecruitmentExecutionAttendanceReviewDraft[],
  ): Promise<void> {
    if (rows.length === 0) {
      return;
    }

const payload = rows.map((row) => ({
  execution_id: executionId,

  execution_round_id: executionRoundId,

  execution_participant_id: row.execution_participant_id,

  absence_disposition: row.absence_disposition,

  absence_reason:
    row.absence_disposition === "ALLOWED"
      ? row.absence_reason || null
      : null,

  restriction_override: row.restriction_override,

  override_reason:
    row.restriction_override
      ? row.override_reason || null
      : null,

  is_draft: true,
}));

    const { error } = await (supabase as any)
      .from(TABLE)
      .upsert(payload, {
        onConflict:
          "execution_round_id,execution_participant_id",
      });

    if (error) {
      throw error;
    }
  }

  async clearDraft(
    executionRoundId: string,
  ): Promise<void> {
    const { error } = await (supabase as any)
      .from(TABLE)
      .delete()
      .eq("execution_round_id", executionRoundId);

    if (error) {
      throw error;
    }
  }

  buildSummary(
    drafts: RecruitmentExecutionAttendanceReviewDraft[],
  ): RecruitmentExecutionAttendanceReviewSummary {
    return {
      totalAbsent: drafts.filter(
        (d) => d.absence_disposition !== null,
      ).length,

      totalAllowedAbsence: drafts.filter(
        (d) => d.absence_disposition === "ALLOWED",
      ).length,

      totalUnallowedAbsence: drafts.filter(
        (d) => d.absence_disposition === "UNALLOWED",
      ).length,

      totalRestricted: drafts.filter(
        (d) => !d.restriction_override,
      ).length,

      totalOverrides: drafts.filter(
        (d) => d.restriction_override,
      ).length,
    };
  }
}

export const recruitmentExecutionAttendanceReviewService =
  new RecruitmentExecutionAttendanceReviewService();