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

interface SortableColumnProps {
  column: string;
}

function SortableColumn({ column }: SortableColumnProps) {
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
    <div
      ref={setNodeRef}

      style={{
        transform: CSS.Transform.toString(transform),

        transition,
      }}

      {...attributes}

      className="flex items-center justify-between rounded-xl border bg-card p-4"
    >
      <div className="flex items-center gap-3">
        <GripVertical
          {...listeners}

          className="h-4 w-4 cursor-grab text-muted-foreground"
        />

        <span>{column}</span>
      </div>
    </div>
  );
}

interface ExportColumnSorterProps {
  selectedColumns: string[];

  onChange: (columns: string[]) => void;
}

export function ExportColumnSorter({
  selectedColumns,

  onChange,
}: ExportColumnSorterProps) {
  const sensors = useSensors(
    useSensor(
      PointerSensor,

      {
        activationConstraint: {
          distance: 5,
        },
      },
    ),
  );

  function handleDragEnd(event: DragEndEvent) {
    const {
      active,

      over,
    } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = selectedColumns.indexOf(active.id as string);

    const newIndex = selectedColumns.indexOf(over.id as string);

    onChange(
      arrayMove(
        selectedColumns,

        oldIndex,

        newIndex,
      ),
    );
  }

  return (
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
            <SortableColumn
              key={column}

              column={column}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
