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
          .filter((mapping) => mapping.execution_round_id === round.execution_round_id)
          .forEach((mapping) => configuredRoleIds.add(mapping.drive_role_id));
      });

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

      const pendingConfiguredRoles = configuredRoles.filter((role) => role.pendingConfiguration);

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

      const unconfiguredRoles = configuredRoles.filter((role) => !role.configured);

      if (pendingConfiguredRoles.length > 0 && unconfiguredRoles.length > 0) {
        stage.warnings.push(`${unconfiguredRoles.length} role(s) are not configured yet.`);
      }

      if (pendingConfiguredRoles.length > 1) {
        stage.status = "ACTION_REQUIRED";
      }
    });

    return [...stageMap.values()].sort((a, b) => a.stageNumber - b.stageNumber);
  }, [rounds, roundRoleMappings, timelines, remainingActiveRoles]);

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
    <div className="rounded-xl border bg-background p-5">
      <div className="mb-5">
        <h3 className="text-lg font-semibold">Recruitment Progress</h3>

        <p className="text-sm text-muted-foreground">Navigate directly to any execution stage.</p>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-max items-start px-2">
          {stages.map((stage, index) => {
            const Icon = statusIcon[stage.status];

            return (
              <div key={stage.stageNumber} className="group relative flex items-start">
                <div className="flex flex-col items-center">
                  <button
                    ref={(el) => {
                      stageRefs.current[stage.stageNumber] = el;
                    }}
                    type="button"
                    onClick={() => onStageSelect(stage.stageNumber)}
                    className={`
                relative flex h-14 w-14 items-center justify-center
                rounded-full border-2 transition-all duration-300
                hover:-translate-y-1 hover:shadow-xl
                ${
                  selectedStage === stage.stageNumber
                    ? "scale-110 ring-4 ring-blue-200 shadow-2xl"
                    : ""
                }
                ${statusClasses[stage.status]}
              `}
                  >
                    <Icon className="h-6 w-6" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onStageSelect(stage.stageNumber)}
                    className="mt-3 text-sm font-semibold text-slate-700 hover:text-blue-700"
                  >
                    Round {stage.stageNumber}
                  </button>

                  <p className="mt-1 text-xs text-slate-500">
                    {stage.rounds.length} Round
                    {stage.rounds.length === 1 ? "" : "s"}
                  </p>
                </div>

                {index < stages.length - 1 && (
                  <div className="mx-5 mt-7 h-1 w-24 overflow-hidden rounded-full bg-slate-200">
                    <div className={`h-full w-full ${connectorClasses[stage.status]}`} />
                  </div>
                )}

                <div
                  className="
              pointer-events-none absolute left-1/2 top-20 z-50
              hidden w-72 -translate-x-1/2 rounded-2xl
              border border-slate-200 bg-white p-4 shadow-2xl
              group-hover:block
            "
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Round {stage.stageNumber}</h4>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${statusClasses[stage.status]}`}
                    >
                      {stage.status.replaceAll("_", " ")}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Execution Rounds</span>

                      <span className="font-medium">{stage.rounds.length}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500">Configured Roles</span>

                      <span className="font-medium">
                        {stage.configuredRoles.filter((r) => r.configured).length}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500">Pending Candidates</span>

                      <span className="font-medium">
                        {stage.configuredRoles.reduce((sum, role) => sum + role.candidateCount, 0)}
                      </span>
                    </div>

                    {stage.warnings.length > 0 && (
                      <>
                        <div className="my-2 border-t" />

                        <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
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

      <div className="mt-6">
        {selectedStageNode && (
          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold">Stage {selectedStageNode.stageNumber}</h4>

                <p className="text-xs text-muted-foreground">
                  {selectedStageNode.rounds.length} round
                  {selectedStageNode.rounds.length === 1 ? "" : "s"}
                </p>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  statusClasses[selectedStageNode.status]
                }`}
              >
                {selectedStageNode.status.replaceAll("_", " ")}
              </span>
            </div>

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
                            ? "border-yellow-500 bg-yellow-50 text-yellow-800"
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

                    <ul className="list-disc space-y-1 pl-5 text-sm text-yellow-800">
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

      <div className="mt-6 rounded-lg border bg-muted/30 p-4">
        <p className="text-sm font-medium">Stage Status Legend</p>

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
