import ExcelJS from "exceljs";

import type { RecruitmentExportData } from "./recruitmentExportService";

export const recruitmentExcelExportService = {
  async export(
    exportData: RecruitmentExportData,

    selectedColumns: string[],
  ) {
    const workbook = new ExcelJS.Workbook();

    workbook.creator = "Indus Placement Nexus";

    workbook.created = new Date();

    const sheet = workbook.addWorksheet("Student Responses");

    const totalColumns = Math.max(selectedColumns.length, 1);

    sheet.mergeCells(1, 1, 1, totalColumns);

    sheet.mergeCells(2, 1, 2, totalColumns);

    const titleCell = sheet.getCell("A1");

    titleCell.value = "INDUS UNIVERSITY";

    titleCell.font = {
      bold: true,

      size: 18,

      color: {
        argb: "FFFFFFFF",
      },
    };

    titleCell.alignment = {
      horizontal: "center",

      vertical: "middle",
    };

    titleCell.fill = {
      type: "pattern",

      pattern: "solid",

      fgColor: {
        argb: "FF1E3A8A",
      },
    };

    const companyCell = sheet.getCell("A2");

    companyCell.value = exportData.companyName;

    companyCell.font = {
      bold: true,

      size: 14,

      color: {
        argb: "FFFFFFFF",
      },
    };

    companyCell.alignment = {
      horizontal: "center",

      vertical: "middle",
    };

    companyCell.fill = {
      type: "pattern",

      pattern: "solid",

      fgColor: {
        argb: "FF2563EB",
      },
    };

    sheet.getRow(1).height = 30;

    sheet.getRow(2).height = 24;

    sheet.getRow(3).height = 22;

    const header = sheet.getRow(3);

    header.values = selectedColumns;

    header.eachCell((cell) => {
      cell.font = {
        bold: true,
      };

      cell.alignment = {
        horizontal: "center",

        vertical: "middle",
      };

      cell.fill = {
        type: "pattern",

        pattern: "solid",

        fgColor: {
          argb: "FFDDEBF7",
        },
      };
    });

    let excelRowIndex = 4;

    exportData.rows.forEach((row) => {
      const values = selectedColumns.map((column) => {
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
            return row.answers?.[column] ?? "";
        }
      });

      const excelRow = sheet.getRow(excelRowIndex++);

      if (
  excelRow.number % 2 === 0
) {

  excelRow.eachCell(
    (cell) => {

      cell.fill = {

        type: "pattern",

        pattern: "solid",

        fgColor: {
          argb:
            "FFF8FAFC",
        },

      };

    },
  );

}

      excelRow.values = values;

      excelRow.eachCell((cell) => {
        if (
          typeof cell.value === "string" &&
          (cell.value.startsWith("https://") || cell.value.startsWith("http://"))
        ) {
          const isUrl =
            typeof cell.value === "object"
              ? typeof (cell.value as any).text === "string"
              : typeof cell.value === "string";

          cell.alignment = {
            vertical: "top",

            wrapText: !isUrl,
          };

          excelRow.height = 24;

          const url = cell.value;

          cell.value = {
            text: url,

            hyperlink: url,
          };

          cell.font = {
            color: {
              argb: "FF0563C1",
            },

            underline: true,
          };
        }
      });
    });

    sheet.columns.forEach((column) => {
      let max = 15;

      column.eachCell?.(
        {
          includeEmpty: true,
        },
        (cell) => {
          const length = String(cell.value ?? "").length;

          if (length > max) {
            max = length;
          }
        },
      );

      column.width = Math.min(max + 4, 60);
    });

    sheet.views = [
      {
        state: "frozen",

        ySplit: 3,
      },
    ];

    sheet.autoFilter = {
      from: "A3",

      to: `${String.fromCharCode(64 + selectedColumns.length)}3`,
    };

    sheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: {
            style: "thin",
          },

          left: {
            style: "thin",
          },

          right: {
            style: "thin",
          },

          bottom: {
            style: "thin",
          },
        };
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();

    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = `${exportData.companyName}_Student Response Sheet_Indus University.xlsx`;

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);
  },
};
