import type {
  ExecutionBatchCreationPlan,
  ResolveExecutionBatchCreationInput,
} from "./executionGraphResolver";

import type { RecruitmentExecutionRoundRow } from "@/types/recruitmentExecution";

import type { StagePlanningProvider } from "./executionGraphResolver";

export class ExecutionBatchPlanner {
  constructor(private readonly stagePlanningProvider: StagePlanningProvider) {}

  buildCreationPlan(input: ResolveExecutionBatchCreationInput): ExecutionBatchCreationPlan {
    const planning = this.stagePlanningProvider.resolveStagePlanning(
      input.creationMode,
      input.existingRounds,
    );

    /*
     * Candidate stage immediately after the source stage.
     */
    const targetStageNumber = input.sourceStageNumber + 1;

    /*
     * Reuse only parent stages.
     * Child execution batches are ignored.
     */
    const reusableStage = input.existingRounds
      .filter((round) => round.parent_execution_round_id == null)
      .find((round) => round.stage_number === targetStageNumber);

    return {
      nextRoundOrder: planning.nextRoundOrder,

      stageNumber: reusableStage?.stage_number ?? planning.stageNumber,

      reuseExistingStageRoundId: reusableStage?.execution_round_id ?? null,

      requiresSynchronization: undefined,
    };
  }
}
