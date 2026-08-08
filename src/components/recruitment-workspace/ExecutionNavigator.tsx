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

interface ExecutionNavigatorRoundNode {
  id: string;
  round: RecruitmentExecutionRoundRow;
  roleNames: string[];
}

interface ExecutionNavigatorStageNode {
  stageNumber: number;
  label: string;
  rounds: ExecutionNavigatorRoundNode[];
}

function sortRounds(rounds: RecruitmentExecutionRoundRow[]) {
  return [...rounds].sort((a, b) => {
    if (a.round_order !== b.round_order) {
      return a.round_order - b.round_order;
    }

    return a.round_name.localeCompare(b.round_name);
  });
}

function getEffectiveStageNumber(
  round: RecruitmentExecutionRoundRow,
  rounds: RecruitmentExecutionRoundRow[],
): number {
  const roundById = new Map(
    rounds.map((item) => [item.execution_round_id, item]),
  );

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

function buildNavigatorModel(
  workspace: RecruitmentExecutionWorkspace,
): ExecutionNavigatorStageNode[] {
  const roleLookup = new Map<string, string[]>();

  workspace.roundRoleMappings.forEach((mapping) => {
    const role = workspace.participants
      .flatMap((p) => p.selected_roles)
      .find((r) => r.drive_role_id === mapping.drive_role_id);

    if (!role) return;

    const existing = roleLookup.get(mapping.execution_round_id) ?? [];

    existing.push(role.drive_role_name);

    roleLookup.set(mapping.execution_round_id, existing);
  });

  const stageNumbers = [
    ...new Set(
      workspace.rounds.map((round) =>
        getEffectiveStageNumber(round, workspace.rounds),
      ),
    ),
  ].sort((a, b) => a - b);

  return stageNumbers.map((stageNumber) => {
    const rounds = workspace.rounds
      .filter(
        (round) =>
          getEffectiveStageNumber(round, workspace.rounds) === stageNumber,
      )
      .sort((a, b) => {
        if (
          a.parent_execution_round_id == null &&
          b.parent_execution_round_id != null
        ) {
          return -1;
        }

        if (
          a.parent_execution_round_id != null &&
          b.parent_execution_round_id == null
        ) {
          return 1;
        }

        return a.round_order - b.round_order;
      })
      .map((round) => ({
        id: round.execution_round_id,
        round,
        roleNames: roleLookup.get(round.execution_round_id) ?? [],
      }));

    return {
      stageNumber,
      label: `Stage ${stageNumber}`,
      rounds,
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

  const [expandedRounds, setExpandedRounds] = useState<Set<string>>(new Set());

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
    if (!selectedRoundId || !workspace) {
      return;
    }

    const selectedRound = workspace.rounds.find((r) => r.execution_round_id === selectedRoundId);

    if (!selectedRound) {
      return;
    }

    const parentId = selectedRound.parent_execution_round_id ?? selectedRound.execution_round_id;

    setExpandedRounds((previous) => {
      const next = new Set(previous);
      next.add(parentId);
      return next;
    });
  }, [workspace, selectedRoundId]);

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
            <div className="text-sm font-semibold text-slate-900">
              Stages · Execution Workspaces
            </div>
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
                      {stage.rounds.length}
                    </span>
                  </button>

                  {stageExpanded && (
                    <div className="space-y-2 border-t border-slate-200 px-2 py-2">
                      <div className="space-y-2 border-t border-slate-200 px-2 py-2">
                        {stage.rounds.map((round) => {
                          const roundExpanded =
                            expandedRounds.has(round.id) || selectedRoundId === round.id;
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
                                {roundExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}

                                <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-white shadow-sm">
                                  <SquareStack className="h-3.5 w-3.5" />
                                </span>

                                <div className="min-w-0 flex-1">
                                  <div className="truncate text-sm font-semibold">
                                    {round.roleNames.length === 0
                                      ? "Common Workspace"
                                      : round.roleNames.join(" + ")}
                                  </div>

                                  <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                                    Execution Workspace
                                  </div>
                                </div>

                                <span
                                  className={[
                                    "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                                    round.round.scope === "COMMON"
                                      ? "bg-blue-100 text-blue-700"
                                      : "bg-violet-100 text-violet-700",
                                  ].join(" ")}
                                >
                                  WORKSPACE
                                </span>
                              </button>
                            </div>
                          );
                        })}
                      </div>
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
