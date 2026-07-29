import { useEffect, useMemo, useState } from "react";

import { Calendar, Clock3, MapPin, ClipboardList, Users } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

import { Textarea } from "@/components/ui/textarea";

import { Badge } from "@/components/ui/badge";

import { Separator } from "@/components/ui/separator";

export interface ExecutionBatchFormData {
  batchName: string;

  scheduledDate: string;

  scheduledTime: string;

  venue: string;

  remarks: string;
}

interface CreateExecutionBatchDialogProps {
  open: boolean;

  loading?: boolean;

  stageNumber: number;

  participantCount: number;

  defaultBatchName?: string;

  initialValues?: Partial<ExecutionBatchFormData>;

  editingBatch?: {
    execution_round_id: string;

    round_name: string;

    scheduled_date: string | null;

    scheduled_time: string | null;

    venue: string | null;

    remarks: string | null;
  } | null;

  onCancel: () => void;

  onSave: (data: ExecutionBatchFormData) => void;
}

const EMPTY_FORM: ExecutionBatchFormData = {
  batchName: "",

  scheduledDate: "",

  scheduledTime: "",

  venue: "",

  remarks: "",
};

export default function CreateExecutionBatchDialog({
  open,

  loading = false,

  stageNumber,

  participantCount,

  defaultBatchName,

  initialValues,

  editingBatch,

  onCancel,

  onSave,
}: CreateExecutionBatchDialogProps) {
  const [form, setForm] = useState<ExecutionBatchFormData>(EMPTY_FORM);

  const [errors, setErrors] = useState<Partial<Record<keyof ExecutionBatchFormData, string>>>({});

  useEffect(() => {
    if (!open) return;

    if (editingBatch) {
      setForm({
        batchName: editingBatch.round_name,

        scheduledDate: editingBatch.scheduled_date ?? "",

        scheduledTime: editingBatch.scheduled_time ?? "",

        venue: editingBatch.venue ?? "",

        remarks: editingBatch.remarks ?? "",
      });

      setErrors({});

      return;
    }

    setForm({
      batchName: initialValues?.batchName ?? defaultBatchName ?? `Batch ${stageNumber}`,

      scheduledDate: initialValues?.scheduledDate ?? "",

      scheduledTime: initialValues?.scheduledTime ?? "",

      venue: initialValues?.venue ?? "",

      remarks: initialValues?.remarks ?? "",
    });

    setErrors({});
  }, [open, stageNumber, defaultBatchName, initialValues, editingBatch]);

  const isValid = useMemo(() => {
    return (
      form.batchName.trim().length > 0 &&
      form.scheduledDate.length > 0 &&
      form.scheduledTime.length > 0
    );
  }, [form]);

  const updateField = <K extends keyof ExecutionBatchFormData>(
    field: K,
    value: ExecutionBatchFormData[K],
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((previous) => ({
        ...previous,
        [field]: undefined,
      }));
    }
  };

  const validate = () => {
    const nextErrors: Partial<Record<keyof ExecutionBatchFormData, string>> = {};

    if (!form.batchName.trim()) {
      nextErrors.batchName = "Batch name is required.";
    }

    if (!form.scheduledDate) {
      nextErrors.scheduledDate = "Select the execution date.";
    }

    if (!form.scheduledTime) {
      nextErrors.scheduledTime = "Select the execution time.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) {
      return;
    }

    onSave(form);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) {
          onCancel();
        }
      }}
    >
      <DialogContent className="flex max-h-[90vh] max-w-3xl flex-col overflow-hidden rounded-3xl border border-slate-200 p-0 shadow-2xl">
        <DialogHeader className="relative overflow-hidden bg-gradient-to-r from-blue-800 via-blue-700 to-cyan-600 px-8 py-6 text-white">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-white/10 blur-xl" />

          <div className="absolute bottom-0 left-0 h-28 w-28 rounded-full bg-cyan-300/10 blur-xl" />

          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/70">
                Recruitment Execution
              </p>

              <DialogTitle className="mt-2 text-3xl font-bold text-white">
                {editingBatch ? "Update Execution Batch" : "Create Execution Batch"}
              </DialogTitle>

              <DialogDescription className="mt-2 text-sm text-white/80">
                {editingBatch
                  ? "Update the execution schedule for this batch."
                  : "Schedule an execution batch for shortlisted candidates."}
              </DialogDescription>
            </div>

            <Badge className="rounded-full border border-white/20 bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm">
              {participantCount} Student{participantCount === 1 ? "" : "s"}
            </Badge>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto bg-slate-50 p-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Stage {stageNumber}</p>

                <p className="text-xs text-muted-foreground">Configure the execution schedule.</p>
              </div>

              <Badge variant="secondary">
                {participantCount} Student
                {participantCount === 1 ? "" : "s"}
              </Badge>
            </div>
          </div>

          <Separator className="my-1" />

          <div className="space-y-6">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="batch-name">
                  Batch Name <span className="text-destructive">*</span>
                </Label>

                <Input
                  id="batch-name"
                  value={form.batchName}
                  onChange={(event) => updateField("batchName", event.target.value)}
                  placeholder="Morning Batch"
                  className="rounded-xl"
                />

                {errors.batchName && <p className="text-xs text-destructive">{errors.batchName}</p>}
              </div>

              <div className="space-y-2">
                <Label>Students</Label>

                <div className="flex h-10 items-center rounded-md border bg-muted/30 px-3">
                  <Users className="mr-2 h-4 w-4 text-muted-foreground" />

                  <span className="text-sm">
                    {participantCount} Student
                    {participantCount === 1 ? "" : "s"}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="batch-date">
                  <Calendar className="mr-1 inline h-4 w-4" />
                  Execution Date
                  <span className="text-destructive">*</span>
                </Label>

                <Input
                  id="batch-date"
                  type="date"
                  value={form.scheduledDate}
                  onChange={(event) => updateField("scheduledDate", event.target.value)}
                />

                {errors.scheduledDate && (
                  <p className="text-xs text-destructive">{errors.scheduledDate}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="batch-time">
                  <Clock3 className="mr-1 inline h-4 w-4" />
                  Execution Time
                  <span className="text-destructive">*</span>
                </Label>

                <Input
                  id="batch-time"
                  type="time"
                  value={form.scheduledTime}
                  onChange={(event) => updateField("scheduledTime", event.target.value)}
                  className="rounded-xl"
                />

                {errors.scheduledTime && (
                  <p className="text-xs text-destructive">{errors.scheduledTime}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="batch-venue">
                <MapPin className="mr-1 inline h-4 w-4" />
                Venue
              </Label>

              <Input
                id="batch-venue"
                value={form.venue}
                onChange={(event) => updateField("venue", event.target.value)}
                placeholder="MBA Seminar Hall"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="batch-remarks">
                <ClipboardList className="mr-1 inline h-4 w-4" />
                Remarks
              </Label>

              <Textarea
                id="batch-remarks"
                rows={4}
                value={form.remarks}
                onChange={(event) => updateField("remarks", event.target.value)}
                placeholder="Optional notes for this execution batch..."
                className="rounded-xl"
              />
            </div>
          </div>
        </div>
        <DialogFooter className="flex items-center justify-between border-t border-slate-200 bg-white px-8 py-5">
          <div>
            <p className="text-sm font-semibold text-slate-800">Execution Batch Configuration</p>

            <p className="text-xs text-slate-500">Complete the scheduling details before saving.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="rounded-xl border-slate-300 px-5"
            >
              Cancel
            </Button>

            <Button
              type="button"
              onClick={handleSave}
              disabled={!isValid || loading}
              className="rounded-xl bg-gradient-to-r from-blue-700 to-cyan-600 px-6 shadow-lg"
            >
              {loading
                ? editingBatch
                  ? "Updating..."
                  : "Creating..."
                : editingBatch
                  ? "Update Execution Batch"
                  : "Create Execution Batch"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
