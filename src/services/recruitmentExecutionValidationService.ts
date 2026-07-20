import {
  ExecutionAttendanceStatus,
  ExecutionGateStatus,
  ExecutionProgressionStatus,
  RecruitmentExecutionRoundParticipantState,
} from "@/types/recruitmentExecution";

export interface ExecutionValidationError {
  executionParticipantId: string;
  message: string;
}

export class RecruitmentExecutionValidationService {
  static validateRound(
    participants: RecruitmentExecutionRoundParticipantState[],
  ): ExecutionValidationError[] {
    const errors: ExecutionValidationError[] = [];

    for (const participant of participants) {
      const attendance = participant.attendance_status;
      const gate = participant.gate_status;
      const progression = participant.progression_status;
      const remarks = participant.remarks?.trim() ?? "";

      // Rule 1
      if (
        attendance === "ABSENT" &&
        progression !== "NONE"
      ) {
        errors.push({
          executionParticipantId:
            participant.execution_participant_id,
          message:
            "Absent participants cannot progress.",
        });
      }

      // Rule 2
      if (
        gate === "RESTRICTED" &&
        (
          attendance !== null ||
          progression !== "NONE"
        )
      ) {
        errors.push({
          executionParticipantId:
            participant.execution_participant_id,
          message:
            "Restricted participants cannot be processed.",
        });
      }

      // Rule 3
      if (
        progression !== "NONE" &&
        attendance !== "PRESENT"
      ) {
        errors.push({
          executionParticipantId:
            participant.execution_participant_id,
          message:
            "Only present participants may progress.",
        });
      }

      // Rule 4
      if (
        attendance === "ABSENT" &&
        remarks.length === 0
      ) {
        errors.push({
          executionParticipantId:
            participant.execution_participant_id,
          message:
            "Remarks are required for absent participants.",
        });
      }
    }

    return errors;
  }
}

export const recruitmentExecutionValidationService =
  RecruitmentExecutionValidationService;