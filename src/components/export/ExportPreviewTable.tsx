import { useMemo } from "react";

import type { ExportConfiguration } from "@/services/export/exportTypes";

interface ExportPreviewTableProps<RowType = Record<string, unknown>> {
  configuration: ExportConfiguration<RowType>;

  selectedColumns: string[];
}

const PREVIEW_ROWS = 15;

export function ExportPreviewTable<RowType>({
  configuration,

  selectedColumns,
}: ExportPreviewTableProps<RowType>) {
  const {
    dataset,

    getCellValue,
  } = configuration;

  const previewRows = useMemo(
    () => dataset.rows.slice(0, PREVIEW_ROWS),

    [dataset.rows],
  );

  return (
    <div className="flex h-full flex-col rounded-2xl border bg-card">
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold">Preview</h2>

          <p className="text-sm text-muted-foreground">
            Showing first {previewRows.length} of {dataset.rows.length} records
          </p>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-x-auto">
        <div className="h-full overflow-y-auto">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 z-20 bg-background shadow-sm">
              <tr>
                {selectedColumns.map((column) => (
                  <th
                    key={column}

                    className="whitespace-nowrap border-b bg-background px-4 py-3 text-left font-semibold"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {previewRows.map((row, rowIndex) => (
                <tr
                  key={rowIndex}

                  className="border-b transition hover:bg-muted/40"
                >
                  {selectedColumns.map((column) => (
                    <td
                      title={String(
                        getCellValue(
                          row,

                          column,
                        ) ?? "",
                      )}
                      key={column}

                      className="max-w-xs truncate whitespace-nowrap px-4 py-3 align-top"
                    >
                      {String(
                        getCellValue(
                          row,

                          column,
                        ) ?? "",
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
