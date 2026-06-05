export type AttendanceStatus = "PRESENT" | "ABSENT";

export type AttendanceDraftStatus = AttendanceStatus | "NOT_MARKED";

export type AttendanceFilterStatus =
  | "All"
  | AttendanceStatus
  | "NOT_MARKED";

export interface AttendanceDrive {
  drive_id: string;
  drive_name: string;
  company_id: string | null;
  created_at?: string | null;
  company_master?: {
    company_name?: string | null;
  } | null;
}

export interface AttendanceOpportunity {
  opportunity_id: string;
  drive_id: string;
  opportunity_title: string;
  opportunity_description?: string | null;
  application_status?: string | null;
  visible_to_students?: boolean | null;
  application_start_date?: string | null;
  application_end_date?: string | null;
  created_at?: string | null;
}

export interface AttendanceRound {
  round_id: string;
  opportunity_id: string;
  round_number: number;
  round_name: string;
  round_type?: string | null;
  is_active?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface AttendanceApplicantRow {
  application_id: string;
  opportunity_id: string;
  student_id: string;
  application_status?: string | null;
  remarks?: string | null;
  applied_at?: string | null;
  updated_at?: string | null;
  student_master?: {
    student_id?: string;
    enrollment_no?: string | null;
    first_name?: string | null;
    middle_name?: string | null;
    last_name?: string | null;
  } | null;
  academic?: {
    student_id?: string;
    current_institute_name?: string | null;
    current_branch_name?: string | null;
    current_degree_level?: string | null;
    current_cgpa?: string | number | null;
    graduation_year?: number | null;
    active_backlogs?: number | null;
  } | null;
}

export interface AttendanceDraftRow extends AttendanceApplicantRow {
  attendance_id?: string | null;
  attendance_status: AttendanceDraftStatus;
  attendance_remarks?: string | null;
  marked_at?: string | null;
  marked_by?: string | null;
}

export interface AttendanceConsolidatedRow {
  drive_id: string;
  drive_name: string;
  company_name: string | null;
  opportunity_id: string;
  opportunity_title: string;
  round_id: string;
  round_number: number;
  round_name: string;
  student_id: string;
  enrollment_no: string;
  student_name: string;
  current_institute_name: string | null;
  current_branch_name: string | null;
  graduation_year: number | null;
  application_status: string | null;
  attendance_status: AttendanceDraftStatus;
  remarks: string | null;
  drive_date: string | null;
}
