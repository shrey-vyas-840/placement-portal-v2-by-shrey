import type { ExecutionRoundCreationMode, ExecutionScope } from "@/types/recruitmentExecution";
import { ExecutionBatchPlanner } from "./executionBatchPlanner";
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
import type { ValidateCommonStageInput } from "./executionValidation";
import type {
  RecruitmentExecutionRoundRow,
  RecruitmentExecutionRoundRoleMapping,
} from "@/types/recruitmentExecution";
import { ExecutionBatchValidator } from "./executionBatchValidator";

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

export interface ExecutionStageDataProvider {
  loadRounds(executionId: string): Promise<RecruitmentExecutionRoundRow[]>;

  loadRoundRoleMappings(executionId: string): Promise<RecruitmentExecutionRoundRoleMapping[]>;

  getActiveRoleIdsForStage(executionId: string, stageNumber: number): Promise<Set<string>>;
}

export interface ExecutionCommonStageValidator {
  canCreateCommonStage(input: ValidateCommonStageInput): boolean;
}

export interface StagePlanningProvider {
  resolveStagePlanning(
    creationMode: ExecutionRoundCreationMode,
    existingRounds: RecruitmentExecutionRoundRow[],
  ): StagePlanningResult;
}
export interface ExecutionBatchValidationProvider {
  resolveValidationPlanning(
    input: ValidateExecutionBatchPlanInput,
  ): ExecutionBatchValidationPlanningResult;

  validateCommonStageCreation(executionId: string, stageNumber: number): Promise<void>;
}

export function createExecutionBatchValidationProvider(
  stageDataProvider: ExecutionStageDataProvider,
  commonStageValidator: ExecutionCommonStageValidator,
): ExecutionBatchValidationProvider {
  return new DefaultExecutionBatchValidationProvider(stageDataProvider, commonStageValidator);
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

  resolveExecutionBatchValidation(
    input: ResolveExecutionBatchValidationInput,
  ): Promise<ExecutionBatchValidationResult>;
}

export class ExecutionGraphResolver implements ExecutionGraphResolverContract {
  constructor(
    private readonly executionBatchPlanner: ExecutionBatchPlanner,
    private readonly executionBatchValidator: ExecutionBatchValidator,
  ) {}

  async resolveExecutionBatchCreation(
    input: ResolveExecutionBatchCreationInput,
  ): Promise<ExecutionBatchCreationPlan> {
    if (!this.executionBatchPlanner) {
      throw new Error("ExecutionBatchPlanner has not been registered.");
    }

    return this.executionBatchPlanner.buildCreationPlan(input);
  }

  async resolveExecutionBatchValidation(
    input: ResolveExecutionBatchValidationInput,
  ): Promise<ExecutionBatchValidationResult> {
    if (!this.executionBatchValidator) {
      throw new Error("ExecutionBatchValidator has not been registered.");
    }

    return this.executionBatchValidator.validate(input);
  }
}

export class DefaultStagePlanningProvider implements StagePlanningProvider {
  resolveStagePlanning(
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
}

class DefaultExecutionBatchValidationProvider implements ExecutionBatchValidationProvider {
  constructor(
    private readonly stageDataProvider: ExecutionStageDataProvider,
    private readonly commonStageValidator: ExecutionCommonStageValidator,
  ) {}

  resolveValidationPlanning(
    input: ValidateExecutionBatchPlanInput,
  ): ExecutionBatchValidationPlanningResult {
    return {
      requiresSynchronization: input.requiresSynchronization,
      shouldValidateCommonStage: input.scope === "COMMON" && input.requiresSynchronization,
    };
  }

  async validateCommonStageCreation(executionId: string, stageNumber: number): Promise<void> {
    const rounds = await this.stageDataProvider.loadRounds(executionId);

    const mappings = await this.stageDataProvider.loadRoundRoleMappings(executionId);

    const activeRoleIds = await this.stageDataProvider.getActiveRoleIdsForStage(
      executionId,
      stageNumber - 1,
    );

    const allowed = this.commonStageValidator.canCreateCommonStage({
      targetStageNumber: stageNumber,
      rounds,
      mappings,
      activeRoleIds,
    });

    if (!allowed) {
      throw new Error(
        "A Common stage cannot be created because one or more roles have already configured this stage.",
      );
    }
  }
}

export class DefaultRoundTransitionProvider implements RoundTransitionProvider {
  constructor(
    private readonly transitionResolver: (executionId: string) => Promise<RoundTransition>,
  ) {}

  getRoundTransition(executionId: string): Promise<RoundTransition> {
    return this.transitionResolver(executionId);
  }
}
