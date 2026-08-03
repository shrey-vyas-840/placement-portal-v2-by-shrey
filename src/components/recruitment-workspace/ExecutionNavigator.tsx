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

function buildNavigatorModel(
  workspace: RecruitmentExecutionWorkspace,
): ExecutionNavigatorStageNode[] {
  const stageNumbers = [...new Set(workspace.rounds.map((round) => round.stage_number))].sort(
    (a, b) => a - b,
  );

  return stageNumbers.map((stageNumber) => {
    const rounds = workspace.rounds
      .filter(
        (round) => round.stage_number === stageNumber && round.parent_execution_round_id == null,
      )
      .sort((a, b) => a.round_order - b.round_order)
      .map((round) => ({
        id: round.execution_round_id,
        round,
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
    if (!selectedRoundId) {
      return;
    }

    setExpandedRounds((previous) => {
      const next = new Set(previous);
      next.add(selectedRoundId);
      return next;
    });
  }, [selectedRoundId]);

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
                                  <div className="truncate text-sm font-semibold text-slate-900">
                                    {round.round.round_name}
                                  </div>

                                  <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                                    {round.round.scope === "COMMON" ? "Common Round" : "Role Round"}
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
                                  {round.round.scope === "COMMON" ? "COMMON" : "ROLE"}
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
