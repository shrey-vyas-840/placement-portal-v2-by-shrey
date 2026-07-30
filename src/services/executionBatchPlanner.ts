import type {
  ExecutionBatchCreationPlan,
  ResolveExecutionBatchCreationInput,
} from "./executionGraphResolver";

import type {
  RecruitmentExecutionRoundRow,
} from "@/types/recruitmentExecution";

import type {
  StagePlanningProvider,
} from "./executionGraphResolver";

export class ExecutionBatchPlanner {
  constructor(
    private readonly stagePlanningProvider: StagePlanningProvider,
  ) {}

  buildCreationPlan(
    input: ResolveExecutionBatchCreationInput,
  ): ExecutionBatchCreationPlan {
    const planning =
      this.stagePlanningProvider.resolveStagePlanning(
        input.creationMode,
        input.existingRounds,
      );

    return {
      nextRoundOrder: planning.nextRoundOrder,
      stageNumber: planning.stageNumber,
      requiresSynchronization: undefined,
    };
  }
}