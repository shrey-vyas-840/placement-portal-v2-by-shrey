import { recruitmentExecutionService } from "@/services/recruitmentExecutionService";

export interface AttendanceExportStudent {
  studentId: string;
  enrollmentNumber: string;
  studentName: string;
  email: string;
  institute: string;
  branch: string;
  attendanceStatus: string;
  attendanceMarkedAt: string | null;
  attendanceMarkedBy: string;
}

export interface AttendanceExportMetadata {
  companyName: string;
  recruitmentTitle: string;
  seriesTitle: string;
  roundTitle: string;
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  notMarkedCount: number;
}

export interface AttendanceExportData {
  metadata: AttendanceExportMetadata;
  rows: AttendanceExportStudent[];
}

class RecruitmentExecutionAttendanceExportService {
  private readonly supabase =
    recruitmentExecutionService.getSupabaseClient();

  async getAttendanceExportData(
    executionId: string,
    executionRoundId: string,
  ): Promise<AttendanceExportData> {
const revision =
  await recruitmentExecutionService.getExecutionRevision(executionId);

if (!revision) {
  throw new Error("Execution not found.");
}

const series =
  await recruitmentExecutionService.getExecutionSeries(
    revision.series_id,
  );

if (!series) {
  throw new Error("Execution series not found.");
}

    const round =
      await recruitmentExecutionService.getRound(executionRoundId);

    const participants =
      await recruitmentExecutionService.loadRoundParticipants(
        executionRoundId,
      );

    const history =
      await recruitmentExecutionService.loadHistorySummary(
        executionRoundId,
      );

    const { data: opportunity } = await this.supabase
      .from("opportunity_master")
      .select(`
        opportunity_title,
        drive_master(
          company_master(
            company_name
          )
        )
      `)
      .eq("opportunity_id", series.opportunity_id)
      .single();

    const companyName =
      (opportunity as any)?.drive_master?.company_master?.company_name ?? "";

    const studentIds = participants.map(
      (participant: any) => participant.student_id,
    );

    const { data: students } = await this.supabase
      .from("student_master")
      .select(`
        student_id,
        enrollment_number,
        full_name,
        personal_email,
        institute,
        branch
      `)
      .in("student_id", studentIds);

    const attendanceMap = new Map(
      history.map((record: any) => [record.student_id, record]),
    );

    const rows: AttendanceExportStudent[] = participants.map(
      (participant: any) => {
        const student = students?.find(
          (item: any) => item.student_id === participant.student_id,
        );

        const attendance = attendanceMap.get(participant.student_id);

        return {
          studentId: participant.student_id,
          enrollmentNumber: student?.enrollment_number ?? "",
          studentName: student?.full_name ?? "",
          email: student?.personal_email ?? "",
          institute: student?.institute ?? "",
          branch: student?.branch ?? "",
          attendanceStatus: attendance?.attendance_status ?? "NOT_MARKED",
          attendanceMarkedAt: attendance?.marked_at ?? null,
          attendanceMarkedBy: attendance?.marked_by_name ?? "",
        };
      },
    );

    const presentCount = rows.filter(
      (row) => row.attendanceStatus === "PRESENT",
    ).length;

    const absentCount = rows.filter(
      (row) => row.attendanceStatus === "ABSENT",
    ).length;

    const notMarkedCount = rows.filter(
      (row) => row.attendanceStatus === "NOT_MARKED",
    ).length;

    return {
      metadata: {
        companyName,
        recruitmentTitle: opportunity?.opportunity_title ?? "",
        seriesTitle: `Revision ${revision.revision_number}`,
        roundTitle: round?.round_name ?? "",
        totalStudents: rows.length,
        presentCount,
        absentCount,
        notMarkedCount,
      },
      rows,
    };
  }
}

export const recruitmentExecutionAttendanceExportService =
  new RecruitmentExecutionAttendanceExportService();