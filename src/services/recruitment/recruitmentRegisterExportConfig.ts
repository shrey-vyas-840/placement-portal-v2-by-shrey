import type {
  ExportConfiguration,
  ExportDataset,
} from "@/services/export/exportTypes";

import type { RecruitmentRegisterExportRow } from "@/services/recruitmentRegisterExportService";

export function buildRecruitmentRegisterExportConfiguration(
  dataset: ExportDataset<RecruitmentRegisterExportRow>,
): ExportConfiguration<RecruitmentRegisterExportRow> {
  return {
    dataset,

    showSearch: false,

    showGlobalSelect: false,

    getCellValue(row, column) {
      return row[column];
    },

    getCellStyle() {
      return {
        wrapText: true,
      };
    },
  };
}