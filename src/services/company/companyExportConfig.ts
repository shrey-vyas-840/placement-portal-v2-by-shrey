import type { ExportConfiguration, ExportDataset } from "@/services/export/exportTypes";

import type { CompanyExportRow } from "@/services/companyExportService";

export function buildCompanyExportConfiguration(
  dataset: ExportDataset<CompanyExportRow>,
): ExportConfiguration<CompanyExportRow> {
return {

    dataset,

    showSearch: false,

    showGlobalSelect: false,

    getCellValue(row, column) {
      switch (column) {
        case "Company Name":
          return row.companyName;

        case "Website":
          return row.website;

        case "Industry":
          return row.industry;

        case "Hiring Location":
          return row.hiringLocation;

        case "Company Size":
          return row.companySize;

        case "Description":
          return row.description;

        case "Past Recruitment Count":
          return row.pastRecruitmentCount;

        case "Primary HR Name":
          return row.recruiters.find((x) => x.primary_contact)?.contact_name ?? "";

        case "Primary HR Contact":
          return row.recruiters.find((x) => x.primary_contact)?.contact_number ?? "";

        case "Primary HR Email":
          return row.recruiters.find((x) => x.primary_contact)?.contact_email ?? "";

        case "Primary HR Position":
          return row.recruiters.find((x) => x.primary_contact)?.contact_position ?? "";

        default: {
          const match = column.match(/^Recruiter (\d+) (Name|Email|Contact|Position)$/);

          if (!match) {
            return "";
          }

          const recruiterIndex = Number(match[1]);

          const recruiter = row.recruiters.filter((x) => !x.primary_contact)[recruiterIndex - 1];

          if (!recruiter) {
            return "";
          }

          switch (match[2]) {
            case "Name":
              return recruiter.contact_name;

            case "Email":
              return recruiter.contact_email;

            case "Contact":
              return recruiter.contact_number;

            case "Position":
              return recruiter.contact_position;

            default:
              return "";
          }
        }
      }
    },

    getCellStyle(value) {
      if (
        typeof value === "string" &&
        (value.startsWith("https://") || value.startsWith("http://"))
      ) {
        return {
          hyperlink: value,

          wrapText: false,
        };
      }

      return {
        wrapText: true,
      };
    },
  };
}
