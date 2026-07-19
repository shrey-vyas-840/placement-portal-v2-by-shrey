export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
export interface JsonObject {
  [key: string]: JsonValue;
}

export type ExecutionSeriesStatus = "ACTIVE" | "FINALIZED" | "ARCHIVED";
export type ExecutionStatus = "ACTIVE" | "FINALIZED" | "SUPERSEDED";
export type ExecutionScope = "COMMON" | "ROLE_SPECIFIC";
export type ExecutionRoundStatus = "DRAFT" | "READY" | "IN_PROGRESS" | "COMPLETED" | "STALE" | "LOCKED";
export type ExecutionAttendanceStatus = "PRESENT" | "ABSENT";
export type ExecutionGateStatus = "ALLOWED" | "RESTRICTED";
export type ExecutionProgressionStatus = "NONE" | "SHORTLISTED" | "SELECTED";
export type ExecutionEventType =
  | "EXECUTION_STARTED"
  | "ROUND_CREATED"
  | "ROUND_UPDATED"
  | "ROUND_SAVED"
  | "ROUND_MARKED_STALE"
  | "ROUND_REOPENED"
  | "ROUND_LOCKED"
  | "EXECUTION_FINALIZED"
  | "EXECUTION_REOPENED"
  | "EXECUTION_ARCHIVED";

export interface RecruitmentExecutionSeriesRow {
  series_id: string;
  opportunity_id: string;
  drive_id: string;
  company_id: string;
  series_status: ExecutionSeriesStatus;
  current_revision_number: number;
  series_snapshot: JsonObject;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecruitmentExecutionRow {
  execution_id: string;
  series_id: string;
  revision_number: number;
  execution_status: ExecutionStatus;
  execution_snapshot: JsonObject;
  reopened_from_execution_id: string | null;
  superseded_by_execution_id: string | null;
  started_by: string | null;
  started_at: string;
  finalized_by: string | null;
  finalized_at: string | null;
  reopen_reason: string | null;
  finalization_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecruitmentExecutionRoundRow {
  execution_round_id: string;
  execution_id: string;
  round_order: number;
  round_name: string;
  scope: ExecutionScope;
  scheduled_date: string | null;
  scheduled_time: string | null;
  venue: string | null;
  remarks: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecruitmentExecutionRoundRoleRow {
  execution_round_role_id: string;
  execution_round_id: string;
  drive_role_id: string;
  created_at: string;
}

export interface RecruitmentExecutionParticipantRow {
  execution_participant_id: string;
  execution_id: string;
  application_id: string;
  student_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * Participant returned by the execution service.
 *
 * This is a domain model used by the Execution Workspace.
 * It combines the execution participant with the current
 * application, student and selected-role information.
 *
 * This is NOT a database table.
 */
export interface RecruitmentExecutionParticipantWithStudent
  extends RecruitmentExecutionParticipantRow {
  application_status: string;

  student: {
    student_id: string;
    enrollment_no: string;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    institute_email: string;
    contact_number: string;
    placement_status: string | null;
    placement_preference: string;
  };

  selected_roles: ParticipantRoleSelection[];
}

export interface ParticipantRoleSelection {
  selected_role_id: string;

  drive_role_id: string;

  preference_order: number;

  drive_role_name: string;
}

export interface RecruitmentExecutionHistoryRow {
  execution_history_id: string;
  execution_id: string;
  execution_round_id: string;
  execution_participant_id: string;
  execution_revision: number;
  history_revision: number;
  attendance_status: ExecutionAttendanceStatus | null;
  gate_status: ExecutionGateStatus | null;
  progression_status: ExecutionProgressionStatus;
  remarks: string | null;
  previous_history_id: string | null;
  change_reason: string | null;
  changed_by: string | null;
  changed_at: string;
}

export interface RecruitmentExecutionFinalSelectionRow {
  execution_selection_id: string;
  execution_id: string;
  execution_participant_id: string;
  drive_role_id: string;
  placement_history_id: string | null;
  package_lpa: number | null;
  placement_type: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface RecruitmentExecutionEventRow {
  execution_event_id: string;
  execution_id: string;
  execution_round_id: string | null;
  event_type: ExecutionEventType;
  event_payload: JsonObject;
  performed_by: string | null;
  performed_at: string;
}

export interface RecruitmentExecutionSeriesSnapshot {
  opportunity_id: string;
  drive_id: string;
  company_id: string;
  opportunity_title?: string | null;
  drive_name?: string | null;
  company_name?: string | null;
  publish_data?: JsonObject | null;
  roles_data?: JsonObject | null;
  eligibility_data?: JsonObject | null;
  default_questions_data?: JsonObject | null;
  recruiters_data?: JsonObject | null;
  wizard_state?: JsonObject | null;
  metadata?: Record<string, JsonValue>;
}

export interface RecruitmentExecutionSnapshot {
  series_id: string;
  revision_number: number;
  reopened_from_execution_id?: string | null;
  reopen_reason?: string | null;
  started_by?: string | null;
  started_at?: string | null;
  participant_application_ids?: string[];
  planned_rounds?: JsonObject[];
  metadata?: Record<string, JsonValue>;
}

export interface RecruitmentExecutionRoundParticipantState {
  execution_participant_id: string;
  application_id: string;
  student_id: string;
  attendance_status: ExecutionAttendanceStatus | null;
  gate_status: ExecutionGateStatus | null;
  progression_status: ExecutionProgressionStatus;
  remarks: string | null;
}

export interface RecruitmentExecutionHistoryCreateInput {
  execution_id: string;
  execution_round_id: string;
  execution_participant_id: string;
  execution_revision: number;
  history_revision: number;
  attendance_status: ExecutionAttendanceStatus | null;
  gate_status: ExecutionGateStatus | null;
  progression_status: ExecutionProgressionStatus;
  remarks?: string | null;
  previous_history_id?: string | null;
  change_reason?: string | null;
  changed_by?: string | null;
}