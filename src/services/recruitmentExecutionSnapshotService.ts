import { supabase } from "@/integrations/supabase/client";
import type {
  RecruitmentExecutionHistoryCreateInput,
  RecruitmentExecutionParticipantWithStudent,
} from "@/types/recruitmentExecution";

export interface ExecutionRoleSnapshot {
  status: "ACTIVE" | "REJECTED" | "SELECTED";
  lastRoundId: string | null;
  lastHistoryRevision: number;
  lastHistoryId: string | null;
}

export interface ExecutionParticipantSnapshot {
  currentRoundId: string;
  currentBatchId: string | null;

  attendanceStatus: string | null;
  gateStatus: string | null;
  progressionStatus: string;

  roles: Record<string, ExecutionRoleSnapshot>;

  updatedAt: string;
}

export interface RecruitmentExecutionRuntimeSnapshot {
  version: 1;

  participants: Record<string, ExecutionParticipantSnapshot>;
}

export class RecruitmentExecutionSnapshotService {
  private readonly EXECUTIONS_TABLE = "recruitment_executions";

  async loadSnapshot(executionId: string): Promise<RecruitmentExecutionRuntimeSnapshot> {
    const { data, error } = await (supabase as any)
      .from(this.EXECUTIONS_TABLE)
      .select("execution_snapshot")
      .eq("execution_id", executionId)
      .single();

    if (error) throw error;

    return (
      data.execution_snapshot ?? {
        version: 1,
        participants: {},
      }
    );
  }

  async persistSnapshot(
    executionId: string,
    snapshot: RecruitmentExecutionRuntimeSnapshot,
  ): Promise<void> {
    const { error } = await (supabase as any)
      .from(this.EXECUTIONS_TABLE)
      .update({
        execution_snapshot: snapshot,
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

      const roles =
        existing?.roles ??
        Object.fromEntries(
          participantRoles.map((roleId) => [
            roleId,
            {
              status: "ACTIVE",
              lastRoundId: null,
              lastHistoryRevision: 0,
              lastHistoryId: null,
            },
          ]),
        );

      next.participants[history.execution_participant_id] = {
        currentRoundId: input.roundId,
        currentBatchId: existing?.currentBatchId ?? null,

        attendanceStatus: history.attendance_status,

        gateStatus: history.gate_status,

        progressionStatus: history.progression_status,

        roles,

        updatedAt: new Date().toISOString(),
      };
    });

    return next;
  }
}

export const recruitmentExecutionSnapshotService = new RecruitmentExecutionSnapshotService();
