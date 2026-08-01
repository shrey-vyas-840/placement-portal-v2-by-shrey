import { supabase } from "@/integrations/supabase/client";

import type {
  RecruitmentExecutionRoundRow,
  ExecutionAttendanceStatus,
  ExecutionGateStatus,
  ExecutionProgressionStatus,
} from "@/types/recruitmentExecution";

import { recruitmentExecutionHistoryService } from "./recruitmentExecutionHistoryService";
import { RecruitmentExecutionProgressionService } from "./recruitmentExecutionProgressionService";
import { recruitmentExecutionSnapshotService } from "./recruitmentExecutionSnapshotService";
export interface RecruitmentExecutionRoundSaveProvider {
  getRound(executionRoundId: string): Promise<RecruitmentExecutionRoundRow | null>;

  getRoundRoleIds(executionRoundId: string): Promise<string[]>;
}

export class RecruitmentExecutionRoundSaveService {
  constructor(
    private readonly provider: RecruitmentExecutionRoundSaveProvider,
    private readonly progressionService: RecruitmentExecutionProgressionService,
  ) {}

  // --------------------------------------------------------------------------
  // Round Save Helpers
  // --------------------------------------------------------------------------

  async validateRound(executionRoundId: string): Promise<RecruitmentExecutionRoundRow> {
    const round = await this.provider.getRound(executionRoundId);

    if (!round) {
      throw new Error("Execution round not found.");
    }

    return round;
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
    const round = await this.validateRound(input.executionRoundId);

    const latestState = await recruitmentExecutionHistoryService.getLatestParticipantState(
      input.executionId,
      input.executionRoundId,
    );

    const historyRevision = await recruitmentExecutionHistoryService.getNextHistoryRevision(
      input.executionId,
    );

    let driveRoleId: string | null = null;
    let roundRoleIds: string[] = [];

    if (round.scope === "ROLE_SPECIFIC") {
      roundRoleIds = await this.provider.getRoundRoleIds(input.executionRoundId);

      if (roundRoleIds.length > 1) {
        throw new Error("A role-specific execution batch cannot be mapped to multiple roles.");
      }

      driveRoleId = roundRoleIds.length === 1 ? roundRoleIds[0] : null;
    }

    const historyEvents = recruitmentExecutionHistoryService.buildHistoryEvents({
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
    console.log("SAVE ROUND RPC COMPLETED");
    if (error) {
      throw error;
    }

    const currentSnapshot = await recruitmentExecutionSnapshotService.loadSnapshot(
      input.executionId,
    );

    const updatedSnapshot = recruitmentExecutionSnapshotService.applyRoundSave({
      snapshot: currentSnapshot,
      executionId: input.executionId,
      roundId: input.executionRoundId,

      roundScope: round.scope,
      roundRoleIds,

      historyRows: historyEvents,
      participantRoles: input.participantRoles,
    });

    await recruitmentExecutionSnapshotService.persistSnapshot(input.executionId, updatedSnapshot);

    let progressedParticipants = 0;

    console.log("NEXT ROUND ID:", input.nextRoundId);

    if (input.nextRoundId) {
      console.log("CALLING populateNextRoundParticipants");

      console.log("========== PROGRESSION ==========");
      console.log("CURRENT ROUND", {
        executionRoundId: input.executionRoundId,
      });

      if (input.nextRoundId) {
        const nextRound = await this.provider.getRound(input.nextRoundId);

        console.log("NEXT ROUND", {
          executionRoundId: nextRound?.execution_round_id,
          roundName: nextRound?.round_name,
          parentExecutionRoundId: nextRound?.parent_execution_round_id,
        });
      } else {
        console.log("NEXT ROUND = undefined");
      }
      console.log("SAVE ROUND -> CALLING populateNextRoundParticipants");
      progressedParticipants = await this.progressionService.populateNextRoundParticipants({
        executionId: input.executionId,
        currentRoundId: input.executionRoundId,
        nextRoundId: input.nextRoundId,
      });
      console.log("SAVE ROUND -> populateNextRoundParticipants FINISHED");
    } else {
      console.log("NO NEXT ROUND ID PASSED TO saveRound()");
    }

    return {
      savedEvents: data.savedEvents ?? 0,
      progressedParticipants,
    };
  }
}
