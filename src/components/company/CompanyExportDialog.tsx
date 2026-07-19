import { useEffect, useMemo, useState } from "react";

import { companyExportService, type CompanyExportRow } from "@/services/companyExportService";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";

import { Checkbox } from "@/components/ui/checkbox";

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

import { GripVertical } from "lucide-react";

interface CompanyExportDialogProps {
  open: boolean;

  onOpenChange: (open: boolean) => void;

  totalCompanies: number;
}

interface SortableColumnItemProps {
  column: string;
}

function SortableColumnItem({ column }: SortableColumnItemProps) {
  const {
    attributes,

    listeners,

    setNodeRef,

    transform,

    transition,
  } = useSortable({
    id: column,
  });

  const style = {
    transform: CSS.Transform.toString(transform),

    transition,
  };

  return (
    <div
      ref={setNodeRef}

      style={style}

      {...attributes}

      className="flex items-center justify-between rounded-xl border bg-background p-3"
    >
      <div className="flex items-center gap-3">
        <GripVertical
          className="h-4 w-4 cursor-grab text-muted-foreground"

          {...listeners}
        />

        <span>{column}</span>
      </div>
    </div>
  );
}

export function CompanyExportDialog({
  open,

  onOpenChange,

  totalCompanies,
}: CompanyExportDialogProps) {
  const [additionalRecruiters, setAdditionalRecruiters] = useState(0);

  const [rows, setRows] = useState<CompanyExportRow[]>([]);

  const [loading, setLoading] = useState(false);

  const [showArrangeMode, setShowArrangeMode] = useState(false);

  const [selectedColumns, setSelectedColumns] = useState<string[]>([
    "Company Name",
    "Primary HR Name",
    "Primary HR Contact",
  ]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
  );

  useEffect(() => {
    if (!open) return;

    let mounted = true;

    async function load() {
      setLoading(true);

      try {
        const exportData = await companyExportService.getCompanyExportData();

        if (mounted) {
          setRows(exportData.rows);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [open]);

  const availableColumns = useMemo(() => {
    const columns = [
      {
        key: "Company Name",
        required: true,
      },

      {
        key: "Primary HR Name",
        required: true,
      },

      {
        key: "Primary HR Contact",
        required: true,
      },

      {
        key: "Primary HR Email",
      },

      {
        key: "Primary HR Position",
      },

      {
        key: "Website",
      },

      {
        key: "Industry",
      },

      {
        key: "Hiring Location",
      },

      {
        key: "Company Size",
      },

      {
        key: "Description",
      },

      {
        key: "Past Recruitment Count",
      },
    ];

    for (let recruiter = 1; recruiter <= additionalRecruiters; recruiter++) {
      columns.push(
        {
          key: `Recruiter ${recruiter} Name`,
        },

        {
          key: `Recruiter ${recruiter} Email`,
        },

        {
          key: `Recruiter ${recruiter} Contact`,
        },

        {
          key: `Recruiter ${recruiter} Position`,
        },
      );
    }

    return columns;
  }, [additionalRecruiters]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    setSelectedColumns((previous) => {
      const oldIndex = previous.indexOf(active.id as string);

      const newIndex = previous.indexOf(over.id as string);

      return arrayMove(previous, oldIndex, newIndex);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Company Export Center</DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border bg-card p-6">
            <h2 className="text-xl font-semibold">Export Summary</h2>

            <div className="mt-6 space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Companies</span>

                <span className="font-medium">{totalCompanies}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Additional Recruiters</span>

                <input
                  type="number"
                  min={0}
                  value={additionalRecruiters}
                  onChange={(e) => setAdditionalRecruiters(Number(e.target.value))}
                  className="w-20 rounded-lg border px-2 py-1 text-right"
                />
              </div>
            </div>

            <div className="mt-8">
              <Button disabled className="w-full">
                Export Excel
              </Button>
            </div>
          </div>

          <div className="lg:col-span-2 rounded-2xl border bg-card">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold">Export Columns</h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Configure which columns appear in Excel.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={!showArrangeMode ? "default" : "outline"}
                  onClick={() => setShowArrangeMode(false)}
                >
                  Select Columns
                </Button>

                <Button
                  size="sm"
                  variant={showArrangeMode ? "default" : "outline"}
                  onClick={() => setShowArrangeMode(true)}
                >
                  Arrange Order
                </Button>
              </div>
            </div>

            <div className="h-[520px] overflow-auto p-6">
              {!showArrangeMode ? (
                <div className="grid grid-cols-2 gap-3">
                  {availableColumns.map((column) => {
                    const checked = selectedColumns.includes(column.key);

                    return (
                      <div
                        key={column.key}
                        className="flex items-center justify-between rounded-xl border p-3"
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={checked}
                            disabled={column.required}
                            onCheckedChange={(value) => {
                              if (column.required) return;

                              if (value) {
                                setSelectedColumns((previous) => [...previous, column.key]);
                              } else {
                                setSelectedColumns((previous) =>
                                  previous.filter((item) => item !== column.key),
                                );
                              }
                            }}
                          />

                          <span>{column.key}</span>
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
              ) : (
           <DndContext

    sensors={sensors}

    collisionDetection={closestCenter}

    onDragEnd={handleDragEnd}

>

    <SortableContext

        items={selectedColumns}

        strategy={verticalListSortingStrategy}

    >

        <div className="space-y-2">

            {selectedColumns.map((column) => (

                <SortableColumnItem

                    key={column}

                    column={column}

                />

            ))}

        </div>

    </SortableContext>

</DndContext>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
