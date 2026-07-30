import type {
  AttendanceExportData,
  AttendanceExportStudent,
} from "@/services/recruitmentExecutionAttendanceExportService";

import type {
  ExportConfiguration,
  ExportDataset,
  ExportColumn,
} from "@/services/export/exportTypes";

export function buildAttendanceExportConfiguration(
  data: AttendanceExportData,
  mode: "PRE" | "POST" = "POST",
): ExportConfiguration<AttendanceExportStudent> {
  const columns: ExportColumn[] = [
    {
      key: "Enrollment Number",
      label: "Enrollment Number",
      group: "Student",
      required: true,
      defaultEnabled: true,
      width: 18,
    },
    {
      key: "Student Name",
      label: "Student Name",
      group: "Student",
      required: true,
      defaultEnabled: true,
      width: 32,
    },
    {
      key: "Email",
      label: "Email",
      group: "Student",
      defaultEnabled: true,
      excelType: "email",
      width: 34,
    },
    {
      key: "Institute",
      label: "Institute",
      group: "Academic",
      defaultEnabled: true,
      width: 22,
    },
    {
      key: "Branch",
      label: "Branch",
      group: "Academic",
      defaultEnabled: true,
      width: 22,
    },
    {
      key: "Attendance Status",
      label: "Attendance Status",
      group: "Attendance",
      required: true,
      defaultEnabled: true,
      width: 18,
    },
    {
      key: "Marked At",
      label: "Marked At",
      group: "Attendance",
      defaultEnabled: true,
      width: 24,
    },
    {
      key: "Marked By",
      label: "Marked By",
      group: "Attendance",
      defaultEnabled: true,
      width: 28,
    },
  ];

  const dataset: ExportDataset<AttendanceExportStudent> = {
    title: mode === "PRE" ? "Pre-Attendance Sheet" : "Attendance Report",
    subtitle: `${data.metadata.companyName} • ${data.metadata.roundTitle}`,
    sheetName: mode === "PRE" ? "Pre Attendance" : "Attendance Report",
    filename:
      mode === "PRE"
        ? `${data.metadata.companyName} - ${data.metadata.roundTitle} - Pre Attendance.xlsx`
        : `${data.metadata.companyName} - ${data.metadata.roundTitle} - Attendance Report.xlsx`,
    columns,
    rows: data.rows,
    summary: [
      {
        label: "Company",
        value: data.metadata.companyName,
      },
      {
        label: "Recruitment",
        value: data.metadata.recruitmentTitle,
      },
      {
        label: "Series",
        value: data.metadata.seriesTitle,
      },
      {
        label: "Round",
        value: data.metadata.roundTitle,
      },
      {
        label: "Students",
        value: data.metadata.totalStudents,
      },
      {
        label: "Present",
        value: data.metadata.presentCount,
      },
      {
        label: "Absent",
        value: data.metadata.absentCount,
      },
      {
        label: "Not Marked",
        value: data.metadata.notMarkedCount,
      },
    ],
  };

  return {
    dataset,

    getCellValue(row, column) {
      switch (column) {
        case "Enrollment Number":
          return row.enrollmentNumber;

        case "Student Name":
          return row.studentName;

        case "Email":
          return row.email;

        case "Institute":
          return row.institute;

        case "Branch":
          return row.branch;

        case "Attendance Status":
          return mode === "PRE" ? "" : (row.attendanceStatus ?? "");

        case "Marked At":
          return mode === "PRE" ? "" : (row.attendanceMarkedAt ?? "");

        case "Marked By":
          return mode === "PRE" ? "" : (row.attendanceMarkedBy ?? "");

        default:
          return "";
      }
    },
  };
}
