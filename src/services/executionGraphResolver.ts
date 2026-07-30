import type { ExecutionRoundCreationMode, ExecutionScope } from "@/types/recruitmentExecution";

/**
 * ============================================================================
 * Execution Graph Resolver
 * ============================================================================
 *
 * Phase 1
 * --------
 * This file intentionally contains NO orchestration logic.
 *
 * Its purpose is only to establish the dependency boundary between
 * RecruitmentExecutionService and future execution graph orchestration.
 *
 * Do NOT add:
 *
 * - stage arithmetic
 * - round ordering
 * - participant progression
 * - graph persistence  
 * - database access
 *
 * Those will be introduced incrementally in later phases.
 */

import type { RecruitmentExecutionRoundRow } from "@/types/recruitmentExecution";

export interface ResolveExecutionBatchCreationInput {
  executionId: string;
  creationMode: ExecutionRoundCreationMode;
  scope: ExecutionScope;

  existingRounds: RecruitmentExecutionRoundRow[];
}

export interface ExecutionBatchCreationPlan {
  nextRoundOrder?: number;

  /**
   * Current highest persisted stage.
   *
   * The resolver only discovers it.
   * The service still decides whether to increment it.
   */
  highestStage?: number;

  stageNumber?: number;

  requiresSynchronization?: boolean;
}

export interface ValidateExecutionBatchPlanInput {
  executionId: string;

  stageNumber: number;

  scope: ExecutionScope;

  requiresSynchronization: boolean;
}

export interface ResolveExecutionBatchValidationInput {
  executionId: string;

  stageNumber: number;

  scope: ExecutionScope;
}

export interface ExecutionBatchValidationResult {
  requiresSynchronization?: boolean;

  shouldValidateCommonStage: boolean;
}

export interface RoundTransition {
  requiresSynchronization: boolean;
}

export interface RoundTransitionProvider {
  getRoundTransition(executionId: string): Promise<RoundTransition>;
}

export interface ExecutionValidationProvider {
  canCreateCommonStage(executionId: string, stageNumber: number): Promise<boolean>;
}

/**
 * Placeholder for future orchestration metadata.
 *
 * Phase 1 intentionally contains no planning logic.
 */

export interface ExecutionGraphResolverContract {
  resolveExecutionBatchCreation(
    input: ResolveExecutionBatchCreationInput,
  ): Promise<ExecutionBatchCreationPlan>;

  validateExecutionBatchPlan(
    input: ValidateExecutionBatchPlanInput,
  ): Promise<ExecutionBatchValidationResult>;

  resolveExecutionBatchValidation(
    input: ResolveExecutionBatchValidationInput,
  ): Promise<ExecutionBatchValidationResult>;
}

class ExecutionGraphResolver implements ExecutionGraphResolverContract {
  private transitionProvider?: RoundTransitionProvider;

  private validationProvider?: ExecutionValidationProvider;

  setTransitionProvider(provider: RoundTransitionProvider) {
    this.transitionProvider = provider;
  }

  setValidationProvider(provider: ExecutionValidationProvider) {
    this.validationProvider = provider;
  }

  async resolveExecutionBatchCreation(
    input: ResolveExecutionBatchCreationInput,
  ): Promise<ExecutionBatchCreationPlan> {
    const nextRoundOrder =
      input.existingRounds.length === 0
        ? 1
        : Math.max(...input.existingRounds.map((r) => r.round_order)) + 1;

    const highestStage =
      input.existingRounds.length === 0
        ? 0
        : Math.max(...input.existingRounds.map((r) => r.stage_number));

    const stageNumber =
      input.existingRounds.length === 0
        ? 1
        : input.creationMode === "NEXT_STAGE"
          ? highestStage + 1
          : highestStage;

    return {
      nextRoundOrder,
      highestStage,
      stageNumber,
      requiresSynchronization: undefined,
    };
  }

  async validateExecutionBatchPlan(
    input: ValidateExecutionBatchPlanInput,
  ): Promise<ExecutionBatchValidationResult> {
    if (input.scope === "COMMON" && input.requiresSynchronization) {
      if (!this.validationProvider) {
        throw new Error("ExecutionValidationProvider has not been registered.");
      }

      const allowed = await this.validationProvider.canCreateCommonStage(
        input.executionId,
        input.stageNumber,
      );

      if (!allowed) {
        throw new Error(
          "A Common stage cannot be created because one or more roles have already configured this stage.",
        );
      }
    }

    return {
      requiresSynchronization: input.requiresSynchronization,

      shouldValidateCommonStage: input.scope === "COMMON" && input.requiresSynchronization,
    };
  }

  async resolveExecutionBatchValidation(
    input: ResolveExecutionBatchValidationInput,
  ): Promise<ExecutionBatchValidationResult> {
    if (!this.transitionProvider) {
      throw new Error("RoundTransitionProvider has not been registered.");
    }

    const transition = await this.transitionProvider.getRoundTransition(input.executionId);

    return this.validateExecutionBatchPlan({
      executionId: input.executionId,
      stageNumber: input.stageNumber,
      scope: input.scope,
      requiresSynchronization: transition.requiresSynchronization,
    });
  }
}

export const executionGraphResolver = new ExecutionGraphResolver();
