import { useEffect, useMemo, useState } from "react";

import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";

import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

import {
  Download,
  FileSpreadsheet,
  FileText,
} from "lucide-react";

import { recruitmentExportService } from "@/services/recruitmentExportService";
import { recruitmentExcelExportService } from "@/services/recruitmentExcelExportService";

interface Props {
  opportunityId: string | null;
}

function SortableColumn({

  column,

  locked,

  selected,

  onToggle,

}: {

  column: string;

  locked: boolean;

  selected: boolean;

  onToggle: (
    checked: boolean,
  ) => void;

}) {

  const {

    attributes,

    listeners,

    setNodeRef,

    transform,

    transition,

  } = useSortable({

    id: column,

  });

  return (

    <label

      ref={setNodeRef}

      style={{

        transform:
          CSS.Transform.toString(
            transform,
          ),

        transition,

      }}

      {...attributes}

      {...listeners}

      className={`flex cursor-move items-center gap-3 rounded-xl border p-3 transition ${
        locked
          ? "border-primary bg-primary/5"
          : "hover:bg-muted"
      }`}

    >

      <input

        type="checkbox"

        checked={selected}

        disabled={locked}

        onChange={(e) =>
          onToggle(
            e.target.checked,
          )
        }

      />

      <span className="flex-1 text-sm">

        {column}

        {locked && (

          <span className="ml-2 text-xs text-primary">

            (Required)

          </span>

        )}

      </span>

    </label>

  );

}

export function ExportsTab({
  opportunityId,
}: Props) {

  const [loading, setLoading] =
    useState(true);

  const [exportData, setExportData] =
    useState<any>(null);

  const [selectedColumns, setSelectedColumns] =
    useState<string[]>([]);

  const [exportingExcel, setExportingExcel] =
    useState(false);

  const [exportingCsv, setExportingCsv] =
    useState(false);

    const sensors =
  useSensors(
    useSensor(
      PointerSensor,
    ),
  );

function handleDragEnd(
  event: DragEndEvent,
) {

  const {
    active,
    over,
  } = event;

  if (
    !over ||
    active.id === over.id
  ) {
    return;
  }

  const oldIndex =
    selectedColumns.indexOf(
      String(active.id),
    );

  const newIndex =
    selectedColumns.indexOf(
      String(over.id),
    );

  if (
    oldIndex === -1 ||
    newIndex === -1
  ) {
    return;
  }

  setSelectedColumns(
    arrayMove(
      selectedColumns,
      oldIndex,
      newIndex,
    ),
  );

}

  useEffect(() => {

    async function load() {

      if (!opportunityId) {
        setLoading(false);
        return;
      }

      setLoading(true);

      const result =
        await recruitmentExportService.getRecruitmentExportData(
          opportunityId,
        );

      setExportData(result);

      setLoading(false);

    }

    load();

  }, [opportunityId]);

  const allColumns =
    useMemo(() => {

      if (!exportData) {
        return [];
      }

      return [

        "Enrollment No",

        "Student Name",

        "Institute Email",

        "Personal Email",

        "Contact Number",

        "Alternate Contact Number",

        "Gender",

        "Date of Birth",

        "Placement Preference",

        "Placement Status",

        "Institute",

        "Degree",

        "Branch",

        "Semester",

        "CGPA",

        "10th Percentage",

        "12th Percentage",

        "Diploma Percentage",

        "Active Backlogs",

        "Year Gap",

        "Graduation Year",

        "Technical Skills",

        "Programming Languages",

        "Tools & Technologies",

        "GitHub",

        "LinkedIn",

        "Portfolio",

        "Strengths",

        "Profile Score",

        "Application Status",

        "Applied At",

        "Remarks",

        "Applied Roles",

        ...exportData.dynamicQuestions,

      ];

    }, [exportData]);

  useEffect(() => {

    if (
      allColumns.length &&
      selectedColumns.length === 0
    ) {

      setSelectedColumns(allColumns);

    }

  }, [
    allColumns,
    selectedColumns.length,
  ]);

  if (!opportunityId) {

    return (

      <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">

        Recruitment has not been published yet.

      </div>

    );

  }

  if (loading) {

    return (

      <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">

        Loading export center...

      </div>

    );

  }

  return (

    <div className="space-y-6">

              <div className="grid gap-6 lg:grid-cols-3">

        <div className="rounded-2xl border bg-card p-6">

          <h2 className="text-xl font-semibold">
            Export Summary
          </h2>

          <div className="mt-6 space-y-4">

            <div className="flex items-center justify-between">

              <span className="text-muted-foreground">
                Company
              </span>

              <span className="font-medium">
                {exportData.companyName}
              </span>

            </div>

            <div className="flex items-center justify-between">

              <span className="text-muted-foreground">
                Applicants
              </span>

              <span className="font-medium">
                {exportData.rows.length}
              </span>

            </div>

            <div className="flex items-center justify-between">

              <span className="text-muted-foreground">
                Dynamic Questions
              </span>

              <span className="font-medium">
                {exportData.dynamicQuestions.length}
              </span>

            </div>

            <div className="flex items-center justify-between">

              <span className="text-muted-foreground">
                Export Columns
              </span>

              <span className="font-medium">
                {selectedColumns.length}
              </span>

            </div>

          </div>

          <div className="mt-8 space-y-3">

           <button
  type="button"
  disabled={exportingExcel}
  onClick={async () => {

    if (!exportData) {
      return;
    }

    try {

      setExportingExcel(true);

      await recruitmentExcelExportService.export(

        exportData,

        selectedColumns,

      );

    } finally {

      setExportingExcel(false);

    }

  }}
  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
>

  <FileSpreadsheet className="h-5 w-5" />

  {exportingExcel
    ? "Generating..."
    : "Export Excel"}

</button>

            <button
              type="button"
              disabled={exportingCsv}
              className="flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 transition hover:bg-muted"
            >

              <FileText className="h-5 w-5" />

              Export CSV

            </button>

          </div>

        </div>

        <div className="lg:col-span-2 rounded-2xl border bg-card p-6">

          <h2 className="text-xl font-semibold">
            Export Columns
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Enrollment Number and Student Name are always included.
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-2">

                  <DndContext

  sensors={sensors}

  collisionDetection={closestCenter}

  onDragEnd={handleDragEnd}

>

  <SortableContext

    items={selectedColumns}

    strategy={
      verticalListSortingStrategy
    }

  >

    {selectedColumns.map(
      (column) => {

        const locked =
          column ===
            "Enrollment No" ||
          column ===
            "Student Name";

        return (

          <SortableColumn

            key={column}

            column={column}

            locked={locked}

            selected={true}

            onToggle={(
              checked,
            ) => {

              if (
                locked
              ) {
                return;
              }

              if (
                checked
              ) {
                return;
              }

              setSelectedColumns(
                (
                  previous,
                ) =>
                  previous.filter(
                    (
                      value,
                    ) =>
                      value !==
                      column,
                  ),
              );

            }}

          />

        );

      },
    )}

  </SortableContext>

</DndContext>

<div className="md:col-span-2 border-t pt-4">

  <h3 className="mb-3 text-sm font-medium">

    Available Columns

  </h3>

  <div className="grid gap-3 md:grid-cols-2">

    {allColumns

      .filter(
        (
          column,
        ) =>
          !selectedColumns.includes(
            column,
          ),
      )

      .map(
        (
          column,
        ) => (

          <label
            key={column}
            className="flex items-center gap-3 rounded-xl border p-3 hover:bg-muted"
          >

            <input
              type="checkbox"
              checked={false}
              onChange={() => {

                setSelectedColumns(
                  (
                    previous,
                  ) => [

                    ...previous,

                    column,

                  ],
                );

              }}
            />

            <span className="text-sm">

              {column}

            </span>

          </label>

        ),
      )}

  </div>

</div>

          </div>

        </div>

      </div>

            <div className="rounded-2xl border bg-card p-6">

        <div className="mb-5 flex items-center justify-between">

          <h2 className="text-xl font-semibold">
            Preview
          </h2>

          <div className="text-sm text-muted-foreground">
            Showing first{" "}
            {Math.min(
              exportData.rows.length,
              10,
            )}{" "}
            of {exportData.rows.length}
          </div>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full border-collapse">

            <thead>

              <tr className="border-b bg-muted/50">

                {selectedColumns
                  .slice(0, 8)
                  .map((column) => (

                    <th
                      key={column}
                      className="whitespace-nowrap px-4 py-3 text-left text-sm font-semibold"
                    >
                      {column}
                    </th>

                  ))}

              </tr>

            </thead>

            <tbody>

              {exportData.rows
                .slice(0, 10)
                .map(
                  (
                    row: any,
                    index: number,
                  ) => (

                    <tr
                      key={index}
                      className="border-b"
                    >

                      {selectedColumns
                        .slice(0, 8)
                        .map((column) => {

                          switch (column) {

                            case "Enrollment No":
                              return (
                                <td
                                  key={column}
                                  className="px-4 py-3"
                                >
                                  {row.enrollmentNumber}
                                </td>
                              );

                            case "Student Name":
                              return (
                                <td
                                  key={column}
                                  className="px-4 py-3"
                                >
                                  {row.studentName}
                                </td>
                              );

                            case "Institute Email":
                              return (
                                <td
                                  key={column}
                                  className="px-4 py-3"
                                >
                                  {row.instituteEmail}
                                </td>
                              );

                            case "Personal Email":
                              return (
                                <td
                                  key={column}
                                  className="px-4 py-3"
                                >
                                  {row.personalEmail}
                                </td>
                              );

                            case "Contact Number":
                              return (
                                <td
                                  key={column}
                                  className="px-4 py-3"
                                >
                                  {row.contactNumber}
                                </td>
                              );

                            case "Institute":
                              return (
                                <td
                                  key={column}
                                  className="px-4 py-3"
                                >
                                  {row.institute}
                                </td>
                              );

                            case "Branch":
                              return (
                                <td
                                  key={column}
                                  className="px-4 py-3"
                                >
                                  {row.branch}
                                </td>
                              );

                            case "Applied Roles":
                              return (
                                <td
                                  key={column}
                                  className="px-4 py-3"
                                >
                                  {row.appliedRoles}
                                </td>
                              );

                            default:

                              return (
                                <td
                                  key={column}
                                  className="px-4 py-3"
                                >
                                  {row.answers?.[
                                    column
                                  ] ??
                                    ""}
                                </td>
                              );

                          }

                        })}

                    </tr>

                  ),
                )}

            </tbody>

          </table>

        </div>

      </div>

    </div>

  );

}