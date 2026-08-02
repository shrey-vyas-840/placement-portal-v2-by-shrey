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
  roundRoleIds = await this.provider.getRoundRoleIds(
    input.executionRoundId,
  );

  /*
   * A role-specific execution stage may represent
   * one or more drive roles.
   *
   * History keeps the full role mapping in the
   * runtime snapshot.
   *
   * driveRoleId is therefore populated only when
   * exactly one role exists for backward compatibility.
   */
  driveRoleId =
    roundRoleIds.length === 1
      ? roundRoleIds[0]
      : null;
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
    });

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

await recruitmentExecutionSnapshotService.persistSnapshot(
  input.executionId,
  updatedSnapshot,
);

const persistedSnapshot =
  await recruitmentExecutionSnapshotService.loadSnapshot(
    input.executionId,
  );

const expectedParticipantIds = Object.keys(updatedSnapshot.participants);

const missingParticipants = expectedParticipantIds.filter(
  (participantId) => !(participantId in persistedSnapshot.participants),
);

console.log("SNAPSHOT VERIFY", {
  executionId: input.executionId,
  expectedParticipants: expectedParticipantIds.length,
  persistedParticipants: Object.keys(
    persistedSnapshot.participants,
  ).length,
  missingParticipants,
});

if (missingParticipants.length > 0) {
  throw new Error(
    [
      "Runtime snapshot verification failed.",
      `Missing participants: ${missingParticipants.length}`,
      missingParticipants.join(", "),
    ].join("\n"),
  );
}

return {
  savedEvents: data.savedEvents ?? 0,
  progressedParticipants: 0,
};
  }
}
