import type {
  ExecutionBatchValidationResult,
  ResolveExecutionBatchValidationInput,
  RoundTransitionProvider,
  ExecutionBatchValidationProvider,
} from "./executionGraphResolver";

export class ExecutionBatchValidator {
  constructor(
    private readonly transitionProvider: RoundTransitionProvider,
    private readonly validationProvider: ExecutionBatchValidationProvider,
  ) {}

  async validate(
    input: ResolveExecutionBatchValidationInput,
  ): Promise<ExecutionBatchValidationResult> {
    const transition =
      await this.transitionProvider.getRoundTransition(
        input.executionId,
      );

    if (
      input.scope === "COMMON" &&
      transition.requiresSynchronization
    ) {
      await this.validationProvider.validateCommonStageCreation(
        input.executionId,
        input.stageNumber,
      );
    }

    const planning =
      this.validationProvider.resolveValidationPlanning({
        executionId: input.executionId,
        stageNumber: input.stageNumber,
        scope: input.scope,
        requiresSynchronization:
          transition.requiresSynchronization,
      });

    return {
      requiresSynchronization:
        planning.requiresSynchronization,
      shouldValidateCommonStage:
        planning.shouldValidateCommonStage,
    };
  }
}