import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ReviewSection = "ABSENTEES" | "RESTRICTIONS" | "SUMMARY";

import type {
  RecruitmentExecutionParticipantWithStudent,
  RecruitmentExecutionEditedRow,
} from "@/types/recruitmentExecution";

interface AttendanceReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  participants: RecruitmentExecutionParticipantWithStudent[];

  editedRows: Record<string, RecruitmentExecutionEditedRow>;

  onEditedRowChange: (
    participantId: string,
    changes: Partial<RecruitmentExecutionEditedRow>,
  ) => void;

  saving: boolean;

  onSave: () => void;
}

export default function AttendanceReviewDialog({
  open,
  onOpenChange,
  participants,
editedRows,
onEditedRowChange,
saving,
onSave,
}: AttendanceReviewDialogProps) {
  const [activeSection, setActiveSection] = useState<ReviewSection>("ABSENTEES");

  const [search, setSearch] = useState("");

  const counts = useMemo(() => {
    const rows = Object.values(editedRows);

    return {
      absent: rows.filter((r) => r.attendanceStatus === "ABSENT").length,

      allowed: rows.filter(
        (r) => r.attendanceStatus === "ABSENT" && r.absenceDisposition === "ALLOWED",
      ).length,

      unallowed: rows.filter(
        (r) =>
          r.attendanceStatus === "ABSENT" &&
          (r.absenceDisposition === "UNALLOWED" || r.absenceDisposition === null),
      ).length,

      restricted: participants.filter((p) => p.is_globally_restricted).length,

      overridden: rows.filter((r) => r.restrictionOverride).length,
    };
  }, [editedRows, participants]);

const validationErrors = useMemo(() => {
  const errors: string[] = [];

  Object.values(editedRows).forEach((row) => {
    if (
      row.attendanceStatus === "ABSENT" &&
      row.absenceDisposition === "ALLOWED" &&
      row.absenceReason.trim() === ""
    ) {
      errors.push("Allowed absence requires a reason.");
    }

    if (
      row.restrictionOverride &&
      row.overrideReason.trim() === ""
    ) {
      errors.push("Restriction override requires a reason.");
    }
  });

  return errors;
}, [editedRows]);

const canSave =
  validationErrors.length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl h-[85vh] p-0 overflow-hidden">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>Attendance Review</DialogTitle>
        </DialogHeader>

        <div className="flex h-full">
          {/* Left Navigation */}

          <aside className="w-72 border-r bg-muted/20 p-4 space-y-2">
            <Button
              variant={activeSection === "ABSENTEES" ? "secondary" : "ghost"}
              className="w-full justify-between"
              onClick={() => setActiveSection("ABSENTEES")}
            >
              <span>Absentees</span>

              <span className="rounded-full bg-background px-2 py-0.5 text-xs">
                {counts.absent}
              </span>
            </Button>

            <Button
              variant={activeSection === "RESTRICTIONS" ? "secondary" : "ghost"}
              className="w-full justify-between"
              onClick={() => setActiveSection("RESTRICTIONS")}
            >
              <span>Restrictions</span>

              <span className="rounded-full bg-background px-2 py-0.5 text-xs">
                {counts.restricted}
              </span>
            </Button>

            <Button
              variant={activeSection === "SUMMARY" ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveSection("SUMMARY")}
            >
              Summary
            </Button>
          </aside>

          {/* Right Panel */}

          <section className="flex-1 overflow-auto p-6">
            <div className="space-y-6">
              <Input
                placeholder="Search by enrollment, name or branch..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              {activeSection === "ABSENTEES" && (
                <div className="rounded-lg border">
                  <div className="border-b p-4">
                    <div className="flex justify-between">
                      <div>
                        <h3 className="font-semibold">Absentees</h3>

                        <p className="text-sm text-muted-foreground">
                          Review absent students before saving attendance.
                        </p>
                      </div>

                      <div className="text-right text-sm">
                        <div>Total : {counts.absent}</div>

                        <div>Allowed : {counts.allowed}</div>

                        <div>Unallowed : {counts.unallowed}</div>
                      </div>
                    </div>
                  </div>

                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="p-3 text-left">Enrollment</th>

                        <th className="text-left">Student</th>

                        <th className="text-left">Branch</th>

                        <th className="text-left">Absence Status</th>
                      </tr>
                    </thead>

                    <tbody>
                      {participants
                        .filter(
                          (participant) =>
                            editedRows[participant.execution_participant_id]?.attendanceStatus ===
                            "ABSENT",
                        )
                        .map((participant) => {
                          const editedRow = editedRows[participant.execution_participant_id];

                          return (
                            <>
                              <tr key={participant.execution_participant_id} className="border-b">
                                <td className="p-3">{participant.student.enrollment_no}</td>

                                <td>
                                  {participant.student.first_name} {participant.student.last_name}
                                </td>

                                <td>--</td>

                                <td className="p-3 align-top">
                                  <select
                                    className="w-52 rounded-md border bg-background px-3 py-2 text-sm"
                                    value={editedRow.absenceDisposition ?? "UNALLOWED"}
                                    onChange={(e) => {
                                      const disposition = e.target.value as "ALLOWED" | "UNALLOWED";

                                      onEditedRowChange(participant.execution_participant_id, {
                                        absenceDisposition: disposition,
                                      });
                                    }}
                                  >
                                    <option value="UNALLOWED">Unallowed Absence</option>

                                    <option value="ALLOWED">Allowed Absence</option>
                                  </select>
                                </td>
                              </tr>

                              {editedRow.absenceDisposition === "ALLOWED" && (
                                <tr className="border-b bg-muted/20">
                                  <td />

                                  <td colSpan={3} className="py-3">
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium">Reason *</label>

                                      <Input
                                        placeholder="Enter reason for allowing absence..."

                                        value={editedRow.absenceReason}

                                        onChange={(e) => {
                                          onEditedRowChange(participant.execution_participant_id, {
                                            absenceReason: e.target.value,
                                          });
                                        }}
                                      />
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}

              {activeSection === "RESTRICTIONS" && (
                <div className="rounded-lg border p-6">
                  <h3 className="font-semibold">Restrictions</h3>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Review restricted students and overrides.
                  </p>
                </div>
              )}

              {activeSection === "SUMMARY" && (
                <div className="rounded-lg border p-6">
                  <h3 className="font-semibold">Summary</h3>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Final validation before saving attendance.
                  </p>
                </div>
              )}
            </div>
          </section>
          <div className="sticky bottom-0 flex items-center justify-between border-t bg-background px-6 py-4">

  <div className="text-sm">

    {validationErrors.length > 0 && (

      <span className="text-destructive">

        {validationErrors.length}
        {" "}
        validation issue(s)

      </span>

    )}

  </div>

  <div className="flex gap-3">

    <Button
      variant="outline"
      onClick={() =>
        onOpenChange(false)
      }
    >
      Cancel
    </Button>

    <Button
      disabled={
        !canSave || saving
      }
      onClick={onSave}
    >
      Save Attendance
    </Button>

  </div>

</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
