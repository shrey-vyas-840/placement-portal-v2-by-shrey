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

      loadRoundParticipants(
        executionRoundId: string,
      ): Promise<RecruitmentExecutionParticipantWithStudent[]>;

      loadRoundParticipantIds(executionRoundId: string): Promise<string[]>;

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
      this.provider.loadRoundParticipants(input.currentRoundId),
    ]);

    console.group("=== PROGRESSION SOURCE MEMBERSHIP ===");

    console.log("Execution:", input.executionId);
    console.log("Current Round:", input.currentRoundId);
    console.log("Next Round:", input.nextRoundId);

    console.log("Loaded Current Round:", {
      id: currentRound?.execution_round_id,
      name: currentRound?.round_name,
      stage: currentRound?.stage_number,
    });

    console.log("Loaded Next Round:", {
      id: nextRound?.execution_round_id,
      name: nextRound?.round_name,
      stage: nextRound?.stage_number,
    });

    console.log("Current Stage Membership Count:", participants.length);

    console.log(
      "Current Stage Members:",
      participants.map((p) => ({
        executionParticipantId: p.execution_participant_id,
        enrollment: p.student.enrollment_no,
        name: `${p.student.first_name} ${p.student.last_name}`,
      })),
    );

    console.groupEnd();

    if (participants.length === 0) {
      throw new Error(
        [
          "Progression invariant violated.",
          "Current stage membership is empty.",
          `Current Round: ${input.currentRoundId}`,
          `Next Round: ${input.nextRoundId}`,
          "Progression cannot continue because no source membership exists.",
        ].join("\n"),
      );
    }

    console.log("Current Round Participants:", participants.length);
    console.log(
      participants.map((p) => ({
        id: p.execution_participant_id,
        name: `${p.student.first_name} ${p.student.last_name}`,
      })),
    );

    if (!currentRound) {
      throw new Error("Current round not found.");
    }

    if (!nextRound) {
      throw new Error("Next round not found.");
    }

    const nextRoundRoleIds =
      nextRound.scope === "ROLE_SPECIFIC"
        ? await this.provider.getRoundRoleIds(nextRound.execution_round_id)
        : [];

    const progressed = participants.filter((participant) => {
      const snapshot = runtimeSnapshot.participants[participant.execution_participant_id];

      if (!snapshot) {
        return false;
      }

      /*
       * Only shortlisted participants
       * are eligible to progress.
       */
      if (snapshot.progressionStatus !== "SHORTLISTED") {
        return false;
      }

      /*
       * Common stages accept every
       * shortlisted participant.
       */
      if (nextRound.scope === "COMMON") {
        return true;
      }

      /*
       * Role-specific stages accept
       * participants having ANY
       * configured execution role.
       */
      return participant.selected_roles.some((role) =>
        nextRoundRoleIds.includes(role.drive_role_id),
      );
    });

    console.group("=== ROLE FILTER PROGRESSION ===");

    console.log("Current Round", currentRound.round_name);

    console.log("Next Round", nextRound.round_name);

    console.log("Next Round Scope", nextRound.scope);

    console.log("Configured Roles", nextRoundRoleIds);

    console.log("Current Members", participants.length);

    console.log("Progressed Members", progressed.length);

    console.groupEnd();

    return progressed;
  }

  private async verifyRoundMembership(input: {
    executionRoundId: string;
    expectedParticipantIds: string[];
  }): Promise<void> {
    const persistedIds = await this.provider.loadRoundParticipantIds(input.executionRoundId);

    const persisted = new Set(persistedIds);

    const missing = input.expectedParticipantIds.filter((id) => !persisted.has(id));

    if (missing.length > 0) {
      throw new Error(
        [
          "Destination round membership verification failed.",
          `Round: ${input.executionRoundId}`,
          `Expected: ${input.expectedParticipantIds.length}`,
          `Persisted: ${persistedIds.length}`,
          `Missing: ${missing.join(", ")}`,
        ].join("\n"),
      );
    }
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

    const participantIds = participants.map((participant) => participant.execution_participant_id);

    //
    // Destination membership is rebuilt atomically for this stage.
    //
    await this.provider.removeRoundParticipants(input.nextRoundId);

    if (participantIds.length > 0) {
      await this.provider.assignParticipantsToRound({
        executionRoundId: input.nextRoundId,
        executionParticipantIds: participantIds,
      });
    }

    //
    // Deterministic invariant:
    // never report success until persistence has been verified.
    //
    await this.verifyRoundMembership({
      executionRoundId: input.nextRoundId,
      expectedParticipantIds: participantIds,
    });

    return participantIds.length;
  }
}
