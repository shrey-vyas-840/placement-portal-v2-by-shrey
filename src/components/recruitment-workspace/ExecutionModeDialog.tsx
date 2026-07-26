import { useEffect, useState } from "react";

import {
  GitBranch,
  Users,
} from "lucide-react";

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

export type ExecutionMode =
  | "SINGLE"
  | "MULTIPLE";

interface ExecutionModeDialogProps {
  open: boolean;

  loading?: boolean;

  stageNumber: number;

  participantCount: number;

  defaultMode?: ExecutionMode;

  onCancel: () => void;

  onContinue: (
    executionMode: ExecutionMode,
  ) => void;
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
  const [mode, setMode] =
    useState<ExecutionMode>("SINGLE");

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
      <DialogContent className="max-w-2xl">

        <DialogHeader>

          <DialogTitle>

            Execution Mode

          </DialogTitle>

          <DialogDescription>

            Choose how this stage will be conducted.

          </DialogDescription>

        </DialogHeader>

        <div className="rounded-lg border bg-muted/30 p-4">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-sm font-medium">

                Stage {stageNumber}

              </p>

              <p className="text-xs text-muted-foreground">

                {participantCount} shortlisted student
                {participantCount === 1 ? "" : "s"} entering this stage.

              </p>

            </div>

          </div>

        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">

          <Card
            role="button"
            tabIndex={0}
            onClick={() => setMode("SINGLE")}
            className={`cursor-pointer border-2 transition-all ${
              mode === "SINGLE"
                ? "border-primary bg-primary/5"
                : "hover:border-primary/40"
            }`}
          >

            <div className="flex h-full flex-col p-5">

              <Users className="mb-4 h-8 w-8" />

              <h3 className="font-semibold">

                Single Execution

              </h3>

              <p className="mt-2 text-sm text-muted-foreground">

                Conduct the entire stage together in one execution.
                No execution batches will be created.

              </p>

            </div>

          </Card>

          <Card
            role="button"
            tabIndex={0}
            onClick={() => setMode("MULTIPLE")}
            className={`cursor-pointer border-2 transition-all ${
              mode === "MULTIPLE"
                ? "border-primary bg-primary/5"
                : "hover:border-primary/40"
            }`}
          >

            <div className="flex h-full flex-col p-5">

              <GitBranch className="mb-4 h-8 w-8" />

              <h3 className="font-semibold">

                Multiple Execution Batches

              </h3>

              <p className="mt-2 text-sm text-muted-foreground">

                Split shortlisted students into multiple scheduled
                execution batches for this stage.

              </p>

            </div>

          </Card>

        </div>

        <DialogFooter className="mt-6">

          <Button
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>

          <Button
            onClick={() => onContinue(mode)}
            disabled={loading}
          >
            Continue
          </Button>

        </DialogFooter>

      </DialogContent>

    </Dialog>
  );
}