import { useMemo, useState } from "react";

import { Search } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";

import { Input } from "@/components/ui/input";

import type { ExportColumn } from "@/services/export/exportTypes";

interface ExportColumnSelectorProps {
  columns: ExportColumn[];

  selectedColumns: string[];

  onChange: (columns: string[]) => void;
}

export function ExportColumnSelector({
  columns,

  selectedColumns,

  onChange,
}: ExportColumnSelectorProps) {
  const [search, setSearch] = useState("");

  const filteredColumns = useMemo(() => {
    return columns.filter((column) =>
      column.label

        .toLowerCase()

        .includes(search.toLowerCase()),
    );
  }, [columns, search]);

  function toggleColumn(
    column: ExportColumn,

    checked: boolean,
  ) {
    if (column.required) {
      return;
    }

    if (checked) {
      if (selectedColumns.includes(column.key)) {
        return;
      }

      onChange([...selectedColumns, column.key]);

      return;
    }

    onChange(selectedColumns.filter((item) => item !== column.key));
  }

  function selectAll() {
    onChange(columns.map((column) => column.key));
  }

  function clearAll() {
    onChange(
      columns

        .filter((column) => column.required)

        .map((column) => column.key),
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

          <Input
            className="pl-10"

            placeholder="Search columns..."

            value={search}

            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <button
          type="button"

          onClick={selectAll}

          className="rounded-lg border px-4 py-2 text-sm"
        >
          Select All
        </button>

        <button
          type="button"

          onClick={clearAll}

          className="rounded-lg border px-4 py-2 text-sm"
        >
          Clear
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {filteredColumns.map((column) => {
          const checked = selectedColumns.includes(column.key);

          return (
            <div
              key={column.key}

              className="flex items-center justify-between rounded-xl border p-4 transition hover:border-primary"
            >
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={checked}

                  disabled={column.required}

                  onCheckedChange={(value) =>
                    toggleColumn(
                      column,

                      Boolean(value),
                    )
                  }
                />

                <span>{column.label}</span>
              </div>

              {column.required && (
                <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                  Required
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
