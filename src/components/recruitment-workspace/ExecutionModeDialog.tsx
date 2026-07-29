import { useEffect, useState } from "react";

import { GitBranch, Users } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";

import { Card } from "@/components/ui/card";

export type ExecutionMode = "SINGLE" | "MULTIPLE";

interface ExecutionModeDialogProps {
  open: boolean;

  loading?: boolean;

  stageNumber: number;

  participantCount: number;

  defaultMode?: ExecutionMode;

  onCancel: () => void;

  onContinue: (executionMode: ExecutionMode) => void;
}

export default function ExecutionModeDialog({
  open,

  loading = false,

  stageNumber,

  participantCount,

  defaultMode = "SINGLE",

  onCancel,

  onContinue,
}: ExecutionModeDialogProps) {
  const [mode, setMode] = useState<ExecutionMode>("SINGLE");

  useEffect(() => {
    if (!open) return;

    setMode(defaultMode);
  }, [open, defaultMode]);

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) {
          onCancel();
        }
      }}
    >
      <DialogContent className="flex max-h-[85vh] max-w-3xl flex-col overflow-hidden rounded-3xl border border-slate-200 p-0 shadow-2xl">
        <DialogHeader className="relative overflow-hidden bg-gradient-to-r from-blue-800 via-blue-700 to-cyan-600 px-8 py-6 text-white">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-white/10 blur-xl" />

          <div className="absolute bottom-0 left-0 h-28 w-28 rounded-full bg-cyan-300/10 blur-xl" />

          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/70">
                Recruitment Execution
              </p>

              <DialogTitle className="mt-2 text-3xl font-bold text-white">
                Execution Mode
              </DialogTitle>

              <DialogDescription className="mt-2 text-sm text-white/80">
                Choose how this execution stage should be conducted.
              </DialogDescription>
            </div>

            <div className="rounded-full border border-white/20 bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur-sm">
              {participantCount} Student{participantCount === 1 ? "" : "s"}
            </div>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto bg-slate-50 p-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Stage {stageNumber}</p>

                <p className="text-xs text-muted-foreground">
                  {participantCount} shortlisted student
                  {participantCount === 1 ? "" : "s"} entering this stage.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Card
              role="button"
              tabIndex={0}
              onClick={() => setMode("SINGLE")}
              className={`cursor-pointer rounded-2xl border-2 bg-white shadow-sm transition-all duration-200 ${
                mode === "SINGLE"
                  ? "border-blue-600 bg-blue-50 ring-2 ring-blue-200 shadow-lg"
                  : "hover:border-blue-300 hover:shadow-md"
              }`}
            >
              <div className="flex h-full flex-col p-5">
                <Users className="mb-5 h-10 w-10 text-blue-700" />

                <h3 className="text-lg font-semibold">Single Execution</h3>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Conduct the entire stage together in one execution. No execution batches will be
                  created.
                </p>
              </div>
            </Card>

            <Card
              role="button"
              tabIndex={0}
              onClick={() => setMode("MULTIPLE")}
              className={`cursor-pointer rounded-2xl border-2 bg-white shadow-sm transition-all duration-200 ${
                mode === "MULTIPLE"
                  ? "border-blue-600 bg-blue-50 ring-2 ring-blue-200 shadow-lg"
                  : "hover:border-blue-300 hover:shadow-md"
              }`}
            >
              <div className="flex h-full flex-col p-5">
                <GitBranch className="mb-5 h-10 w-10 text-blue-700" />

                <h3 className="text-lg font-semibold">Multiple Execution Batches</h3>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Split shortlisted students into multiple scheduled execution batches for this
                  stage.
                </p>
              </div>
            </Card>
          </div>
        </div>
        <DialogFooter className="flex items-center justify-between border-t border-slate-200 bg-white px-8 py-5">
          <div>
            <p className="text-sm font-semibold text-slate-800">Execution Configuration</p>

            <p className="text-xs text-slate-500">
              Select the execution strategy before continuing.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="rounded-xl border-slate-300 px-5"
            >
              Cancel
            </Button>

            <Button
              onClick={() => onContinue(mode)}
              disabled={loading}
              className="rounded-xl bg-gradient-to-r from-blue-700 to-cyan-600 px-6 shadow-lg"
            >
              Continue
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
