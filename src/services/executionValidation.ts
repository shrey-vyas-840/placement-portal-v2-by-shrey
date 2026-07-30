import type {
  RecruitmentExecutionRoundRoleMapping,
  RecruitmentExecutionRoundRow,
} from "@/types/recruitmentExecution";

export interface ValidateCommonStageInput {
  targetStageNumber: number;
  rounds: RecruitmentExecutionRoundRow[];
  mappings: RecruitmentExecutionRoundRoleMapping[];
  activeRoleIds: Set<string>;
}

export function canCreateCommonStage(
  input: ValidateCommonStageInput,
): boolean {
  const previousStage = input.targetStageNumber - 1;

  const previousStageRoleSpecificRounds = input.rounds.filter(
    (round) =>
      round.stage_number === previousStage &&
      round.scope === "ROLE_SPECIFIC",
  );

  if (previousStageRoleSpecificRounds.length === 0) {
    return true;
  }

  const previousStageRoleIds = new Set<string>();

  previousStageRoleSpecificRounds.forEach((round) => {
    input.mappings
      .filter(
        (mapping) =>
          mapping.execution_round_id === round.execution_round_id,
      )
      .forEach((mapping) => {
        previousStageRoleIds.add(mapping.drive_role_id);
      });
  });

  const nextStageRoleSpecificRounds = input.rounds.filter(
    (round) =>
      round.stage_number === input.targetStageNumber &&
      round.scope === "ROLE_SPECIFIC",
  );

  for (const round of nextStageRoleSpecificRounds) {
    const configuredRoleIds = input.mappings
      .filter(
        (mapping) =>
          mapping.execution_round_id === round.execution_round_id,
      )
      .map((mapping) => mapping.drive_role_id);

    if (
      configuredRoleIds.some(
        (roleId) =>
          previousStageRoleIds.has(roleId) &&
          input.activeRoleIds.has(roleId),
      )
    ) {
      return false;
    }
  }

  return true;
}