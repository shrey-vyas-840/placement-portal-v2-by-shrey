export interface ExportColumn {
  key: string;

  label: string;

  group?: string;

  required?: boolean;

  defaultEnabled?: boolean;

  width?: number;

  alignment?: "left" | "center" | "right";

  excelType?: "text" | "number" | "date" | "email" | "url" | "phone";
}

export interface ExportDataset<RowType = Record<string, unknown>> {
  title: string;

  subtitle?: string;

  sheetName: string;

  filename: string;

  summary: {
    label: string;

    value: string | number;
  }[];

  columns: ExportColumn[];

  rows: RowType[];
}

export interface ExportConfiguration<RowType = Record<string, unknown>> {
  dataset: ExportDataset<RowType>;

  showSearch?: boolean;

  showGlobalSelect?: boolean;

  getCellValue: (
    row: RowType,

    columnKey: string,
  ) => unknown;

  getCellStyle?: (value: unknown) => {
    hyperlink?: string;

    wrapText?: boolean;
  };
}
