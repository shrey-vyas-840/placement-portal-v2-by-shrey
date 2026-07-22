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

type ActiveTab = "configure" | "preview";

type ConfigureTab = "columns" | "order";

export function ExportCenter<RowType>({
  configuration,

  children,
}: ExportCenterProps<RowType>) {
  const { dataset } = configuration;

  const storageKey = `export-layout-${dataset.sheetName}`;

  const [exporting, setExporting] = useState(false);

  const [activeTab, setActiveTab] = useState<ActiveTab>("configure");

  const [configureTab, setConfigureTab] = useState<ConfigureTab>("columns");

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

        .filter((column) => column.defaultEnabled || column.required)

        .map((column) => column.key),
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
    <div className="grid h-[82vh] gap-6 lg:grid-cols-4">
      <ExportSummaryCard
        title="Export Summary"

        summary={summary}

        exporting={exporting}

        onExport={handleExport}
      >
        {children}
      </ExportSummaryCard>

      <div className="lg:col-span-3 flex h-full flex-col overflow-hidden rounded-2xl border bg-card">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold">
              {activeTab === "configure" ? "Export Configuration" : "Preview"}
            </h2>

            <p className="text-sm text-muted-foreground">
              {activeTab === "configure"
                ? "Choose columns and arrange their order."
                : "Review the final exported spreadsheet."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={activeTab === "configure" ? "default" : "outline"}
              onClick={() => setActiveTab("configure")}
            >
              Configure
            </Button>

            <Button
              size="sm"
              variant={activeTab === "preview" ? "default" : "outline"}
              onClick={() => setActiveTab("preview")}
            >
              Preview
            </Button>

            <Button size="sm" variant="secondary" onClick={resetToDefaults}>
              Reset Defaults
            </Button>
          </div>
        </div>

        {activeTab === "configure" ? (
          <>
            <div className="border-b px-6 py-3">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={configureTab === "columns" ? "default" : "outline"}
                  onClick={() => setConfigureTab("columns")}
                >
                  Select Columns
                </Button>

                <Button
                  size="sm"
                  variant={configureTab === "order" ? "default" : "outline"}
                  onClick={() => setConfigureTab("order")}
                >
                  Arrange Order
                </Button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-6">
              {configureTab === "columns" ? (
           <ExportColumnSelector
    columns={dataset.columns}
    selectedColumns={selectedColumns}
    onChange={setSelectedColumns}
    showSearch={configuration.showSearch ?? true}
    showGlobalSelect={configuration.showGlobalSelect ?? true}
/>
              ) : (
                <ExportColumnSorter
                  selectedColumns={selectedColumns}
                  onChange={setSelectedColumns}
                />
              )}
            </div>
          </>
        ) : (
          <div className="min-h-0 flex-1 p-6">
            <ExportPreviewTable configuration={configuration} selectedColumns={selectedColumns} />
          </div>
        )}
      </div>
    </div>
  );
}
