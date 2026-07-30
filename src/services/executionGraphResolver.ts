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

  stageNumber?: number;

  requiresSynchronization?: boolean;
}

interface StagePlanningResult {
  nextRoundOrder: number;
  highestStage: number;
  stageNumber: number;
}

interface ExecutionBatchPlanningResult {
  stagePlanning: StagePlanningResult;
}

interface ExecutionBatchCreationPlanningResult {
  nextRoundOrder: number;

  stageNumber: number;
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

interface ExecutionBatchValidationPlanningResult {
  requiresSynchronization: boolean;

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

export interface StagePlanningProvider {
  resolveStagePlanning(
    creationMode: ExecutionRoundCreationMode,
    existingRounds: RecruitmentExecutionRoundRow[],
  ): StagePlanningResult;
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

  private stagePlanningProvider?: StagePlanningProvider;

  setStagePlanningProvider(provider: StagePlanningProvider) {
    this.stagePlanningProvider = provider;
  }

  setTransitionProvider(provider: RoundTransitionProvider) {
    this.transitionProvider = provider;
  }

  setValidationProvider(provider: ExecutionValidationProvider) {
    this.validationProvider = provider;
  }

  private resolveStagePlanning(
    creationMode: ExecutionRoundCreationMode,
    existingRounds: RecruitmentExecutionRoundRow[],
  ): StagePlanningResult {
    const nextRoundOrder =
      existingRounds.length === 0 ? 1 : Math.max(...existingRounds.map((r) => r.round_order)) + 1;

    const highestStage =
      existingRounds.length === 0 ? 0 : Math.max(...existingRounds.map((r) => r.stage_number));

    const stageNumber =
      existingRounds.length === 0
        ? 1
        : creationMode === "NEXT_STAGE"
          ? highestStage + 1
          : highestStage;

    return {
      nextRoundOrder,
      highestStage,
      stageNumber,
    };
  }

  private resolveExecutionBatchPlanning(
    creationMode: ExecutionRoundCreationMode,
    existingRounds: RecruitmentExecutionRoundRow[],
  ): ExecutionBatchPlanningResult {
    if (!this.stagePlanningProvider) {
      throw new Error("StagePlanningProvider has not been registered.");
    }

    return {
      stagePlanning: this.stagePlanningProvider.resolveStagePlanning(creationMode, existingRounds),
    };
  }

  private resolveExecutionBatchCreationPlanning(
    planning: ExecutionBatchPlanningResult,
  ): ExecutionBatchCreationPlanningResult {
    return {
      nextRoundOrder: planning.stagePlanning.nextRoundOrder,

      stageNumber: planning.stagePlanning.stageNumber,
    };
  }

  private buildExecutionBatchCreationPlan(
    planning: ExecutionBatchCreationPlanningResult,
  ): ExecutionBatchCreationPlan {
    return {
      nextRoundOrder: planning.nextRoundOrder,

      stageNumber: planning.stageNumber,

      requiresSynchronization: undefined,
    };
  }

  private buildExecutionBatchCreation(
    creationMode: ExecutionRoundCreationMode,
    existingRounds: RecruitmentExecutionRoundRow[],
  ): ExecutionBatchCreationPlan {
    const planning = this.resolveExecutionBatchPlanning(creationMode, existingRounds);

    const creationPlanning = this.resolveExecutionBatchCreationPlanning(planning);

    return this.buildExecutionBatchCreationPlan(creationPlanning);
  }

  async resolveExecutionBatchCreation(
    input: ResolveExecutionBatchCreationInput,
  ): Promise<ExecutionBatchCreationPlan> {
    return this.buildExecutionBatchCreation(input.creationMode, input.existingRounds);
  }

  private buildExecutionBatchValidationResult(
    planning: ExecutionBatchValidationPlanningResult,
  ): ExecutionBatchValidationResult {
    return {
      requiresSynchronization: planning.requiresSynchronization,

      shouldValidateCommonStage: planning.shouldValidateCommonStage,
    };
  }

  private resolveExecutionBatchValidationPlanning(
    input: ValidateExecutionBatchPlanInput,
  ): ExecutionBatchValidationPlanningResult {
    return {
      requiresSynchronization: input.requiresSynchronization,

      shouldValidateCommonStage: input.scope === "COMMON" && input.requiresSynchronization,
    };
  }

  private async validateCommonStageCreation(
    executionId: string,
    stageNumber: number,
  ): Promise<void> {
    if (!this.validationProvider) {
      throw new Error("ExecutionValidationProvider has not been registered.");
    }

    const allowed = await this.validationProvider.canCreateCommonStage(executionId, stageNumber);

    if (!allowed) {
      throw new Error(
        "A Common stage cannot be created because one or more roles have already configured this stage.",
      );
    }
  }

  async validateExecutionBatchPlan(
    input: ValidateExecutionBatchPlanInput,
  ): Promise<ExecutionBatchValidationResult> {
    if (input.scope === "COMMON" && input.requiresSynchronization) {
      await this.validateCommonStageCreation(input.executionId, input.stageNumber);
    }

    const planning = this.resolveExecutionBatchValidationPlanning(input);

    return this.buildExecutionBatchValidationResult(planning);
  }

  private async resolveRoundTransition(executionId: string): Promise<RoundTransition> {
    if (!this.transitionProvider) {
      throw new Error("RoundTransitionProvider has not been registered.");
    }

    return this.transitionProvider.getRoundTransition(executionId);
  }

  private async buildExecutionBatchValidation(
    input: ResolveExecutionBatchValidationInput,
  ): Promise<ExecutionBatchValidationResult> {
    const transition = await this.resolveRoundTransition(input.executionId);

    return this.validateExecutionBatchPlan({
      executionId: input.executionId,
      stageNumber: input.stageNumber,
      scope: input.scope,
      requiresSynchronization: transition.requiresSynchronization,
    });
  }

  async resolveExecutionBatchValidation(
    input: ResolveExecutionBatchValidationInput,
  ): Promise<ExecutionBatchValidationResult> {
    return this.buildExecutionBatchValidation(input);
  }
}

export const executionGraphResolver = new ExecutionGraphResolver();
