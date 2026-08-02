import { supabase } from "@/integrations/supabase/client";

import { recruitmentExecutionRestrictionService } from "./recruitmentExecutionRestrictionService";

import type {
  RecruitmentExecutionParticipantWithStudent,
  RecruitmentExecutionRoundRoleMapping,
  RecruitmentExecutionBatch,
  RecruitmentExecutionBatchParticipant,
  RecruitmentExecutionRoundRow,
  RecruitmentExecutionRow,
  RecruitmentExecutionSeriesRow,
} from "@/types/recruitmentExecution";

export interface RecruitmentExecutionParticipantProvider {
  getExecutionRevision(executionId: string): Promise<RecruitmentExecutionRow | null>;

  getExecutionSeries(seriesId: string): Promise<RecruitmentExecutionSeriesRow | null>;

  getRound(executionRoundId: string): Promise<RecruitmentExecutionRoundRow | null>;

  loadRounds(executionId: string): Promise<RecruitmentExecutionRoundRow[]>;

  loadExecutionBatches(executionId: string): Promise<RecruitmentExecutionBatch[]>;

  loadRoundParticipantIds(executionRoundId: string): Promise<string[]>;
}

export class RecruitmentExecutionParticipantService {
  constructor(private readonly provider: RecruitmentExecutionParticipantProvider) {}

  private readonly EXECUTION_PARTICIPANTS_TABLE = "recruitment_execution_participants";

  private readonly EXECUTION_ROUND_ROLES_TABLE = "recruitment_execution_round_roles";

  private readonly EXECUTION_ROUND_PARTICIPANTS_TABLE = "recruitment_execution_round_participants";

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

    const execution = await this.provider.getExecutionRevision(executionId);

    if (!execution) {
      throw new Error("Execution not found.");
    }

    const series = await this.provider.getExecutionSeries(execution.series_id);

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
    const round = await this.provider.getRound(executionRoundId);

    console.log("LOAD ROUND PARTICIPANTS", {
      requestedExecutionRoundId: executionRoundId,
      roundName: round?.round_name,
      parentExecutionRoundId: round?.parent_execution_round_id,
    });

    if (!round) {
      throw new Error("Execution round not found.");
    }

    const participants = await this.loadParticipants(round.execution_id);

const participantIds = await this.provider.loadRoundParticipantIds(
  executionRoundId,
);

console.log("STAGE MEMBERSHIP", {
  executionRoundId,
  participantCount: participantIds.length,
  participantIds,
});

if (participantIds.length === 0) {
  return [];
}

    const participantIdSet = new Set(participantIds);

    return participants.filter((participant) =>
      participantIdSet.has(participant.execution_participant_id),
    );
  }
  async loadRoundRoleMappings(
    executionId: string,
  ): Promise<RecruitmentExecutionRoundRoleMapping[]> {
    const rounds = await this.provider.loadRounds(executionId);

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

  async loadExecutionBatchParticipants(
    executionId: string,
  ): Promise<RecruitmentExecutionBatchParticipant[]> {
    const batches = await this.provider.loadExecutionBatches(executionId);

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
}
