import { useMemo, useState } from "react";

import { Calendar, Clock3, MapPin, Users, ClipboardList } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export interface ManageExecutionBatch {
  execution_round_id: string;

  round_name: string;

  scheduled_date: string | null;

  scheduled_time: string | null;

  venue: string | null;

  remarks: string | null;

  assigned_students: number;
}

export interface ManageExecutionBatchStudent {
  execution_participant_id: string;

  enrollment_no: string;

  student_name: string;

  execution_round_id: string | null;
}

interface ManageExecutionBatchesDialogProps {
  open: boolean;

  batches: ManageExecutionBatch[];

  students: ManageExecutionBatchStudent[];

  onClose: () => void;

  onCreateBatch: () => void;

  onEditBatch: (executionRoundId: string) => void;
}

export default function ManageExecutionBatchesDialog({
  open,
  batches,
  students,
  onClose,
  onCreateBatch,
  onEditBatch,
}: ManageExecutionBatchesDialogProps) {
  const [activeTab, setActiveTab] = useState<"VIEW" | "UPDATE">("VIEW");

  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);

  const [studentSearch, setStudentSearch] = useState("");

  const batchLookup = useMemo(() => {
    const map = new Map<string, ManageExecutionBatchStudent[]>();

    batches.forEach((batch) => {
      map.set(
        batch.execution_round_id,
        students.filter((student) => student.execution_round_id === batch.execution_round_id),
      );
    });

    return map;
  }, [batches, students]);

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Manage Execution Batches
          </DialogTitle>
        </DialogHeader>

        <div className="mb-4 flex gap-2">
          <Button
            variant={activeTab === "VIEW" ? "default" : "outline"}
            onClick={() => setActiveTab("VIEW")}
          >
            View
          </Button>

          <Button
            variant={activeTab === "UPDATE" ? "default" : "outline"}
            onClick={() => setActiveTab("UPDATE")}
          >
            Update
          </Button>
        </div>

        <Separator />

        {activeTab === "VIEW" ? (
          <div className="space-y-5 py-4">
            <div className="flex justify-end">
              <input
                type="text"
                className="w-72 rounded-md border px-3 py-2 text-sm"
                placeholder="Search student..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
              />
            </div>
            {batches.map((batch) => {
              const batchStudents = (batchLookup.get(batch.execution_round_id) ?? []).filter(
                (student) => {
                  if (!studentSearch.trim()) {
                    return true;
                  }

                  const search = studentSearch.toLowerCase();

                  return (
                    student.student_name.toLowerCase().includes(search) ||
                    student.enrollment_no.toLowerCase().includes(search)
                  );
                },
              );

              return (
                <div key={batch.execution_round_id} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-semibold">{batch.round_name}</h3>

                      <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {batch.scheduled_date || "-"}
                        </span>

                        <span className="flex items-center gap-1">
                          <Clock3 className="h-4 w-4" />
                          {batch.scheduled_time || "-"}
                        </span>

                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {batch.venue || "-"}
                        </span>
                      </div>
                    </div>

                    <Badge>
                      {batch.assigned_students} Student
                      {batch.assigned_students === 1 ? "" : "s"}
                    </Badge>
                  </div>

                  {batch.remarks && (
                    <div className="mt-4 flex items-start gap-2 text-sm">
                      <ClipboardList className="mt-0.5 h-4 w-4 text-muted-foreground" />
                      <span>{batch.remarks}</span>
                    </div>
                  )}

                  <Separator className="my-4" />

                  <div>
                    <p className="mb-2 text-sm font-medium">Assigned Students</p>

                    <div className="space-y-2">
                      {batchStudents.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No students assigned.</p>
                      ) : (
                        batchStudents.map((student) => (
                          <div
                            key={student.execution_participant_id}
                            className="flex items-center justify-between rounded border px-3 py-2 text-sm"
                          >
                            <span>{student.student_name}</span>

                            <Badge variant="secondary">{student.enrollment_no}</Badge>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {batches.map((batch) => {
              const selected = selectedBatchId === batch.execution_round_id;

              return (
                <div
                  key={batch.execution_round_id}
                  className={`rounded-lg border transition-all ${selected ? "border-primary" : ""}`}
                >
                  <button
                    type="button"
                    className="flex w-full items-center justify-between p-4 text-left"
                    onClick={() => setSelectedBatchId(selected ? null : batch.execution_round_id)}
                  >
                    <div>
                      <h3 className="font-medium">{batch.round_name}</h3>

                      <p className="mt-1 text-sm text-muted-foreground">
                        {batch.assigned_students} Student
                        {batch.assigned_students === 1 ? "" : "s"}
                      </p>
                    </div>

                    <Badge variant={selected ? "default" : "secondary"}>
                      {selected ? "Expanded" : "Collapsed"}
                    </Badge>
                  </button>

                  {selected && (
                    <div className="border-t p-4">
                      <Button onClick={() => onEditBatch(batch.execution_round_id)}>
                        Edit Configuration
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}

            <Separator />

            <Button className="w-full" onClick={onCreateBatch}>
              + Create New Execution Batch
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
