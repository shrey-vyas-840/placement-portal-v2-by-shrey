import { useEffect, useMemo, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { ExportCenter } from "@/components/export/ExportCenter";

import {
  recruitmentExecutionAttendanceExportService,
  type AttendanceExportStudent,
} from "@/services/recruitmentExecutionAttendanceExportService";

import { buildAttendanceExportConfiguration } from "@/services/recruitmentExecution/attendanceExportConfig";

import type {
  ExportConfiguration,
  ExportDataset,
} from "@/services/export/exportTypes";

interface AttendanceExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  executionId: string;
  executionRoundId: string;
}

export function AttendanceExportDialog({
  open,
  onOpenChange,
  executionId,
  executionRoundId,
}: AttendanceExportDialogProps) {
  const [loading, setLoading] = useState(false);

  const [dataset, setDataset] = useState<
    ReturnType<
      typeof recruitmentExecutionAttendanceExportService.getAttendanceExportData
    > extends Promise<infer T>
      ? T
      : never
  >();

  useEffect(() => {
    if (!open) return;

    void loadExportData();
  }, [open, executionId, executionRoundId]);

  async function loadExportData() {
    try {
      setLoading(true);

      const data =
        await recruitmentExecutionAttendanceExportService.getAttendanceExportData(
          executionId,
          executionRoundId,
        );

      setDataset(data);
    } finally {
      setLoading(false);
    }
  }

  const configuration = useMemo<
    ExportConfiguration<AttendanceExportStudent> | undefined
  >(() => {
    if (!dataset) return undefined;

    return buildAttendanceExportConfiguration(dataset);
  }, [dataset]);

  if (loading || !configuration) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-7xl h-[92vh] overflow-hidden p-0">
          <DialogHeader>
            <DialogTitle>Attendance Export Center</DialogTitle>
          </DialogHeader>

          <div className="flex h-96 items-center justify-center">
            <div className="text-muted-foreground">
              Loading export data...
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl h-[92vh] overflow-hidden p-0">
        <DialogHeader>
          <DialogTitle>Attendance Export Center</DialogTitle>
        </DialogHeader>

        <ExportCenter configuration={configuration} />
      </DialogContent>
    </Dialog>
  );
}