import type {
  RecruitmentExecutionParticipantWithStudent,
  RecruitmentExecutionHistorySummary,
  RecruitmentExecutionRoundRow,
  RecruitmentExecutionRoundRoleMapping,
  RecruitmentExecutionBatch,
  ExecutionScope,
} from "@/types/recruitmentExecution";

export class RecruitmentExecutionProgressionService {
  constructor(
    private readonly provider: {
      getRound(executionRoundId: string): Promise<RecruitmentExecutionRoundRow | null>;

      loadHistorySummary(executionId: string): Promise<RecruitmentExecutionHistorySummary[]>;

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
    const [currentRound, nextRound, history, participants, rounds, roundRoleMappings] =
      await Promise.all([
        this.provider.getRound(input.currentRoundId),
        this.provider.getRound(input.nextRoundId),
        this.provider.loadHistorySummary(input.executionId),
        this.provider.loadParticipants(input.executionId),
        this.provider.loadRounds(input.executionId),
        this.provider.loadRoundRoleMappings(input.executionId),
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
    const roundById = new Map(rounds.map((round) => [round.execution_round_id, round]));
    const rolesByRound = new Map<string, string[]>();

    roundRoleMappings.forEach((mapping) => {
      const existing = rolesByRound.get(mapping.execution_round_id) ?? [];
      existing.push(mapping.drive_role_id);
      rolesByRound.set(mapping.execution_round_id, existing);
    });

    const eligibleRoundIds = new Set(
      rounds
        .filter((round) => round.stage_number <= currentRound.stage_number)
        .map((round) => round.execution_round_id),
    );

    const historyByParticipant = new Map<string, RecruitmentExecutionHistorySummary[]>();

    history.forEach((row) => {
      if (!eligibleRoundIds.has(row.execution_round_id)) {
        return;
      }

      const rows = historyByParticipant.get(row.execution_participant_id) ?? [];
      rows.push(row);
      historyByParticipant.set(row.execution_participant_id, rows);
    });

    const progressed = participants.filter((participant) => {
      const roleState = new Map<string, { active: boolean; terminal: boolean }>();

      participant.selected_roles.forEach((role) => {
        roleState.set(role.drive_role_id, { active: false, terminal: false });
      });

      const participantHistories = (
        historyByParticipant.get(participant.execution_participant_id) ?? []
      ).sort((a, b) => {
        const roundA = roundById.get(a.execution_round_id);
        const roundB = roundById.get(b.execution_round_id);

        const stageDiff = (roundA?.stage_number ?? 0) - (roundB?.stage_number ?? 0);
        if (stageDiff !== 0) {
          return stageDiff;
        }

        const orderDiff = (roundA?.round_order ?? 0) - (roundB?.round_order ?? 0);
        if (orderDiff !== 0) {
          return orderDiff;
        }

        return (a.changed_at ?? "").localeCompare(b.changed_at ?? "");
      });

      participantHistories.forEach((row) => {
        const round = roundById.get(row.execution_round_id);

        if (!round) {
          return;
        }

        const affectedRoleIds =
          round.scope === "COMMON"
            ? participant.selected_roles.map((role) => role.drive_role_id)
            : row.drive_role_id
              ? [row.drive_role_id]
              : (rolesByRound.get(round.execution_round_id) ?? []);

        affectedRoleIds.forEach((roleId) => {
          const state = roleState.get(roleId);

          if (!state) {
            return;
          }

          if (row.progression_status === "SHORTLISTED") {
            if (!state.terminal) {
              state.active = true;
            }
            return;
          }

          state.active = false;
          state.terminal = true;
        });
      });

      return [...roleState.entries()].some(([roleId, state]) => {
        return state.active && (nextRound.scope === "COMMON" || allowedRoleSet.has(roleId));
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

