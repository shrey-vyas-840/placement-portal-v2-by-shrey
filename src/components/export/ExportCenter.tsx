import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";

import type { ExportConfiguration } from "@/services/export/exportTypes";

import { exportExcelBuilder } from "@/services/export/exportExcelBuilder";

import { ExportSummaryCard } from "./ExportSummaryCard";
import { ExportColumnSelector } from "./ExportColumnSelector";
import { ExportColumnSorter } from "./ExportColumnSorter";
import { ExportPreviewTable } from "./ExportPreviewTable";

interface ExportCenterProps<RowType = Record<string, unknown>> {
  configuration: ExportConfiguration<RowType>;

  children?: React.ReactNode;
}

type ActiveTab = "columns" | "order";

export function ExportCenter<RowType>({
  configuration,

  children,
}: ExportCenterProps<RowType>) {
  const { dataset } = configuration;

  const storageKey = `export-layout-${dataset.sheetName}`;

  const [exporting, setExporting] = useState(false);

  const [activeTab, setActiveTab] = useState<ActiveTab>("columns");

  const defaultColumns = dataset.columns

    .filter((column) => column.defaultEnabled || column.required)

    .map((column) => column.key);

  const [selectedColumns, setSelectedColumns] = useState(defaultColumns);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);

    if (!saved) {
      return;
    }

    try {
      const parsed = JSON.parse(saved);

      if (Array.isArray(parsed) && parsed.length) {
        setSelectedColumns(parsed);
      }
    } catch {
      // Ignore corrupted layouts
    }
  }, [storageKey]);

  const summary = useMemo(
    () => [
      ...dataset.summary,

      {
        label: "Selected Columns",

        value: selectedColumns.length,
      },

      {
        label: "Available Columns",

        value: dataset.columns.length,
      },
    ],

    [dataset.summary, dataset.columns, selectedColumns],
  );

  function resetToDefaults() {

    setSelectedColumns(

        dataset.columns

            .filter(

                (column) =>

                    column.defaultEnabled ||

                    column.required,

            )

            .map(

                (column) => column.key,

            ),

    );

}

  async function handleExport() {
    try {
      setExporting(true);

      await exportExcelBuilder.export(
        configuration,

        selectedColumns,
      );
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-4">
      <ExportSummaryCard
        title="Export Summary"

        summary={summary}

        exporting={exporting}

        onExport={handleExport}
      >
        {children}
      </ExportSummaryCard>

      <div className="lg:col-span-3 rounded-2xl border bg-card">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold">Export Configuration</h2>

            <p className="text-sm text-muted-foreground">Choose columns and arrange their order.</p>
          </div>

          <div className="flex flex-wrap gap-2">

    <Button

        size="sm"

        variant={
            activeTab === "columns"
                ? "default"
                : "outline"
        }

        onClick={() =>
            setActiveTab("columns")
        }

    >

        Select Columns

    </Button>

    <Button

        size="sm"

        variant={
            activeTab === "order"
                ? "default"
                : "outline"
        }

        onClick={() =>
            setActiveTab("order")
        }

    >

        Arrange Order

    </Button>

    <Button

        size="sm"

        variant="secondary"

        onClick={resetToDefaults}

    >

        Reset Defaults

    </Button>

</div>

        </div>

        <div className="p-6">
          {activeTab === "columns" ? (
            <ExportColumnSelector
              columns={dataset.columns}

              selectedColumns={selectedColumns}

              onChange={setSelectedColumns}
            />
          ) : (
            <ExportColumnSorter
              selectedColumns={selectedColumns}

              onChange={setSelectedColumns}
            />
          )}
        </div>

        <div className="border-t p-6">
          <ExportPreviewTable
            configuration={configuration}

            selectedColumns={selectedColumns}
          />
        </div>
      </div>
    </div>
  );
}
