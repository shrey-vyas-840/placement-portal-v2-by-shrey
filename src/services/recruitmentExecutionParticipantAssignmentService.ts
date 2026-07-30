import { supabase } from "@/integrations/supabase/client";
import type {
  RecruitmentExecutionBatch,
  RecruitmentExecutionRoundRow,
} from "@/types/recruitmentExecution";

function requireData<T>(data: T | null, error: unknown, operation: string): T {
  if (error) throw error;

  if (data === null) {
    throw new Error(`${operation} returned no data.`);
  }

  return data;
}

export interface RecruitmentExecutionParticipantAssignmentProvider {
  getRound(
    executionRoundId: string,
  ): Promise<RecruitmentExecutionRoundRow | null>;

  loadExecutionBatches(
    executionId: string,
  ): Promise<RecruitmentExecutionBatch[]>;
}

export class RecruitmentExecutionParticipantAssignmentService {
  private readonly EXECUTION_ROUND_PARTICIPANTS_TABLE =
    "recruitment_execution_round_participants";

  constructor(
    private readonly provider: RecruitmentExecutionParticipantAssignmentProvider,
  ) {}

  // ============================
  // COPY METHODS BELOW
  // ============================
   async loadRoundParticipantIds(executionRoundId: string): Promise<string[]> {
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

   async assignParticipantsToRound(input: {
    executionRoundId: string;
    executionParticipantIds: string[];
  }): Promise<void> {
    if (input.executionParticipantIds.length === 0) {
      return;
    }

    const round = await this.provider.getRound(input.executionRoundId);

    if (!round) {
      throw new Error("Execution round not found.");
    }

    //
    // A participant may belong to only ONE execution batch
    // within the same stage.
    //
    const parentRoundId = round.parent_execution_round_id ?? round.execution_round_id;

    const siblingRounds = (await this.provider.loadExecutionBatches(round.execution_id)).filter((candidate: RecruitmentExecutionBatch) =>
        candidate.parent_execution_round_id === parentRoundId &&
        candidate.execution_round_id !== input.executionRoundId,
    );

    if (siblingRounds.length > 0 && input.executionParticipantIds.length > 0) {
      const siblingRoundIds = siblingRounds.map((candidate: RecruitmentExecutionBatch) => candidate.execution_round_id);

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

  
  async removeRoundParticipants(executionRoundId: string): Promise<void> {
    const { error } = await (supabase as any)
      .from(this.EXECUTION_ROUND_PARTICIPANTS_TABLE)
      .delete()
      .eq("execution_round_id", executionRoundId);

    if (error) {
      throw error;
    }
  }

}