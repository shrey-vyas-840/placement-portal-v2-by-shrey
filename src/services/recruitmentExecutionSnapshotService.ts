import { supabase } from "@/integrations/supabase/client";
import type {
  RecruitmentExecutionHistoryCreateInput,
  RecruitmentExecutionRuntimeSnapshot,
  RecruitmentExecutionRuntimeParticipantState,
  RecruitmentExecutionRuntimeRoleState,
} from "@/types/recruitmentExecution";

export class RecruitmentExecutionSnapshotService {
  private readonly EXECUTIONS_TABLE = "recruitment_executions";

  async loadSnapshot(executionId: string): Promise<RecruitmentExecutionRuntimeSnapshot> {
    const { data, error } = await (supabase as any)
      .from(this.EXECUTIONS_TABLE)
      .select("execution_snapshot")
      .eq("execution_id", executionId)
      .single();

    if (error) throw error;

    const snapshot = data?.execution_snapshot ?? {};

    // New contract
    if (snapshot.runtime) {
      return snapshot.runtime;
    }

    // Backward compatibility for early runtime-only rows
    if (snapshot.version) {
      return snapshot;
    }

    return {
      version: 1,
      participants: {},
    };
  }

  async persistSnapshot(
    executionId: string,
    runtime: RecruitmentExecutionRuntimeSnapshot,
  ): Promise<void> {
    const { data, error: readError } = await (supabase as any)
      .from(this.EXECUTIONS_TABLE)
      .select("execution_snapshot")
      .eq("execution_id", executionId)
      .single();

    if (readError) throw readError;

    const current = data?.execution_snapshot ?? {};

    const next =
      current.metadata || current.runtime
        ? {
            ...current,
            runtime,
          }
        : {
            metadata: current,
            runtime,
          };

    const { error } = await (supabase as any)
      .from(this.EXECUTIONS_TABLE)
      .update({
        execution_snapshot: next,
      })
      .eq("execution_id", executionId);

    if (error) throw error;
  }

  applyRoundSave(input: {
    snapshot: RecruitmentExecutionRuntimeSnapshot;

    executionId: string;

    roundId: string;

    historyRows: RecruitmentExecutionHistoryCreateInput[];

    participantRoles: Array<{
      executionParticipantId: string;
      roles: Array<{
        driveRoleId: string;
        driveRoleName: string;
      }>;
    }>;
  }): RecruitmentExecutionRuntimeSnapshot {
    const next: RecruitmentExecutionRuntimeSnapshot = structuredClone(
      input.snapshot.version
        ? input.snapshot
        : {
            version: 1,
            participants: {},
          },
    );

    const participantRoleMap = new Map(
      input.participantRoles.map((participant) => [
        participant.executionParticipantId,
        participant.roles.map((role) => role.driveRoleId),
      ]),
    );

    input.historyRows.forEach((history) => {
      const participantRoles = participantRoleMap.get(history.execution_participant_id);

      if (!participantRoles) {
        return;
      }

      const existing = next.participants[history.execution_participant_id];

      const roles: Record<string, RecruitmentExecutionRuntimeRoleState> =
        existing?.roles ??
        Object.fromEntries(
          participantRoles.map((roleId) => [
            roleId,
            {
              status: "ACTIVE",
              lastRoundId: null,
              lastHistoryId: null,
            },
          ]),
        );

      for (const roleId of participantRoles) {
        const roleState = roles[roleId] ?? {
          status: "ACTIVE",
          lastRoundId: null,
          lastHistoryId: null,
        };

        switch (history.progression_status) {
          case "SHORTLISTED":
            roleState.status = "ACTIVE";
            break;

          case "SELECTED":
            roleState.status = "SELECTED";
            break;

          default:
            roleState.status = "REJECTED";
            break;
        }

        roleState.lastRoundId = input.roundId;
        roleState.lastHistoryId = history.previous_history_id ?? null;

        roles[roleId] = roleState;
      }

      const participantState: RecruitmentExecutionRuntimeParticipantState = {
        lastRoundId: input.roundId,
        lastHistoryId: history.previous_history_id ?? null,

        attendanceStatus: history.attendance_status,
        gateStatus: history.gate_status,
        progressionStatus: history.progression_status,

        roles,
      };

      next.participants[history.execution_participant_id] = participantState;
    });

    return next;
  }
}

export const recruitmentExecutionSnapshotService = new RecruitmentExecutionSnapshotService();
