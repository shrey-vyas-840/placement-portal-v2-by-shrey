import { recruitmentRegisterService } from "./recruitmentRegisterService";

export interface RecruitmentRegisterExportRow {
  [key: string]: any;
}

export interface RecruitmentRegisterExportData {
  rows: RecruitmentRegisterExportRow[];
}

export const recruitmentRegisterExportService = {
  async getRecruitmentRegisterExportData(): Promise<RecruitmentRegisterExportData> {
    const rows = await recruitmentRegisterService.getRecruitments();

    return {
      rows,
    };
  },
};