import { recruitmentRegisterService } from "./recruitmentRegisterService";

import type { ExportColumn, ExportDataset } from "@/services/export/exportTypes";

export interface RecruitmentRegisterExportRow {
  [key: string]: any;
}

export const recruitmentRegisterExportService = {
  async getRecruitmentRegisterExportData(): Promise<ExportDataset<RecruitmentRegisterExportRow>> {
    const recruitments = await recruitmentRegisterService.getRecruitments();

    const rows: RecruitmentRegisterExportRow[] = recruitments.map((item: any) => ({
      "Company Name": item.company?.company_name ?? "",

      Recruitment: item.drive_name ?? "",

      Status: item.lifecycleStatus ?? "",

      Roles: (item.roleNames ?? []).join(", "),

      "Eligible Branches": (item.eligibleBranches ?? []).join(", "),

      "Eligible Students": item.projection?.eligible_students ?? "",

      "Registered Students": item.projection?.registered_students ?? "",

      Applications: item.projection?.total_applications ?? "",

      Present: item.projection?.present_students ?? "",

      Absent: item.projection?.absent_students ?? "",

      Shortlisted: item.projection?.shortlisted_students ?? "",

      Interviewed: item.projection?.interviewed_students ?? "",

      Selected: item.projection?.selected_students ?? "",

      Rejected: item.projection?.rejected_students ?? "",
    }));

    const columns: ExportColumn[] = [
      {
        key: "Company Name",
        label: "Company Name",
        group: "Recruitment",
        required: true,
        defaultEnabled: true,
        width: 32,
      },

      {
        key: "Recruitment",
        label: "Recruitment Name",
        group: "Recruitment",
        required: true,
        defaultEnabled: true,
        width: 32,
      },

      {
        key: "Roles",
        label: "Roles",
        group: "Recruitment",
        required: true,
        defaultEnabled: true,
        width: 40,
      },

      {
        key: "Eligible Branches",
        label: "Eligible Branches",
        group: "Recruitment",
        required: true,
        defaultEnabled: true,
        width: 40,
      },

      {
        key: "Status",
        label: "Registration Status",
        group: "Recruitment",
        required: true,
        defaultEnabled: true,
        width: 24,
      },

      {
        key: "Eligible Students",
        label: "Eligible Students",
        group: "Projection",
        defaultEnabled: true,
        excelType: "number",
      },

      {
        key: "Registered Students",
        label: "Registered Students",
        group: "Projection",
        defaultEnabled: true,
        excelType: "number",
      },

      {
        key: "Applications",
        label: "Applications",
        group: "Projection",
        excelType: "number",
      },

      {
        key: "Present",
        label: "Present",
        group: "Projection",
        defaultEnabled: true,
        excelType: "number",
      },

      {
        key: "Absent",
        label: "Absent",
        group: "Projection",
        defaultEnabled: true,
        excelType: "number",
      },

      {
        key: "Shortlisted",
        label: "Shortlisted",
        group: "Projection",
        defaultEnabled: true,
        excelType: "number",
      },

      {
        key: "Interviewed",
        label: "Interviewed",
        group: "Projection",
        defaultEnabled: true,
        excelType: "number",
      },

      {
        key: "Selected",
        label: "Selected",
        group: "Projection",
        defaultEnabled: true,
        excelType: "number",
      },

      {
        key: "Rejected",
        label: "Rejected",
        group: "Projection",
        defaultEnabled: true,
        excelType: "number",
      },
    ];

    return {
      title: "Recruitment Register",

      subtitle: "Operational Recruitment Register Export",

      sheetName: "Recruitment Register",

      filename: "Recruitment Register.xlsx",

      summary: [
        {
          label: "Recruitments",
          value: rows.length,
        },

        {
          label: "Eligible Students",
          value: rows.reduce((sum, row) => sum + (Number(row["Eligible Students"]) || 0), 0),
        },

        {
          label: "Registered Students",
          value: rows.reduce((sum, row) => sum + (Number(row["Registered Students"]) || 0), 0),
        },

        {
          label: "Selected",
          value: rows.reduce((sum, row) => sum + (Number(row["Selected"]) || 0), 0),
        },
      ],

      columns,

      rows,
    };
  },
};
