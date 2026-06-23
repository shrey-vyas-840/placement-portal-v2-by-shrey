import { supabase } from "@/lib/supabase";

import type {
  AttendanceApplicantRow,
  AttendanceConsolidatedRow,
  AttendanceDraftRow,
  AttendanceDrive,
  AttendanceOpportunity,
  AttendanceRound,
  AttendanceStatus,
} from "@/types/attendance";

type AttendanceSaveRow = {
  student_id: string;
  attendance_status: AttendanceDraftRow["attendance_status"];
  attendance_remarks?: string | null;
};

type OpportunityWorkspace = {
  drive: AttendanceDrive | null;
  opportunity: AttendanceOpportunity | null;
  rounds: AttendanceRound[];
  rows: AttendanceDraftRow[];
};

function fullName(parts: {
  first_name?: string | null;
  middle_name?: string | null;
  last_name?: string | null;
}) {
  return [parts.first_name, parts.middle_name, parts.last_name]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeRemark(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function formatAttendanceValue(status: AttendanceDraftRow["attendance_status"]) {
  if (status === "PRESENT") return "P";
  if (status === "ABSENT") return "A";
  return "";
}

async function getCurrentUserAccountId() {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;

  const authUserId = authData.user?.id;
  if (!authUserId) {
    throw new Error("You are not signed in.");
  }

  const { data: account, error: accountError } = await (supabase as any)
    .from("user_accounts")
    .select("user_id")
    .eq("auth_provider_id", authUserId)
    .maybeSingle();

  if (accountError) throw accountError;

  if (!account?.user_id) {
    throw new Error("No linked application account was found for this user.");
  }

  return account.user_id as string;
}

async function getAcademicDetails(studentIds: string[]) {
  if (studentIds.length === 0) return [];

  const { data, error } = await (supabase as any)
    .from("student_academic_details")
    .select(
      `
      student_id,
      current_institute_name,
      current_branch_name,
      current_degree_level,
      current_cgpa,
      graduation_year,
      active_backlogs
    `,
    )
    .in("student_id", studentIds);

  if (error) throw error;
  return data ?? [];
}

async function getAttendanceRecords(roundId: string) {
  const { data, error } = await (supabase as any)
    .from("attendance_records")
    .select("*")
    .eq("round_id", roundId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export const adminAttendanceService = {
  async getDrives() {
    const { data, error } = await (supabase as any)
      .from("drive_master")
      .select(
        `
        drive_id,
        drive_name,
        company_id,
        created_at,
        company_master (
          company_name
        )
      `,
      )
      .eq("is_active", true)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as AttendanceDrive[];
  },

  async getOpportunitiesByDrive(driveId: string) {
    const { data, error } = await (supabase as any)
      .from("opportunity_master")
      .select(
        `
        opportunity_id,
        drive_id,
        opportunity_title,
        opportunity_description,
        application_status,
        visible_to_students,
        application_start_date,
        application_end_date,
        created_at
      `,
      )
      .eq("drive_id", driveId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as AttendanceOpportunity[];
  },

  async getRoundsByOpportunity(opportunityId: string) {
    const { data, error } = await (supabase as any)
      .from("attendance_rounds")
      .select("*")
      .eq("opportunity_id", opportunityId)
      .eq("is_active", true)
      .order("round_number", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) throw error;
    return (data ?? []) as AttendanceRound[];
  },

  async createRound(payload: {
    opportunity_id: string;
    round_number: number;
    round_name: string;
    round_type?: string | null;
  }) {
    const { data, error } = await (supabase as any)
      .from("attendance_rounds")
      .insert({
        opportunity_id: payload.opportunity_id,
        round_number: payload.round_number,
        round_name: payload.round_name,
        round_type: payload.round_type || null,
        is_active: true,
      })
      .select("*")
      .single();

    if (error) throw error;
    return data as AttendanceRound;
  },

  async getOpportunityApplicants(opportunityId: string) {
    const { data: applications, error } = await (supabase as any)
      .from("student_opportunity_applications")
      .select(
        `
        application_id,
        opportunity_id,
        student_id,
        application_status,
        remarks,
        applied_at,
        updated_at,
        student_master (
          student_id,
          enrollment_no,
          first_name,
          middle_name,
          last_name
        )
      `,
      )
      .eq("opportunity_id", opportunityId)
      .order("applied_at", { ascending: true });

    if (error) throw error;

    const students = (applications ?? []) as AttendanceApplicantRow[];
    const studentIds = students.map((row) => row.student_id);
    const academics = await getAcademicDetails(studentIds);

    return students.map((row) => {
      const academic = academics.find((item: any) => item.student_id === row.student_id);

      return {
        ...row,
        academic: academic || null,
      } as AttendanceApplicantRow;
    });
  },

  async getAttendanceRows(opportunityId: string, roundId: string) {
    const [applicants, records] = await Promise.all([
      this.getOpportunityApplicants(opportunityId),
      getAttendanceRecords(roundId),
    ]);

    const recordMap = new Map<string, any>();
    for (const record of records) {
      recordMap.set(record.student_id, record);
    }

    const rows = applicants.map((applicant) => {
      const record = recordMap.get(applicant.student_id);

      return {
        ...applicant,
        attendance_id: record?.attendance_id ?? null,
        attendance_status: record?.attendance_status ?? "NOT_MARKED",
        attendance_remarks: record?.remarks ?? null,
        marked_at: record?.marked_at ?? null,
        marked_by: record?.marked_by ?? null,
      } as AttendanceDraftRow;
    });

    rows.sort((a, b) => {
      const aEnroll = a.student_master?.enrollment_no ?? "";
      const bEnroll = b.student_master?.enrollment_no ?? "";
      return aEnroll.localeCompare(bEnroll);
    });

    return rows;
  },

  async getWorkspace(
    opportunityId: string,
    roundId?: string | null,
  ): Promise<OpportunityWorkspace> {
    const { data: opportunity, error: opportunityError } = await (supabase as any)
      .from("opportunity_master")
      .select(
        `
        opportunity_id,
        drive_id,
        opportunity_title,
        opportunity_description,
        application_status,
        visible_to_students,
        application_start_date,
        application_end_date,
        created_at,
        drive_master (
          drive_id,
          drive_name,
          company_id,
          created_at,
          company_master (
            company_name
          )
        )
      `,
      )
      .eq("opportunity_id", opportunityId)
      .maybeSingle();

    if (opportunityError) throw opportunityError;
    if (!opportunity) {
      return { drive: null, opportunity: null, rounds: [], rows: [] };
    }

    const rounds = await this.getRoundsByOpportunity(opportunityId);
    const selectedRoundId = roundId || rounds[0]?.round_id || null;
    const rows = selectedRoundId
      ? await this.getAttendanceRows(opportunityId, selectedRoundId)
      : [];

    return {
      drive: (opportunity.drive_master ?? null) as AttendanceDrive | null,
      opportunity: {
        opportunity_id: opportunity.opportunity_id,
        drive_id: opportunity.drive_id,
        opportunity_title: opportunity.opportunity_title,
        opportunity_description: opportunity.opportunity_description,
        application_status: opportunity.application_status,
        visible_to_students: opportunity.visible_to_students,
        application_start_date: opportunity.application_start_date,
        application_end_date: opportunity.application_end_date,
        created_at: opportunity.created_at,
      },
      rounds,
      rows,
    };
  },

  async saveAttendanceRows(roundId: string, rows: AttendanceSaveRow[]) {
    const userId = await getCurrentUserAccountId();

    const presentOrAbsent = rows.filter(
      (row) => row.attendance_status === "PRESENT" || row.attendance_status === "ABSENT",
    );

    const notMarkedStudentIds = rows
      .filter((row) => row.attendance_status === "NOT_MARKED")
      .map((row) => row.student_id);

    if (presentOrAbsent.length > 0) {
      const { error: upsertError } = await (supabase as any).from("attendance_records").upsert(
        presentOrAbsent.map((row) => ({
          round_id: roundId,
          student_id: row.student_id,
          attendance_status: row.attendance_status,
          remarks: normalizeRemark(row.attendance_remarks),
          marked_by: userId,
          marked_at: new Date().toISOString(),
        })),
        {
          onConflict: "round_id,student_id",
        },
      );

      if (upsertError) throw upsertError;
    }

    if (notMarkedStudentIds.length > 0) {
      const { error: deleteError } = await (supabase as any)
        .from("attendance_records")
        .delete()
        .eq("round_id", roundId)
        .in("student_id", notMarkedStudentIds);

      if (deleteError) throw deleteError;
    }
  },

  async getConsolidatedRows(driveId: string) {
    const { data: drive, error: driveError } = await (supabase as any)
      .from("drive_master")
      .select(
        `
        drive_id,
        drive_name,
        created_at,
        company_master (
          company_name
        )
      `,
      )
      .eq("drive_id", driveId)
      .maybeSingle();

    if (driveError) throw driveError;
    if (!drive) return [];

    const { data: opportunities, error: opportunitiesError } = await (supabase as any)
      .from("opportunity_master")
      .select(
        `
        opportunity_id,
        opportunity_title,
        application_status,
        application_start_date,
        application_end_date,
        created_at
      `,
      )
      .eq("drive_id", driveId)
      .order("created_at", { ascending: false });

    if (opportunitiesError) throw opportunitiesError;

    const allRows: AttendanceConsolidatedRow[] = [];

    for (const opportunity of opportunities ?? []) {
      const rounds = await this.getRoundsByOpportunity(opportunity.opportunity_id);
      for (const round of rounds) {
        const rows = await this.getAttendanceRows(opportunity.opportunity_id, round.round_id);
        for (const row of rows) {
          allRows.push({
            drive_id: drive.drive_id,
            drive_name: drive.drive_name,
            company_name: drive.company_master?.company_name ?? null,
            opportunity_id: opportunity.opportunity_id,
            opportunity_title: opportunity.opportunity_title,
            round_id: round.round_id,
            round_number: round.round_number,
            round_name: round.round_name,
            student_id: row.student_id,
            enrollment_no: row.student_master?.enrollment_no ?? "",
            student_name: fullName(row.student_master ?? {}),
            current_institute_name: row.academic?.current_institute_name ?? null,
            current_branch_name: row.academic?.current_branch_name ?? null,
            graduation_year: row.academic?.graduation_year ?? null,
            application_status: row.application_status ?? null,
            attendance_status: row.attendance_status,
            remarks: normalizeRemark(row.attendance_remarks),
            drive_date: drive.created_at ?? opportunity.application_start_date ?? null,
          });
        }
      }
    }

    return allRows;
  },

  formatAttendanceValue,
};
