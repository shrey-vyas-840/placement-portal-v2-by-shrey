import ExcelJS from "exceljs";

import { adminAttendanceService } from "@/services/adminAttendanceService";
import type { AttendanceDraftRow } from "@/types/attendance";

function downloadWorkbook(workbook: ExcelJS.Workbook, fileName: string) {
  return workbook.xlsx.writeBuffer().then((buffer) => {
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  });
}

function formatDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB");
}

function buildTitleSheet(worksheet: ExcelJS.Worksheet, lines: string[]) {
  worksheet.columns = [
    { width: 20 },
    { width: 20 },
    { width: 28 },
    { width: 24 },
    { width: 22 },
    { width: 24 },
    { width: 24 },
    { width: 18 },
    { width: 20 },
    { width: 18 },
    { width: 16 },
    { width: 28 },
  ];

  lines.forEach((line, index) => {
    const row = worksheet.getRow(index + 1);
    row.getCell(1).value = line;
    if (index < 3) {
      worksheet.mergeCells(index + 1, 1, index + 1, 12);
      row.font = { bold: true };
    }
  });
}

function createHeaderStyle(row: ExcelJS.Row) {
  row.font = { bold: true };
  row.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  row.eachCell((cell) => {
    cell.font = { bold: true };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  });
}

export const adminAttendanceExportService = {
  async downloadIndividualAttendanceSheet(opportunityId: string, roundId: string) {
    const workspace = await adminAttendanceService.getWorkspace(opportunityId, roundId);
    const round = workspace.rounds.find((item) => item.round_id === roundId);
    const worksheet = new ExcelJS.Workbook().addWorksheet("Attendance");

    buildTitleSheet(worksheet, [
      "Indus University",
      "Training & Placement Cell",
      "Event/Activity Attendance",
      `Activity Name: ${workspace.opportunity?.opportunity_title ?? ""}`,
      `Drive: ${workspace.drive?.drive_name ?? ""}`,
    ]);

    const headerRow = worksheet.addRow([
      "S. No.",
      "Enrollment No.",
      "Name of Student",
      "Institute",
      "Branch",
      "Attendance/Signature",
    ]);
    createHeaderStyle(headerRow);

    workspace.rows.forEach((row: AttendanceDraftRow, index) => {
      worksheet.addRow([
        index + 1,
        row.student_master?.enrollment_no ?? "",
        `${row.student_master?.first_name ?? ""} ${row.student_master?.middle_name ?? ""} ${row.student_master?.last_name ?? ""}`
          .replace(/\s+/g, " ")
          .trim(),
        row.academic?.current_institute_name ?? "",
        row.academic?.current_branch_name ?? "",
        row.attendance_status === "PRESENT" ? "P" : row.attendance_status === "ABSENT" ? "A" : "",
      ]);
    });

    worksheet.getRow(6).font = { bold: true };
    worksheet.getRow(6).alignment = { horizontal: "center", vertical: "middle", wrapText: true };

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber >= 7) {
        row.eachCell((cell) => {
          cell.alignment = { vertical: "middle", wrapText: true };
        });
      }
    });

    await downloadWorkbook(
      worksheet.workbook,
      `${workspace.drive?.drive_name ?? "attendance"}_${workspace.opportunity?.opportunity_title ?? "opportunity"}_${round?.round_name ?? "round"}.xlsx`,
    );
  },

  async downloadConsolidatedAttendanceSheet(driveId: string) {
    const rows = await adminAttendanceService.getConsolidatedRows(driveId);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Consolidated Attendance");

    worksheet.columns = [
      { width: 10 },
      { width: 18 },
      { width: 24 },
      { width: 18 },
      { width: 16 },
      { width: 18 },
      { width: 28 },
      { width: 16 },
      { width: 18 },
      { width: 16 },
      { width: 14 },
      { width: 24 },
    ];

    worksheet.getCell("A1").value = "Indus University";
    worksheet.getCell("A2").value = "Training & Placement Cell";
    worksheet.getCell("A3").value = "Attendance Record_AY 2025-26";
    worksheet.mergeCells("A1:L1");
    worksheet.mergeCells("A2:L2");
    worksheet.mergeCells("A3:L3");
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(2).font = { bold: true };
    worksheet.getRow(3).font = { bold: true };

    const header = worksheet.addRow([
      "S.No.",
      "Enrollment No.",
      "Name of Student",
      "Institute",
      "Branch",
      "Passing Out Batch",
      "Company Name",
      "Date Of Drive",
      "Part of Drive",
      "Applying Status",
      "Attendance",
      "Remarks",
    ]);
    createHeaderStyle(header);

    rows.forEach((row, index) => {
      worksheet.addRow([
        index + 1,
        row.enrollment_no,
        row.student_name,
        row.current_institute_name ?? "",
        row.current_branch_name ?? "",
        row.graduation_year ?? "",
        row.company_name ?? row.drive_name ?? "",
        formatDate(row.drive_date),
        row.round_name,
        row.application_status ?? "",
        row.attendance_status === "PRESENT" ? "P" : row.attendance_status === "ABSENT" ? "A" : "",
        row.remarks ?? "",
      ]);
    });

    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.alignment = { vertical: "middle", wrapText: true };
      });

      if (rowNumber >= 5) {
        row.height = 20;
      }
    });

    await downloadWorkbook(workbook, `consolidated_attendance_${driveId}.xlsx`);
  },
};
