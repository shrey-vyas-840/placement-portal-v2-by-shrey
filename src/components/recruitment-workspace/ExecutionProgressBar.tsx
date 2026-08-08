import { useMemo, useRef, useEffect } from "react";
import { CheckCircle2, Clock3, AlertTriangle, Circle } from "lucide-react";

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

type StageStatus = "NOT_CONFIGURED" | "COMPLETED" | "IN_PROGRESS" | "ACTION_REQUIRED";

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
  configuredRoleCount: number;
  warnings: string[];
}

interface ExecutionProgressBarProps {
  rounds: RecruitmentExecutionRoundRow[];
  roundRoleMappings: RecruitmentExecutionRoundRoleMapping[];
  timelines: ExecutionTimeline[];
  remainingActiveRoles: RecruitmentExecutionRemainingRole[];

  stageCompletionSummary: Record<
    number,
    {
      completed: boolean;
      totalParticipants: number;
      markedAttendance: number;
      pendingAttendance: number;
    }
  >;

  selectedStage: number | null;

  onStageSelect(stageNumber: number): void;
}

const statusClasses: Record<StageStatus, string> = {
  COMPLETED: "border-green-600 bg-green-600 text-white",

  IN_PROGRESS: "border-yellow-500 bg-yellow-500 text-white",

  ACTION_REQUIRED: "border-red-600 bg-red-600 text-white",

  NOT_CONFIGURED: "border-gray-300 bg-gray-100 text-gray-500",
};

const statusIcon = {
  COMPLETED: CheckCircle2,
  IN_PROGRESS: Clock3,
  ACTION_REQUIRED: AlertTriangle,
  NOT_CONFIGURED: Circle,
};

const connectorClasses = {
  COMPLETED: "bg-green-600",
  IN_PROGRESS:
    "bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 bg-[length:200%_100%] animate-pulse",
  ACTION_REQUIRED: "bg-red-600",
  NOT_CONFIGURED: "bg-slate-300",
};

function getEffectiveStageNumber(
  round: RecruitmentExecutionRoundRow,
  rounds: RecruitmentExecutionRoundRow[],
): number {
  const roundById = new Map(rounds.map((item) => [item.execution_round_id, item]));

  let current = round;
  const visited = new Set<string>();

  while (current.parent_execution_round_id) {
    if (visited.has(current.execution_round_id)) {
      break;
    }

    visited.add(current.execution_round_id);

    const parent = roundById.get(current.parent_execution_round_id);

    if (!parent) {
      break;
    }

    current = parent;
  }

  return current.stage_number;
}

export default function ExecutionProgressBar({
  rounds,
  roundRoleMappings,
  timelines,
  remainingActiveRoles,
  stageCompletionSummary,

  selectedStage,
  onStageSelect,
}: ExecutionProgressBarProps) {
  const stages = useMemo<StageProgressNode[]>(() => {
    const stageMap = new Map<number, StageProgressNode>();

    rounds.forEach((round) => {
      const effectiveStageNumber = getEffectiveStageNumber(round, rounds);

      if (!stageMap.has(effectiveStageNumber)) {
        stageMap.set(effectiveStageNumber, {
          stageNumber: effectiveStageNumber,
          status: "COMPLETED",
          rounds: [],
          configuredRoles: [],
          configuredRoleCount: 0,
          warnings: [],
        });
      }

      stageMap.get(effectiveStageNumber)!.rounds.push(round);
    });

    stageMap.forEach((stage) => {
      const configuredRoleIds = new Set<string>();

      const hasCommonRound = stage.rounds.some((round) => round.scope === "COMMON");

      if (hasCommonRound) {
        timelines
          .filter((timeline) => timeline.scope === "ROLE_SPECIFIC")
          .forEach((timeline) => configuredRoleIds.add(timeline.id));
      } else {
        stage.rounds.forEach((round) => {
          roundRoleMappings
            .filter((mapping) => mapping.execution_round_id === round.execution_round_id)
            .forEach((mapping) => configuredRoleIds.add(mapping.drive_role_id));
        });
      }
      const configuredRoles: StageRoleSummary[] = [];

      timelines
        .filter((timeline) => timeline.scope === "ROLE_SPECIFIC")
        .forEach((timeline) => {
          const remaining = remainingActiveRoles.find((role) => role.drive_role_id === timeline.id);

          configuredRoles.push({
            roleId: timeline.id,
            roleName: timeline.name,
            configured: configuredRoleIds.has(timeline.id),
            pendingConfiguration: configuredRoleIds.has(timeline.id) && !!remaining,
            candidateCount: remaining?.candidate_count ?? 0,
          });
        });

      stage.configuredRoles = configuredRoles;
      stage.configuredRoleCount = configuredRoleIds.size;

      const completion = stageCompletionSummary[stage.stageNumber];

      if (completion) {
        if (completion.pendingAttendance > 0) {
          stage.warnings.push(
            `${completion.pendingAttendance} student${
              completion.pendingAttendance === 1 ? "" : "s"
            } are pending attendance.`,
          );
        } else {
          stage.warnings.push("All students have been marked.");
        }

        if (!completion.completed) {
          stage.status = completion.markedAttendance > 0 ? "IN_PROGRESS" : "NOT_CONFIGURED";
        } else {
          stage.status = "COMPLETED";
        }
      } else {
        stage.status = "NOT_CONFIGURED";
      }
    });

    return [...stageMap.values()].sort((a, b) => a.stageNumber - b.stageNumber);
  }, [rounds, roundRoleMappings, timelines, remainingActiveRoles, stageCompletionSummary]);

  const selectedStageNode = useMemo(
    () => stages.find((stage) => stage.stageNumber === selectedStage) ?? null,
    [stages, selectedStage],
  );

  const stageRefs = useRef<Record<number, HTMLButtonElement | null>>({});

  useEffect(() => {
    if (selectedStage == null) return;

    stageRefs.current[selectedStage]?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [selectedStage]);

  return (
    <div className="relative overflow-visible rounded-xl border bg-background p-6">
      <div className="mb-8">
        <h3 className="text-lg font-semibold">Execution Timeline</h3>

        <p className="text-sm text-muted-foreground">
          Select an execution round to review or manage its progress.
        </p>
      </div>

      <div className="relative overflow-visible pt-6">
        <div className="flex min-w-max items-start justify-center px-10 pb-20">
          {stages.map((stage, index) => {
            const Icon = statusIcon[stage.status];

            return (
              <div
                key={stage.stageNumber}
                className="group relative flex items-center overflow-visible"
              >
                <div className="flex w-[110px] flex-col items-center text-center">
                  <button
                    ref={(el) => {
                      stageRefs.current[stage.stageNumber] = el;
                    }}
                    type="button"
                    onClick={() => onStageSelect(stage.stageNumber)}
                    className={`
relative z-10 flex h-14 w-14
items-center justify-center
rounded-full border-2
transition-all duration-300 ease-out
hover:-translate-y-1
hover:shadow-xl
hover:scale-105
                ${
                  selectedStage === stage.stageNumber
                    ? "scale-105 ring-4 ring-blue-300 shadow-xl"
                    : ""
                }
                ${statusClasses[stage.status]}
              `}
                  >
                    <Icon className="h-5 w-5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onStageSelect(stage.stageNumber)}
                    className="mt-4 text-sm font-bold text-slate-800 transition-colors hover:text-blue-700"
                  >
                    Round {stage.stageNumber}
                  </button>

                  <p className="mt-1 text-center text-[10px] uppercase tracking-[0.15em] text-slate-400">
                    {stage.rounds.length} Execution Round
                    {stage.rounds.length === 1 ? "" : "s"}
                  </p>
                </div>

                {index < stages.length - 1 && (
                  <div className="mb-12 flex w-24 items-center">
                    <div className="relative h-[2px] w-full rounded-full bg-slate-200">
                      <div
                        className={`absolute inset-0 rounded-full ${connectorClasses[stage.status]}`}
                      />
                    </div>
                  </div>
                )}

                <div
                  className="
              absolute bottom-[120px] left-1/2 z-[999]
              opacity-0 invisible -translate-y-1 w-72 -translate-x-1/2 rounded-3xl
              border border-slate-200 bg-white p-5 shadow-xl ring-1 ring-slate-200
              transition-all
duration-150
group-hover:visible
group-hover:opacity-100
group-hover:translate-y-0
hover:visible
hover:opacity-100
hover:translate-y-0
            "
                >
                  <div className="absolute left-1/2 top-full h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b border-r border-slate-200 bg-white" />

                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-bold text-slate-900">
                      Execution Round {stage.stageNumber}
                    </h4>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${statusClasses[stage.status]}`}
                    >
                      {stage.status.replaceAll("_", " ")}
                    </span>
                  </div>

                  <div className="mt-4 space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Execution Batch</span>

                      <span className="font-medium">
                        {stage.rounds[0]?.scope === "COMMON"
                          ? "Common"
                          : `${stage.rounds.length} Batch${stage.rounds.length === 1 ? "" : "es"}`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Configured Roles</span>

                      <span className="font-medium">
                        {stage.configuredRoleCount}
                        {" / "}
                        {stage.configuredRoles.length}
                      </span>
                    </div>

                    {stage.warnings.length > 0 && (
                      <>
                        <div className="my-2 border-t" />

                        <p className="text-xs font-semibold uppercase uppercase tracking-[0.15em] text-amber-700">
                          Attention
                        </p>

                        <p className="mt-1 text-xs text-slate-600 line-clamp-3">
                          {stage.warnings[0]}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-2">
        {selectedStageNode && (
          <div className="rounded-lg border p-5">
            {selectedStageNode.status === "COMPLETED" ? (
              <div className="mt-4 rounded-md border border-green-200 bg-green-50 px-4 py-3">
                <p className="text-sm font-medium text-green-800">
                  ✓ This stage has been completed successfully.
                </p>
              </div>
            ) : (
              <>
                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedStageNode.configuredRoles.map((role) => (
                    <div
                      key={role.roleId}
                      className={`rounded-full border px-3 py-1 text-xs ${
                        role.configured
                          ? role.pendingConfiguration
                            ? "border-yellow-500 bg-yellow-50 text-yellow-720"
                            : "border-green-500 bg-green-50 text-green-800"
                          : "border-gray-300 bg-gray-100 text-gray-500"
                      }`}
                    >
                      {role.configured ? "✓" : "+"} {role.roleName}
                      {role.candidateCount > 0 && (
                        <span className="ml-1">({role.candidateCount})</span>
                      )}
                    </div>
                  ))}
                </div>

                {selectedStageNode.warnings.length > 0 && (
                  <div className="mt-4 rounded-md border border-yellow-300 bg-yellow-50 p-3">
                    <p className="mb-2 text-sm font-medium text-yellow-900">Attention Required</p>

                    <ul className="list-disc space-y-1 pl-5 text-sm text-yellow-720">
                      {selectedStageNode.warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
