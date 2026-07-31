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

  onViewStudents: (executionRoundId: string) => void;

  onContinue: () => void;
}

export default function ManageExecutionBatchesDialog({
  open,
  batches,
  students,
  onClose,
  onCreateBatch,
  onEditBatch,
  onViewStudents,
  onContinue,
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
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden rounded-3xl border border-slate-200 p-0 shadow-2xl flex flex-col">
        <DialogHeader className="relative overflow-hidden border-b-0 bg-gradient-to-r from-blue-800 via-blue-700 to-cyan-600 px-8 py-6 text-white">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-white/10 blur-xl" />

          <div className="absolute bottom-0 left-0 h-28 w-28 rounded-full bg-cyan-300/10 blur-xl" />

          <div className="relative z-10 flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/70">
                Execution Workspace
              </p>

              <DialogTitle className="mt-2 text-3xl font-bold text-white">
                Manage Execution Batches
              </DialogTitle>

              <p className="mt-2 text-sm text-white/80">
                Review execution batches, update batch settings and assign participants.
              </p>
            </div>

            <Badge className="rounded-full border border-white/20 bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/20">
              {batches.length} Batch{batches.length === 1 ? "" : "es"}
            </Badge>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto bg-slate-50">
          <div className="bg-slate-50 px-8 py-6">
            <Button
              className={`rounded-full px-6 ${
                activeTab === "VIEW"
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "border border-slate-300 bg-white text-slate-700 hover:border-blue-300 hover:text-blue-700"
              }`}
              onClick={() => setActiveTab("VIEW")}
            >
              View Batches
            </Button>

            <Button
              className={`ml-3 rounded-full px-6 ${
                activeTab === "UPDATE"
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "border border-slate-300 bg-white text-slate-700 hover:border-blue-300 hover:text-blue-700"
              }`}
              onClick={() => setActiveTab("UPDATE")}
            >
              Update Batches
            </Button>
          </div>

          <Separator />

          {activeTab === "VIEW" ? (
            <div className="space-y-5 px-8 py-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Execution Batches</h3>

                <p className="text-sm text-slate-500">
                  Review assigned candidates across all execution batches.
                </p>
              </div>
              <div className="mt-5">
                <input
                  type="text"
                  className="h-11 w-80 rounded-xl border border-slate-300 bg-white px-4 text-sm shadow-sm transition-all placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
                  placeholder="Search Student / Enrollment"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                />
              </div>
              {batches.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
                  <Users className="mx-auto mb-4 h-10 w-10 text-slate-400" />

                  <h3 className="text-lg font-semibold">No Execution Batches</h3>

                  <p className="mt-2 text-sm text-slate-500">
                    Create your first execution batch to begin scheduling interviews.
                  </p>

                  <Button
                    className="mt-6 rounded-xl bg-gradient-to-r from-blue-700 to-cyan-600"
                    onClick={onCreateBatch}
                  >
                    + Create Execution Batch
                  </Button>
                </div>
              ) : (
                batches.map((batch) => {
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
                    <div
                      key={batch.execution_round_id}
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">
                            {batch.round_name}
                          </h3>

                          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4 text-blue-500" />
                              {batch.scheduled_date || "-"}
                            </span>

                            <span className="flex items-center gap-1">
                              <Clock3 className="h-4 w-4 text-violet-500" />
                              {batch.scheduled_time || "-"}
                            </span>

                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4 text-emerald-500" />
                              {batch.venue || "-"}
                            </span>
                          </div>
                        </div>

                        <Badge className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 font-semibold text-blue-700">
                          👥 {batch.assigned_students} Student
                          {batch.assigned_students === 1 ? "" : "s"}
                        </Badge>
                      </div>

                      {batch.remarks && (
                        <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                          <ClipboardList className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                          <span>{batch.remarks}</span>
                        </div>
                      )}

                      <Separator className="my-4" />

                      <div>
                        <p className="sticky top-0 z-10 mb-3 bg-white pb-2 text-sm font-semibold uppercase tracking-wide text-slate-700">
                          Assigned Students
                        </p>

                        <div className="max-h-72 space-y-1.5 overflow-y-auto pr-2 scrollbar-thin">
                          {batchStudents.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center">
                              <Users className="mx-auto mb-3 h-8 w-8 text-slate-400" />

                              <p className="font-medium text-slate-600">No students assigned</p>

                              <p className="mt-1 text-sm text-slate-500">
                                Assign students to this execution batch to view them here.
                              </p>
                            </div>
                          ) : (
                            batchStudents.map((student) => (
                              <div
                                key={student.execution_participant_id}
                                className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm transition hover:border-blue-300 hover:bg-blue-50"
                              >
                                <span>{student.student_name}</span>

                                <Badge className="rounded-full bg-slate-200 px-3 py-1 font-medium text-slate-700">
                                  {student.enrollment_no}
                                </Badge>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="space-y-4 px-8 py-6">
              {batches.map((batch) => {
                const selected = selectedBatchId === batch.execution_round_id;

                return (
                  <div
                    key={batch.execution_round_id}
                    className={`rounded-2xl border bg-white shadow-sm transition-all ${
                      selected
                        ? "border-blue-500 shadow-lg ring-2 ring-blue-100"
                        : "border-slate-200 hover:border-blue-300 hover:shadow-md"
                    }`}
                  >
                    <button
                      type="button"
                      className="flex w-full items-center justify-between rounded-2xl p-5 text-left transition-colors hover:bg-slate-50"
                      onClick={() => setSelectedBatchId(selected ? null : batch.execution_round_id)}
                    >
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">{batch.round_name}</h3>

                        <p className="mt-2 text-sm text-slate-500">
                          👥 {batch.assigned_students} Student
                          {batch.assigned_students === 1 ? "" : "s"}
                        </p>
                      </div>

                      <div
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          selected ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {selected ? "Selected" : "Select"}
                      </div>
                    </button>

                    {selected && (
                      <div className="border-t p-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <Button
                            variant="outline"
                            className="rounded-xl border-slate-300 px-5"
                            onClick={() => onViewStudents(batch.execution_round_id)}
                          >
                            👥 View Students
                          </Button>

                          <Button
                            className="rounded-xl bg-gradient-to-r from-blue-700 to-cyan-600 px-5 shadow-md"
                            onClick={() => onEditBatch(batch.execution_round_id)}
                          >
                            ⚙ Batch Settings
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              <Separator />

              <div className="flex items-center justify-between border-t border-slate-200 pt-5">
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Execution Batch Configuration
                  </p>

                  <p className="text-xs text-slate-500">
                    Review batch assignments before continuing.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Button className="rounded-xl border-slate-300 px-5" onClick={onContinue}>
                    👥 Assign Participants
                  </Button>

                  <Button
                    className="rounded-xl bg-gradient-to-r from-blue-700 to-cyan-600 px-6 shadow-lg"
                    onClick={onCreateBatch}
                  >
                    + Create New Execution Batch
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
