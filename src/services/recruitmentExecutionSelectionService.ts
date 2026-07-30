import type {
  RecruitmentExecutionHistorySummary,
  RecruitmentExecutionParticipantWithStudent,
} from "@/types/recruitmentExecution";

export class RecruitmentExecutionSelectionService {
  getSelectedParticipants(input: {
    history: RecruitmentExecutionHistorySummary[];
    participants: RecruitmentExecutionParticipantWithStudent[];
  }): RecruitmentExecutionParticipantWithStudent[] {
    const selectedIds = new Set<string>();

    input.history.forEach((row) => {
      if (row.progression_status === "SELECTED") {
        selectedIds.add(row.execution_participant_id);
      }
    });

    return input.participants.filter((participant) =>
      selectedIds.has(participant.execution_participant_id),
    );
  }
}

export const recruitmentExecutionSelectionService =
  new RecruitmentExecutionSelectionService();