import { useMemo, useState } from "react";

import { ChevronDown, ChevronRight, Search } from "lucide-react";

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

  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const filteredColumns = useMemo(() => {
    return columns.filter((column) =>
      column.label

        .toLowerCase()

        .includes(search.toLowerCase()),
    );
  }, [columns, search]);

  const groupedColumns = useMemo(() => {
    const groups = new Map<string, ExportColumn[]>();

    filteredColumns.forEach((column) => {
      const group = column.group ?? "General";

      if (!groups.has(group)) {
        groups.set(group, []);
      }

      groups.get(group)!.push(column);
    });

    return [...groups.entries()];
  }, [filteredColumns]);

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

  function toggleGroup(group: string) {
    setCollapsedGroups((previous) => ({
      ...previous,

      [group]: !previous[group],
    }));
  }

  function selectGroup(columns: ExportColumn[]) {
    const next = [...selectedColumns];

    columns.forEach((column) => {
      if (!next.includes(column.key)) {
        next.push(column.key);
      }
    });

    onChange(next);
  }

  function clearGroup(columns: ExportColumn[]) {
    const removable = columns

      .filter((column) => !column.required)

      .map((column) => column.key);

    onChange(selectedColumns.filter((column) => !removable.includes(column)));
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

      <div className="space-y-6">
        {groupedColumns.length === 0 && (
          <div className="flex h-40 items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
            No columns found.
          </div>
        )}
        {groupedColumns.length > 0 && groupedColumns.map(([group, columns]) => (
          <div key={group}>
            <div className="mb-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleGroup(group)}
                className="flex flex-1 items-center gap-2 rounded-lg px-2 py-2 text-left text-sm font-semibold uppercase tracking-wide text-muted-foreground transition hover:bg-muted/40"
              >
                {collapsedGroups[group] ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}

                <span>{group}</span>

                <span className="ml-auto rounded-full bg-muted px-2 py-1 text-xs">
                  {columns.filter((column) => selectedColumns.includes(column.key)).length}/
                  {columns.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => selectGroup(columns)}
                className="rounded-md border px-2 py-1 text-xs"
              >
                All
              </button>

              <button
                type="button"
                onClick={() => clearGroup(columns)}
                className="rounded-md border px-2 py-1 text-xs"
              >
                None
              </button>
            </div>

            {!collapsedGroups[group] && (
              <div className="grid gap-3 md:grid-cols-2">
                {columns.map((column) => {
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
                        <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
                          Required
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
