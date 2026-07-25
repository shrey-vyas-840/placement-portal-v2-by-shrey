import { useMemo } from "react";

import type {
  RecruitmentExecutionRoundRow,
  RecruitmentExecutionRoundRoleMapping,
  RecruitmentExecutionRemainingRole,
} from "@/types/recruitmentExecution";

export interface ExecutionTimeline {
  id: string;
  name: string;
  scope: "COMMON" | "ROLE_SPECIFIC";
}

type StageStatus =
  | "NOT_CONFIGURED"
  | "COMPLETED"
  | "IN_PROGRESS"
  | "ACTION_REQUIRED";

interface StageRoleSummary {
  roleId: string;
  roleName: string;
  configured: boolean;
  pendingConfiguration: boolean;
  candidateCount: number;
}

interface StageProgressNode {
  stageNumber: number;
  status: StageStatus;
  rounds: RecruitmentExecutionRoundRow[];
  configuredRoles: StageRoleSummary[];
  warnings: string[];
}

interface ExecutionProgressBarProps {
  rounds: RecruitmentExecutionRoundRow[];
  roundRoleMappings: RecruitmentExecutionRoundRoleMapping[];
  timelines: ExecutionTimeline[];
  remainingActiveRoles: RecruitmentExecutionRemainingRole[];
  selectedStage: number | null;
  onStageSelect(stageNumber: number): void;
}

const statusClasses: Record<StageStatus, string> = {
  COMPLETED:
    "border-green-600 bg-green-600 text-white",

  IN_PROGRESS:
    "border-yellow-500 bg-yellow-500 text-white",

  ACTION_REQUIRED:
    "border-red-600 bg-red-600 text-white",

  NOT_CONFIGURED:
    "border-gray-300 bg-gray-100 text-gray-500",
};

export default function ExecutionProgressBar({
  rounds,
  roundRoleMappings,
  timelines,
  remainingActiveRoles,
  selectedStage,
  onStageSelect,
}: ExecutionProgressBarProps) {
  const stages = useMemo<StageProgressNode[]>(() => {
    const stageMap = new Map<number, StageProgressNode>();

    rounds.forEach((round) => {
      if (!stageMap.has(round.stage_number)) {
        stageMap.set(round.stage_number, {
          stageNumber: round.stage_number,
          status: "COMPLETED",
          rounds: [],
          configuredRoles: [],
          warnings: [],
        });
      }

      stageMap.get(round.stage_number)!.rounds.push(round);
    });

    stageMap.forEach((stage) => {
      const configuredRoleIds = new Set<string>();

      stage.rounds.forEach((round) => {
        if (round.scope === "COMMON") {
          return;
        }

        roundRoleMappings
          .filter(
            (mapping) =>
              mapping.execution_round_id === round.execution_round_id,
          )
          .forEach((mapping) => configuredRoleIds.add(mapping.drive_role_id));
      });

      const configuredRoles: StageRoleSummary[] = [];

      timelines
        .filter((timeline) => timeline.scope === "ROLE_SPECIFIC")
        .forEach((timeline) => {
          const remaining = remainingActiveRoles.find(
            (role) => role.drive_role_id === timeline.id,
          );

          configuredRoles.push({
            roleId: timeline.id,
            roleName: timeline.name,
            configured: configuredRoleIds.has(timeline.id),
            pendingConfiguration:
              configuredRoleIds.has(timeline.id) &&
              !!remaining,
            candidateCount: remaining?.candidate_count ?? 0,
          });
        });

      stage.configuredRoles = configuredRoles;

            const pendingConfiguredRoles = configuredRoles.filter(
        (role) => role.pendingConfiguration,
      );

      if (pendingConfiguredRoles.length === 0) {
        stage.status = "COMPLETED";
      } else {
        stage.status = "IN_PROGRESS";

        pendingConfiguredRoles.forEach((role) => {
          stage.warnings.push(
            `${role.roleName} has configured rounds awaiting execution (${role.candidateCount} candidate${role.candidateCount === 1 ? "" : "s"}).`,
          );
        });
      }

      const unconfiguredRoles = configuredRoles.filter(
        (role) => !role.configured,
      );

      if (
        pendingConfiguredRoles.length > 0 &&
        unconfiguredRoles.length > 0
      ) {
        stage.warnings.push(
          `${unconfiguredRoles.length} role(s) are not configured yet.`,
        );
      }

      if (
        pendingConfiguredRoles.length > 1
      ) {
        stage.status = "ACTION_REQUIRED";
      }
    });

    return [...stageMap.values()].sort(
      (a, b) => a.stageNumber - b.stageNumber,
    );
  }, [
    rounds,
    roundRoleMappings,
    timelines,
    remainingActiveRoles,
  ]);

  return (
    <div className="rounded-xl border bg-background p-5">
      <div className="mb-5">
        <h3 className="text-lg font-semibold">
          Recruitment Progress
        </h3>

        <p className="text-sm text-muted-foreground">
          Navigate directly to any execution stage.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        {stages.map((stage, index) => (
          <div
            key={stage.stageNumber}
            className="flex items-center"
          >
            <button
              type="button"
              onClick={() => onStageSelect(stage.stageNumber)}
              className={`flex h-12 w-12 items-center justify-center rounded-full border-2 font-semibold transition ${
                selectedStage === stage.stageNumber
                  ? "scale-110 shadow-lg"
                  : ""
              } ${statusClasses[stage.status]}`}
            >
              {stage.stageNumber}
            </button>

            {index < stages.length - 1 && (
              <div className="mx-2 h-1 w-16 rounded bg-border" />
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {stages.map((stage) => (
          <div
            key={`summary-${stage.stageNumber}`}
            className={`rounded-lg border p-4 transition ${
              selectedStage === stage.stageNumber
                ? "border-primary"
                : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">
                  Stage {stage.stageNumber}
                </h4>

                <p className="text-xs text-muted-foreground">
                  {stage.rounds.length} round
                  {stage.rounds.length === 1 ? "" : "s"}
                </p>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  statusClasses[stage.status]
                }`}
              >
                {stage.status.replaceAll("_", " ")}
              </span>
            </div>

                        <div className="mt-4 flex flex-wrap gap-2">
              {stage.configuredRoles.map((role) => (
                <div
                  key={`${stage.stageNumber}-${role.roleId}`}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    role.configured
                      ? role.pendingConfiguration
                        ? "border-yellow-500 bg-yellow-50 text-yellow-800"
                        : "border-green-500 bg-green-50 text-green-800"
                      : "border-gray-300 bg-gray-100 text-gray-500"
                  }`}
                >
                  {role.configured ? "✓" : "+"} {role.roleName}

                  {role.candidateCount > 0 && (
                    <span className="ml-1">
                      ({role.candidateCount})
                    </span>
                  )}
                </div>
              ))}
            </div>

            {stage.warnings.length > 0 && (
              <div className="mt-4 rounded-md border border-yellow-300 bg-yellow-50 p-3">
                <p className="mb-2 text-sm font-medium text-yellow-900">
                  Attention Required
                </p>

                <ul className="list-disc space-y-1 pl-5 text-sm text-yellow-800">
                  {stage.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-lg border bg-muted/30 p-4">
        <p className="text-sm font-medium">
          Stage Status Legend
        </p>

        <div className="mt-3 flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-green-600" />
            <span>Completed</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-yellow-500" />
            <span>Execution Pending</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-red-600" />
            <span>Action Required</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-gray-400" />
            <span>Not Configured</span>
          </div>
        </div>
      </div>
    </div>
  );
}