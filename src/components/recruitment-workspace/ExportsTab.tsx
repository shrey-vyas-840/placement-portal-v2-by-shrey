import { useEffect, useMemo, useState } from "react";

import {
  DndContext,
  PointerSensor,
  closestCenter,
  DragOverlay,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";

import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

import { Download, FileSpreadsheet, GripVertical, ListFilter, ArrowUpDown } from "lucide-react";

import { recruitmentExportService } from "@/services/recruitmentExportService";
import { recruitmentExcelExportService } from "@/services/recruitmentExcelExportService";

interface Props {
  opportunityId: string | null;
}

function SortableColumnHandle({ column }: { column: string }) {
  const {
  attributes,
  listeners,
  setNodeRef,
  transform,
  transition,
  isDragging,
} = useSortable({
  id: column,
});

  return (
    <button
 style={{
  transform: CSS.Transform.toString(transform),
  transition:
    transition ??
    "transform 180ms cubic-bezier(0.2,0,0,1)",
  opacity: isDragging ? 0.35 : 1,
}}
      ref={setNodeRef}
      type="button"
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing"
    >
      <GripVertical className="h-5 w-5 text-muted-foreground" />
    </button>
  );
}

export function ExportsTab({ opportunityId }: Props) {
  const [loading, setLoading] = useState(true);

  const [exportData, setExportData] = useState<any>(null);

  const [enabledColumns, setEnabledColumns] = useState<string[]>([]);

  const [columnOrder, setColumnOrder] = useState<string[]>([]);

  const [editorMode, setEditorMode] = useState<"select" | "arrange">("select");

  const [activeColumn, setActiveColumn] = useState<string | null>(null);

  const [exportingExcel, setExportingExcel] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor));

  function handleDragStart(
  event: DragStartEvent,
) {

  setActiveColumn(
    String(event.active.id),
  );

}

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = columnOrder.indexOf(String(active.id));

    const newIndex = columnOrder.indexOf(String(over.id));

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    setColumnOrder(arrayMove(columnOrder, oldIndex, newIndex));
  }

  useEffect(() => {
    async function load() {
      if (!opportunityId) {
        setLoading(false);
        return;
      }

      setLoading(true);

      const result = await recruitmentExportService.getRecruitmentExportData(opportunityId);

      setExportData(result);

      setLoading(false);
    }

    load();
  }, [opportunityId]);

  const allColumns = useMemo(() => {
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
    if (allColumns.length && columnOrder.length === 0) {
      setColumnOrder(allColumns);

      setEnabledColumns(allColumns);
    }
  }, [allColumns, columnOrder.length]);

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
          <h2 className="text-xl font-semibold">Export Summary</h2>

          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Company</span>

              <span className="font-medium">{exportData.companyName}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Applicants</span>

              <span className="font-medium">{exportData.rows.length}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Dynamic Questions</span>

              <span className="font-medium">{exportData.dynamicQuestions.length}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Export Columns</span>

              <span className="font-medium">{enabledColumns.length}</span>
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

                    columnOrder.filter((column) => enabledColumns.includes(column)),
                  );
                } finally {
                  setExportingExcel(false);
                }
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              <FileSpreadsheet className="h-5 w-5" />

              {exportingExcel ? "Generating..." : "Export Excel"}
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 rounded-2xl border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Export Columns</h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Configure which columns appear in Excel.
              </p>
            </div>

            <div className="flex rounded-xl border overflow-hidden">
              <button
                type="button"
                onClick={() => setEditorMode("select")}
                className={`flex items-center gap-2 px-4 py-2 text-sm transition ${
                  editorMode === "select" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
              >
                <ListFilter className="h-4 w-4" />
                Select Columns
              </button>

              <button
                type="button"
                onClick={() => setEditorMode("arrange")}
                className={`flex items-center gap-2 px-4 py-2 text-sm transition ${
                  editorMode === "arrange" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
              >
                <ArrowUpDown className="h-4 w-4" />
                Arrange Order
              </button>
            </div>
          </div>

          <div className="mt-6">
            {editorMode === "select" ? (
              <div className="grid gap-3 md:grid-cols-2">
                {allColumns.map((column) => {
                  const locked = column === "Enrollment No" || column === "Student Name";

                  const enabled = enabledColumns.includes(column);

                  return (
                    <label
                      key={column}
                      className={`flex items-center gap-3 rounded-xl border p-3 transition ${
                        locked ? "border-primary bg-primary/5" : "hover:bg-muted"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={enabled}
                        disabled={locked}
                        onChange={(e) => {
                          if (locked) {
                            return;
                          }

                          if (e.target.checked) {
                            setEnabledColumns((previous) => [...previous, column]);
                          } else {
                            setEnabledColumns((previous) =>
                              previous.filter((value) => value !== column),
                            );
                          }
                        }}
                      />

                      <span className="flex-1 text-sm">{column}</span>

                      {locked && <span className="text-xs text-primary font-medium">Required</span>}
                    </label>
                  );
                })}
              </div>
            ) : (
             <DndContext
  sensors={sensors}
  collisionDetection={closestCenter}
  onDragStart={handleDragStart}
  onDragEnd={(event) => {

    handleDragEnd(event);

    setActiveColumn(null);

  }}
>
                <SortableContext
                  items={columnOrder.filter((column) => enabledColumns.includes(column))}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {columnOrder
                      .filter((column) => enabledColumns.includes(column))
                      .map((column) => {
                        const locked = column === "Enrollment No" || column === "Student Name";

                        return (
                          <div
                            key={column}
                            className={`flex items-center gap-3 rounded-xl border p-3 ${
                              locked ? "border-primary bg-primary/5" : ""
                            }`}
                          >
                            {locked ? (
                              <GripVertical className="h-5 w-5 text-muted-foreground opacity-40" />
                            ) : (
                              <SortableColumnHandle column={column} />
                            )}

                            <span className="flex-1 text-sm">{column}</span>

                            {locked && (
                              <span className="text-xs font-medium text-primary">Required</span>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </SortableContext>

            <DragOverlay
  dropAnimation={{
    duration: 220,
    easing: "cubic-bezier(0.2, 0, 0, 1)",
  }}
>

  {activeColumn ? (

    <div
      className="flex w-[600px] items-center gap-3 rounded-xl border bg-background px-4 py-3 shadow-2xl"
      style={{
        transform: "rotate(2deg)",
      }}
    >

      <GripVertical className="h-5 w-5 text-primary flex-shrink-0" />

      <span className="flex-1 truncate text-sm font-medium">

        {activeColumn}

      </span>

    </div>

  ) : null}

</DragOverlay>

              </DndContext>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Preview</h2>

          <div className="text-sm text-muted-foreground">
            Showing first {Math.min(exportData.rows.length, 10)} of {exportData.rows.length}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b bg-muted/50">
                {columnOrder
                  .filter((column: string) => enabledColumns.includes(column))
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
              {exportData.rows.slice(0, 10).map((row: any, index: number) => (
                <tr key={index} className="border-b">
                  {columnOrder
                    .filter((column: string) => enabledColumns.includes(column))
                    .map((column) => {
                      let value = "";

                      switch (column) {
                        case "Enrollment No":
                          value = row.enrollmentNumber;
                          break;

                        case "Student Name":
                          value = row.studentName;
                          break;

                        case "Institute Email":
                          value = row.instituteEmail;
                          break;

                        case "Personal Email":
                          value = row.personalEmail;
                          break;

                        case "Contact Number":
                          value = row.contactNumber;
                          break;

                        case "Alternate Contact Number":
                          value = row.alternateContactNumber;
                          break;

                        case "Gender":
                          value = row.gender;
                          break;

                        case "Date of Birth":
                          value = row.dateOfBirth;
                          break;

                        case "Placement Preference":
                          value = row.placementPreference;
                          break;

                        case "Placement Status":
                          value = row.placementStatus;
                          break;

                        case "Institute":
                          value = row.institute;
                          break;

                        case "Degree":
                          value = row.degree;
                          break;

                        case "Branch":
                          value = row.branch;
                          break;

                        case "Semester":
                          value = row.semester ?? "";
                          break;

                        case "CGPA":
                          value = row.cgpa ?? "";
                          break;

                        case "10th Percentage":
                          value = row.tenthPercentage ?? "";
                          break;

                        case "12th Percentage":
                          value = row.twelfthPercentage ?? "";
                          break;

                        case "Diploma Percentage":
                          value = row.diplomaPercentage ?? "";
                          break;

                        case "Active Backlogs":
                          value = row.activeBacklogs ?? "";
                          break;

                        case "Year Gap":
                          value = row.yearGapCount ?? "";
                          break;

                        case "Graduation Year":
                          value = row.graduationYear ?? "";
                          break;

                        case "Technical Skills":
                          value = row.technicalSkills;
                          break;

                        case "Programming Languages":
                          value = row.programmingLanguages;
                          break;

                        case "Tools & Technologies":
                          value = row.toolsAndTechnologies;
                          break;

                        case "GitHub":
                          value = row.github;
                          break;

                        case "LinkedIn":
                          value = row.linkedin;
                          break;

                        case "Portfolio":
                          value = row.portfolio;
                          break;

                        case "Strengths":
                          value = row.strengths;
                          break;

                        case "Profile Score":
                          value = row.profileScore ?? "";
                          break;

                        case "Application Status":
                          value = row.applicationStatus;
                          break;

                        case "Applied At":
                          value = row.appliedAt;
                          break;

                        case "Remarks":
                          value = row.remarks;
                          break;

                        case "Applied Roles":
                          value = row.appliedRoles;
                          break;

                        default:
                          value = row.answers?.[column] ?? "";
                      }

                      return (
                        <td key={column} className="max-w-xs whitespace-nowrap px-4 py-3 text-sm">
                          {String(value)}
                        </td>
                      );
                    })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
