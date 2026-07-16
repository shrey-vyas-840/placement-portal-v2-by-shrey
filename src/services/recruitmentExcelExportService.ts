import ExcelJS from "exceljs";

import type {
  RecruitmentExportData,
} from "./recruitmentExportService";

export const recruitmentExcelExportService = {

  async export(

    exportData: RecruitmentExportData,

    selectedColumns: string[],

  ) {

    const workbook =
      new ExcelJS.Workbook();

    workbook.creator =
      "Indus Placement Nexus";

    workbook.created =
      new Date();

    const sheet =
      workbook.addWorksheet(
        "Student Responses",
      );

    sheet.mergeCells(
      "A1:H1",
    );

    sheet.getCell(
      "A1",
    ).value =
      "INDUS UNIVERSITY";

    sheet.getCell(
      "A1",
    ).font = {

      bold: true,

      size: 18,

    };

    sheet.mergeCells(
      "A2:H2",
    );

    sheet.getCell(
      "A2",
    ).value =
      exportData.companyName;

    sheet.getCell(
      "A2",
    ).font = {

      bold: true,

      size: 14,

    };

    sheet.addRow([]);

    const header =
      sheet.addRow(
        selectedColumns,
      );

    header.font = {

      bold: true,

    };

    header.eachCell(
      (cell) => {

        cell.border = {

          top: {
            style: "thin",
          },

          left: {
            style: "thin",
          },

          bottom: {
            style: "thin",
          },

          right: {
            style: "thin",
          },

        };

      },
    );

        exportData.rows.forEach((row) => {

      const values =
        selectedColumns.map((column) => {

          switch (column) {

            case "Enrollment No":
              return row.enrollmentNumber;

            case "Student Name":
              return row.studentName;

            case "Institute Email":
              return row.instituteEmail;

            case "Personal Email":
              return row.personalEmail;

            case "Contact Number":
              return row.contactNumber;

            case "Alternate Contact Number":
              return row.alternateContactNumber;

            case "Gender":
              return row.gender;

            case "Date of Birth":
              return row.dateOfBirth;

            case "Placement Preference":
              return row.placementPreference;

            case "Placement Status":
              return row.placementStatus;

            case "Institute":
              return row.institute;

            case "Degree":
              return row.degree;

            case "Branch":
              return row.branch;

            case "Semester":
              return row.semester;

            case "CGPA":
              return row.cgpa;

            case "10th Percentage":
              return row.tenthPercentage;

            case "12th Percentage":
              return row.twelfthPercentage;

            case "Diploma Percentage":
              return row.diplomaPercentage;

            case "Active Backlogs":
              return row.activeBacklogs;

            case "Year Gap":
              return row.yearGapCount;

            case "Graduation Year":
              return row.graduationYear;

            case "Technical Skills":
              return row.technicalSkills;

            case "Programming Languages":
              return row.programmingLanguages;

            case "Tools & Technologies":
              return row.toolsAndTechnologies;

            case "GitHub":
              return row.github;

            case "LinkedIn":
              return row.linkedin;

            case "Portfolio":
              return row.portfolio;

            case "Strengths":
              return row.strengths;

            case "Profile Score":
              return row.profileScore;

            case "Application Status":
              return row.applicationStatus;

            case "Applied At":
              return row.appliedAt;

            case "Remarks":
              return row.remarks;

            case "Applied Roles":
              return row.appliedRoles;

            default:
              return (
                row.answers?.[
                  column
                ] ?? ""
              );

          }

        });

      sheet.addRow(
        values,
      );

    });

    sheet.columns.forEach(
      (column) => {

        let max = 15;

        column.eachCell?.(
          {
            includeEmpty: true,
          },
          (cell) => {

            const length =
              String(
                cell.value ?? "",
              ).length;

            if (
              length > max
            ) {
              max = length;
            }

          },
        );

        column.width =
          Math.min(
            max + 4,
            60,
          );

      },
    );

        sheet.views = [
      {
        state: "frozen",
        ySplit: 4,
      },
    ];

    sheet.autoFilter = {
      from: {
        row: 4,
        column: 1,
      },
      to: {
        row: 4,
        column: selectedColumns.length,
      },
    };

   const buffer =
  await workbook.xlsx.writeBuffer();

const blob =
  new Blob(
    [buffer],
    {
      type:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  );

const url =
  URL.createObjectURL(blob);

const link =
  document.createElement("a");

link.href = url;

link.download =
  `${exportData.companyName}_Student Response Sheet_Indus University.xlsx`;

document.body.appendChild(
  link,
);

link.click();

link.remove();

URL.revokeObjectURL(
  url,
);

  },

};