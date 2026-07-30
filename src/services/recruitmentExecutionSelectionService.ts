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

  validateExecutionCompletion(input: {
  participants: RecruitmentExecutionParticipantWithStudent[];
  history: RecruitmentExecutionHistorySummary[];
}): void {
  const latestHistory = new Map<string, RecruitmentExecutionHistorySummary>();

  input.history.forEach((row) => {
    latestHistory.set(row.execution_participant_id, row);
  });

  const pending = input.participants.filter((participant) => {
    const latest = latestHistory.get(participant.execution_participant_id);

    if (!latest) {
      return true;
    }

    if (latest.progression_status === "SHORTLISTED") {
      return true;
    }

    return false;
  });

  if (pending.length > 0) {
    throw new Error(
      "Recruitment execution cannot be finalized because one or more participant pipelines are still active.",
    );
  }
}

buildFinalSelectionRows(input: {
  executionId: string;
  participants: RecruitmentExecutionParticipantWithStudent[];
}) {
  return input.participants.map((participant) => ({
    execution_id: input.executionId,
    execution_participant_id: participant.execution_participant_id,
    application_id: participant.application_id,
    student_id: participant.student_id,
  }));
}

buildPlacementHistoryRows(input: {
  participants: RecruitmentExecutionParticipantWithStudent[];
  opportunityId: string;
  driveId: string;
  companyId: string;
  companyName: string;
}) {
  return input.participants.map((participant) => ({
    student_id: participant.student_id,
    opportunity_id: input.opportunityId,
    drive_id: input.driveId,
    company_id: input.companyId,
    company_name: input.companyName,
    package_lpa: 0,
    placement_type: "On Campus Placement",
    placed_at: new Date().toISOString().slice(0, 10),
    is_current: true,
  }));
}

buildStudentPlacementUpdates(input: {
  participants: RecruitmentExecutionParticipantWithStudent[];
}) {
  return input.participants.map((participant) => participant.student_id);
}

    

}

export const recruitmentExecutionSelectionService =
  new RecruitmentExecutionSelectionService();