import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  CircleDot,
  Folder,
  FolderOpen,
  GitBranch,
  LayoutList,
  ListTree,
  Layers3,
  SquareStack,
} from "lucide-react";
import type {
  RecruitmentExecutionWorkspace,
  RecruitmentExecutionRoundRow,
  RecruitmentExecutionBatch,
  ExecutionScope,
} from "@/types/recruitmentExecution";

type NavigatorSelectionScope = "COMMON" | string;

interface ExecutionNavigatorProps {
  workspace: RecruitmentExecutionWorkspace | null;
  selectedStage: number | null;
  selectedTimeline: NavigatorSelectionScope;
  selectedRoundId: string;
  selectedExecutionBatchId: string | null;
  onStageSelect: (stageNumber: number) => void;
  onTimelineSelect: (timelineId: NavigatorSelectionScope) => void;
  onRoundSelect: (roundId: string) => void;
  onBatchSelect: (batchRoundId: string) => void;
  className?: string;
}

interface ExecutionNavigatorBatchNode {
  id: string;
  round: RecruitmentExecutionBatch;
}

interface ExecutionNavigatorRoundNode {
  id: string;
  round: RecruitmentExecutionRoundRow;
  batches: ExecutionNavigatorBatchNode[];
}

interface ExecutionNavigatorPipelineNode {
  key: string;
  label: string;
  scope: ExecutionScope;
  roleId: string | null;
  rounds: ExecutionNavigatorRoundNode[];
}

interface ExecutionNavigatorStageNode {
  stageNumber: number;
  label: string;
  pipelines: ExecutionNavigatorPipelineNode[];
}

function getPipelineKey(scope: ExecutionScope, roleId: string | null) {
  return `${scope}:${roleId ?? "COMMON"}`;
}

function getRoleLabel(roleId: string | null, workspace: RecruitmentExecutionWorkspace) {
  if (!roleId) {
    return "Common";
  }

  const roleName = workspace.participants
    .flatMap((participant) => participant.selected_roles)
    .find((role) => role.drive_role_id === roleId)?.drive_role_name;

  return roleName ?? "Role";
}

function sortRounds(rounds: RecruitmentExecutionRoundRow[]) {
  return [...rounds].sort((a, b) => {
    if (a.round_order !== b.round_order) {
      return a.round_order - b.round_order;
    }

    return a.round_name.localeCompare(b.round_name);
  });
}

function sortBatches(batches: ExecutionNavigatorBatchNode[]): ExecutionNavigatorBatchNode[] {
  return [...batches].sort((a, b) => {
    if (a.round.round_order !== b.round.round_order) {
      return a.round.round_order - b.round.round_order;
    }

    return a.round.round_name.localeCompare(b.round.round_name);
  });
}

function buildNavigatorModel(
  workspace: RecruitmentExecutionWorkspace,
): ExecutionNavigatorStageNode[] {
  const stageNumbers = [...new Set(workspace.rounds.map((round) => round.stage_number))].sort(
    (a, b) => a - b,
  );

  return stageNumbers.map((stageNumber) => {
    const stageRounds = workspace.rounds
      .filter(
        (round) => round.stage_number === stageNumber && round.parent_execution_round_id == null,
      )
      .sort((a, b) => a.round_order - b.round_order);

    const pipelineMap = new Map<string, ExecutionNavigatorPipelineNode>();

    const ensurePipeline = (
      scope: ExecutionScope,
      roleId: string | null,
      label: string,
    ): ExecutionNavigatorPipelineNode => {
      const key = getPipelineKey(scope, roleId);

      const existing = pipelineMap.get(key);
      if (existing) {
        return existing;
      }

      const next: ExecutionNavigatorPipelineNode = {
        key,
        label,
        scope,
        roleId,
        rounds: [],
      };

      pipelineMap.set(key, next);
      return next;
    };

    stageRounds.forEach((round) => {
      const roundNode: ExecutionNavigatorRoundNode = {
        id: round.execution_round_id,
        round,
        batches: sortBatches(
          workspace.executionBatches
            .filter((batch) => batch.parent_execution_round_id === round.execution_round_id)
            .map((batch) => ({
              id: batch.execution_round_id,
              round: batch,
            })),
        ),
      };

      if (round.scope === "COMMON") {
        ensurePipeline("COMMON", null, "Common").rounds.push(roundNode);
        return;
      }

      const mappedRoleIds = workspace.roundRoleMappings
        .filter((mapping) => mapping.execution_round_id === round.execution_round_id)
        .map((mapping) => mapping.drive_role_id);

      const uniqueRoleIds = [...new Set(mappedRoleIds)];

      if (uniqueRoleIds.length === 0) {
        ensurePipeline("ROLE_SPECIFIC", null, "Unmapped").rounds.push(roundNode);
        return;
      }

      uniqueRoleIds.forEach((roleId) => {
        ensurePipeline("ROLE_SPECIFIC", roleId, getRoleLabel(roleId, workspace)).rounds.push(
          roundNode,
        );
      });
    });

    const pipelines = [...pipelineMap.values()].sort((a, b) => {
      if (a.scope !== b.scope) {
        return a.scope === "COMMON" ? -1 : 1;
      }

      return a.label.localeCompare(b.label);
    });

    return {
      stageNumber,
      label: `Stage ${stageNumber}`,
      pipelines,
    };
  });
}

 function ExecutionNavigator({
  workspace,
  selectedStage,
  selectedTimeline,
  selectedRoundId,
  selectedExecutionBatchId,
  onStageSelect,
  onTimelineSelect,
  onRoundSelect,
  onBatchSelect,
  className,
}: ExecutionNavigatorProps) {
  const [expandedStages, setExpandedStages] = useState<Set<number>>(new Set());
  const [expandedPipelines, setExpandedPipelines] = useState<Set<string>>(new Set());
  const [expandedRounds, setExpandedRounds] = useState<Set<string>>(new Set());
  const [expandedBatches, setExpandedBatches] = useState<Set<string>>(new Set());

  const navigatorStages = useMemo(() => {
    if (!workspace) {
      return [];
    }

    return buildNavigatorModel(workspace);
  }, [workspace]);

  useEffect(() => {
    if (!workspace || selectedStage == null) {
      return;
    }

    setExpandedStages((previous) => {
      const next = new Set(previous);
      next.add(selectedStage);
      return next;
    });
  }, [workspace, selectedStage]);

  useEffect(() => {
    if (!workspace || !selectedTimeline) {
      return;
    }

    if (selectedTimeline === "COMMON") {
      setExpandedPipelines((previous) => {
        const next = new Set(previous);
        next.add(getPipelineKey("COMMON", null));
        return next;
      });
      return;
    }

    setExpandedPipelines((previous) => {
      const next = new Set(previous);
      next.add(getPipelineKey("ROLE_SPECIFIC", selectedTimeline));
      return next;
    });
  }, [workspace, selectedTimeline]);

  useEffect(() => {
    if (!selectedRoundId) {
      return;
    }

    setExpandedRounds((previous) => {
      const next = new Set(previous);
      next.add(selectedRoundId);
      return next;
    });
  }, [selectedRoundId]);

  useEffect(() => {
    if (!selectedExecutionBatchId) {
      return;
    }

    setExpandedBatches((previous) => {
      const next = new Set(previous);
      next.add(selectedExecutionBatchId);
      return next;
    });
  }, [selectedExecutionBatchId]);

  const toggleStage = (stageNumber: number) => {
    setExpandedStages((previous) => {
      const next = new Set(previous);
      if (next.has(stageNumber)) {
        next.delete(stageNumber);
      } else {
        next.add(stageNumber);
      }
      return next;
    });
  };

  const togglePipeline = (pipelineKey: string) => {
    setExpandedPipelines((previous) => {
      const next = new Set(previous);
      if (next.has(pipelineKey)) {
        next.delete(pipelineKey);
      } else {
        next.add(pipelineKey);
      }
      return next;
    });
  };

  const toggleRound = (roundId: string) => {
    setExpandedRounds((previous) => {
      const next = new Set(previous);
      if (next.has(roundId)) {
        next.delete(roundId);
      } else {
        next.add(roundId);
      }
      return next;
    });
  };

  const toggleBatch = (batchId: string) => {
    setExpandedBatches((previous) => {
      const next = new Set(previous);
      if (next.has(batchId)) {
        next.delete(batchId);
      } else {
        next.add(batchId);
      }
      return next;
    });
  };

  if (!workspace) {
    return null;
  }

  const hasContent = navigatorStages.length > 0;

  return (
    <aside
      className={[
        "h-full min-h-0 rounded-3xl border border-slate-200 bg-white shadow-sm",
        "flex flex-col overflow-hidden",
        className ?? "",
      ].join(" ")}
    >
      <div className="border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-900 text-white">
            <Layers3 className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Execution Navigator
            </div>
            <div className="text-sm font-semibold text-slate-900">Stages · Pipelines · Batches</div>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-2 py-3">
        {!hasContent ? (
          <div className="px-3 py-6 text-sm text-slate-500">No execution stages available.</div>
        ) : (
          <div className="space-y-2">
            {navigatorStages.map((stage) => {
              const stageExpanded =
                expandedStages.has(stage.stageNumber) || selectedStage === stage.stageNumber;

              return (
                <div
                  key={stage.stageNumber}
                  className="rounded-2xl border border-slate-200 bg-slate-50/60"
                >
                  <button
                    type="button"
                    onClick={() => {
                      toggleStage(stage.stageNumber);
                      onStageSelect(stage.stageNumber);
                    }}
                    className={[
                      "flex w-full items-center gap-2 px-3 py-2 text-left transition",
                      stageExpanded ? "bg-slate-900 text-white" : "hover:bg-slate-100",
                    ].join(" ")}
                  >
                    {stageExpanded ? (
                      <ChevronDown className="h-4 w-4 shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0" />
                    )}
                    <span className="text-sm font-semibold">{stage.label}</span>
                    <span
                      className={[
                        "ml-auto rounded-full px-2 py-0.5 text-[11px] font-semibold",
                        stageExpanded ? "bg-white/15 text-white" : "bg-slate-200 text-slate-700",
                      ].join(" ")}
                    >
                      {stage.pipelines.length}
                    </span>
                  </button>

                  {stageExpanded && (
                    <div className="space-y-2 border-t border-slate-200 px-2 py-2">
                      {stage.pipelines.map((pipeline) => {
                        const pipelineExpanded =
                          expandedPipelines.has(pipeline.key) ||
                          (selectedTimeline !== "COMMON" && pipeline.roleId === selectedTimeline) ||
                          (selectedTimeline === "COMMON" && pipeline.scope === "COMMON");

                        return (
                          <div
                            key={pipeline.key}
                            className="rounded-xl border border-slate-200 bg-white"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                togglePipeline(pipeline.key);
                                onTimelineSelect(
                                  pipeline.scope === "COMMON"
                                    ? "COMMON"
                                    : (pipeline.roleId ?? "COMMON"),
                                );
                              }}
                              className={[
                                "flex w-full items-center gap-2 px-3 py-2 text-left transition",
                                pipelineExpanded ? "bg-blue-50" : "hover:bg-slate-50",
                              ].join(" ")}
                            >
                              {pipelineExpanded ? (
                                <ChevronDown className="h-4 w-4 shrink-0 text-slate-600" />
                              ) : (
                                <ChevronRight className="h-4 w-4 shrink-0 text-slate-600" />
                              )}

                              <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                                {pipeline.scope === "COMMON" ? (
                                  <LayoutList className="h-3.5 w-3.5" />
                                ) : (
                                  <GitBranch className="h-3.5 w-3.5" />
                                )}
                              </span>

                              <div className="min-w-0">
                                <div className="truncate text-sm font-semibold text-slate-900">
                                  {pipeline.label}
                                </div>
                                <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
                                  {pipeline.scope === "COMMON"
                                    ? "Common pipeline"
                                    : "Role pipeline"}
                                </div>
                              </div>

                              <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                                {pipeline.rounds.length}
                              </span>
                            </button>

                            {pipelineExpanded && (
                              <div className="space-y-1 border-t border-slate-200 p-2">
                                {pipeline.rounds.map((round) => {
                                  const roundExpanded =
                                    expandedRounds.has(round.id) || selectedRoundId === round.id;

                                  const hasBatches = round.batches.length > 0;

                                  return (
                                    <div
                                      key={round.id}
                                      className="rounded-lg border border-slate-100 bg-slate-50/80"
                                    >
                                      <button
                                        type="button"
                                        onClick={() => {
                                          toggleRound(round.id);
                                          onRoundSelect(round.id);
                                        }}
                                        className={[
                                          "flex w-full items-center gap-2 px-3 py-2 text-left transition",
                                          selectedRoundId === round.id
                                            ? "bg-emerald-50"
                                            : "hover:bg-slate-100",
                                        ].join(" ")}
                                      >
                                        {hasBatches ? (
                                          roundExpanded ? (
                                            <ChevronDown className="h-4 w-4 shrink-0 text-slate-600" />
                                          ) : (
                                            <ChevronRight className="h-4 w-4 shrink-0 text-slate-600" />
                                          )
                                        ) : (
                                          <span className="h-4 w-4 shrink-0" />
                                        )}

                                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-white text-slate-700 shadow-sm">
                                          <SquareStack className="h-3.5 w-3.5" />
                                        </span>

                                        <div className="min-w-0">
                                          <div className="truncate text-sm font-semibold text-slate-900">
                                            {round.round.round_name}
                                          </div>
                                          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
                                            {round.round.scope === "COMMON"
                                              ? "Common round"
                                              : "Role round"}
                                          </div>
                                        </div>

                                        <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-700 shadow-sm">
                                          {round.batches.length}
                                        </span>
                                      </button>

                                      {roundExpanded && hasBatches && (
                                        <div className="space-y-1 border-t border-slate-200 bg-white px-2 py-2">
                                          {round.batches.map((batch) => {
                                            const batchSelected =
                                              selectedExecutionBatchId === batch.id;

                                            return (
                                              <button
                                                key={batch.id}
                                                type="button"
                                                onClick={() => {
                                                  toggleBatch(batch.id);
                                                  onBatchSelect(batch.id);
                                                }}
                                                className={[
                                                  "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition",
                                                  batchSelected
                                                    ? "bg-slate-900 text-white"
                                                    : "hover:bg-slate-100",
                                                ].join(" ")}
                                              >
                                                <CircleDot className="h-3.5 w-3.5 shrink-0" />
                                                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                                                  {batch.round.round_name}
                                                </span>
                                                <span
                                                  className={[
                                                    "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                                                    batchSelected
                                                      ? "bg-white/15 text-white"
                                                      : "bg-slate-100 text-slate-700",
                                                  ].join(" ")}
                                                >
                                                  Batch
                                                </span>
                                              </button>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}


export default ExecutionNavigator;