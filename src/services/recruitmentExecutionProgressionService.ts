import type {
  RecruitmentExecutionParticipantWithStudent,
  RecruitmentExecutionHistorySummary,
  RecruitmentExecutionRoundRow,
  RecruitmentExecutionRoundRoleMapping,
  RecruitmentExecutionBatch,
  ExecutionScope,
  RecruitmentExecutionRuntimeSnapshot,
} from "@/types/recruitmentExecution";

export class RecruitmentExecutionProgressionService {
  constructor(
    private readonly provider: {
      getRound(executionRoundId: string): Promise<RecruitmentExecutionRoundRow | null>;

      loadHistorySummary(executionId: string): Promise<RecruitmentExecutionHistorySummary[]>;

      loadRuntimeSnapshot(executionId: string): Promise<RecruitmentExecutionRuntimeSnapshot>;

      loadParticipants(executionId: string): Promise<RecruitmentExecutionParticipantWithStudent[]>;

      loadRounds(executionId: string): Promise<RecruitmentExecutionRoundRow[]>;

      loadRoundRoleMappings(executionId: string): Promise<RecruitmentExecutionRoundRoleMapping[]>;

      getRoundRoleIds(executionRoundId: string): Promise<string[]>;

      assignParticipantsToRound(input: {
        executionRoundId: string;
        executionParticipantIds: string[];
      }): Promise<void>;

      removeRoundParticipants(executionRoundId: string): Promise<void>;
    },
  ) {}

  filterParticipantsForNextRound(input: {
    participants: RecruitmentExecutionParticipantWithStudent[];
    history: RecruitmentExecutionHistorySummary[];
    allowedRoleIds: string[];
    scope: ExecutionScope;
    currentRoundId: string;
  }): RecruitmentExecutionParticipantWithStudent[] {
    const latestCurrentRound = new Map<string, RecruitmentExecutionHistorySummary>();

    input.history
      .filter((history) => history.execution_round_id === input.currentRoundId)
      .forEach((history) => {
        latestCurrentRound.set(history.execution_participant_id, history);
      });

    return input.participants.filter((participant) => {
      const latest = latestCurrentRound.get(participant.execution_participant_id);

      if (latest?.progression_status !== "SHORTLISTED") {
        return false;
      }

      if (input.scope === "COMMON") {
        return true;
      }

      return participant.selected_roles.some((role) =>
        input.allowedRoleIds.includes(role.drive_role_id),
      );
    });
  }

  async deriveNextRoundParticipants(input: {
    executionId: string;
    currentRoundId: string;
    nextRoundId: string;
  }): Promise<RecruitmentExecutionParticipantWithStudent[]> {
    const [currentRound, nextRound, runtimeSnapshot, participants] = await Promise.all([
      this.provider.getRound(input.currentRoundId),
      this.provider.getRound(input.nextRoundId),
      this.provider.loadRuntimeSnapshot(input.executionId),
      this.provider.loadParticipants(input.executionId),
    ]);

    if (!currentRound) {
      throw new Error("Current round not found.");
    }

    if (!nextRound) {
      throw new Error("Next round not found.");
    }

    const allowedRoleIds =
      nextRound.scope === "ROLE_SPECIFIC"
        ? await this.provider.getRoundRoleIds(input.nextRoundId)
        : [];

    const allowedRoleSet = new Set(allowedRoleIds);

    const progressed = participants.filter((participant) => {
      const snapshot = runtimeSnapshot.participants[participant.execution_participant_id];

      if (!snapshot) {
        return false;
      }

      if (nextRound.scope === "COMMON") {
        return snapshot.progressionStatus === "SHORTLISTED";
      }

      return Object.entries(snapshot.roles).some(([roleId, roleState]) => {
        return allowedRoleSet.has(roleId) && roleState.status === "ACTIVE";
      });
    });

    return progressed;
  }

  async populateNextRoundParticipants(input: {
    executionId: string;
    currentRoundId: string;
    nextRoundId: string;
  }): Promise<number> {
    const participants = await this.deriveNextRoundParticipants({
      executionId: input.executionId,
      currentRoundId: input.currentRoundId,
      nextRoundId: input.nextRoundId,
    });

    console.log("========== NEXT ROUND ==========");
    console.log("Current Round:", input.currentRoundId);
    console.log("Next Round:", input.nextRoundId);
    console.log("Progressed Count:", participants.length);
    console.log(
      participants.map((p) => ({
        id: p.execution_participant_id,
        name: `${p.student.first_name} ${p.student.last_name}`,
        roles: p.selected_roles.map((r) => r.drive_role_name),
      })),
    );

    await this.provider.removeRoundParticipants(input.nextRoundId);

    await this.provider.assignParticipantsToRound({
      executionRoundId: input.nextRoundId,
      executionParticipantIds: participants.map(
        (participant) => participant.execution_participant_id,
      ),
    });

    return participants.length;
  }
}
