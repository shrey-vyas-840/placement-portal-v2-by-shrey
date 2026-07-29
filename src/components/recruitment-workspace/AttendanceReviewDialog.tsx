import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Fragment, useMemo, useState } from "react";
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

      if (row.restrictionOverride && row.overrideReason.trim() === "") {
        errors.push("Restriction override requires a reason.");
      }
    });

    return errors;
  }, [editedRows]);

  const canSave = validationErrors.length === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl h-[85vh] overflow-hidden p-0 flex flex-col">
        <DialogHeader className="relative overflow-hidden bg-gradient-to-r from-blue-800 via-blue-700 to-cyan-600 px-8 py-6 text-white">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-white/10 blur-xl" />

          <div className="absolute bottom-0 left-0 h-28 w-28 rounded-full bg-cyan-300/10 blur-xl" />

          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/70">
                Recruitment Execution
              </p>

              <DialogTitle className="mt-2 text-3xl font-bold text-white">
                Attendance Review
              </DialogTitle>

              <p className="mt-2 text-sm text-white/80">
                Validate attendance, restrictions and progression before saving.
              </p>
            </div>

            <div className="rounded-full border border-white/20 bg-white/15 px-4 py-3 text-sm font-semibold backdrop-blur-sm">
              {participants.length} Participants
            </div>
          </div>
        </DialogHeader>
        <div className="flex flex-1 overflow-hidden">
          {/* Left Navigation */}

          <aside className="w-72 shrink-0 border-r bg-muted/20 p-6 space-y-4">
            <div
              onClick={() => setActiveSection("ABSENTEES")}
              className={`cursor-pointerrounded-2xl border p-5 shadow-md transition-all

    ${
      activeSection === "ABSENTEES"
        ? "border-primary bg-primary text-primary-foreground shadow-md"
        : "border-border bg-background hover:border-primary/40 hover:bg-primary/5"
    }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-base font-semibold">🟠 Absentees</div>

                  <div className="mt-1 text-xs opacity-80">Review absent students</div>
                </div>

                <div className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                  {counts.absent}
                </div>
              </div>
            </div>

            <div
              onClick={() => setActiveSection("RESTRICTIONS")}
              className={`cursor-pointerrounded-2xl border p-5 shadow-md transition-all

    ${
      activeSection === "RESTRICTIONS"
        ? "border-primary bg-primary text-primary-foreground shadow-md"
        : "border-border bg-background hover:border-primary/40 hover:bg-primary/5"
    }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-base font-semibold">🟠 Restrictions</div>

                  <div className="mt-1 text-xs opacity-80">Review restricted students</div>
                </div>

                <div className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                  {counts.restricted}
                </div>
              </div>
            </div>

            <div
              onClick={() => setActiveSection("SUMMARY")}
              className={`cursor-pointerrounded-2xl border p-5 shadow-md transition-all

    ${
      activeSection === "SUMMARY"
        ? "border-primary bg-primary text-primary-foreground shadow-md"
        : "border-border bg-background hover:border-primary/40 hover:bg-primary/5"
    }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-base font-semibold">✅ Summary</div>

                  <div className="mt-1 text-xs opacity-80">Final validation</div>
                </div>

                <div
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    validationErrors.length === 0
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {validationErrors.length}
                </div>
              </div>
            </div>
          </aside>

          {/* Right Panel */}

          <section className="flex-1 overflow-y-auto bg-muted/10 p-6">
            <div className="space-y-6">
              <div className="sticky top-0 bg-slate-100 z-20 rounded-2xl border bg-background p-4 shadow-md">
                <Input
                  placeholder="🔍 Search by enrollment, name or branch..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {activeSection === "ABSENTEES" && (
                <div className="rounded-2xl border bg-background shadow-md">
                  <div className="border-b px-6 py-5">
                    <div className="flex justify-between">
                      <div>
                        <h3 className="text-base font-semibold">Absentees</h3>

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

                  <div className="max-h-[500px] overflow-y-auto">
                    <table className="w-full">
                      <thead className="sticky top-0 bg-slate-100 z-10 bg-muted/40 backdrop-blur">
                        <tr className="border-b transition-colors hover:bg-muted/30">
                          <th className="p-3 text-left">Enrollment</th>

                          <th className="text-left">Student</th>

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
                              <Fragment key={participant.execution_participant_id}>
                                <tr key={participant.execution_participant_id} className="border-b">
                                  <td className="px-2 py-3">{participant.student.enrollment_no}</td>

                                  <td>
                                    {participant.student.first_name} {participant.student.last_name}
                                  </td>

                                  <td className="p-3 align-top">
                                    <select
                                      className="w-52 rounded-md border bg-background px-3 py-3 text-sm"
                                      value={editedRow.absenceDisposition ?? "UNALLOWED"}
                                      onChange={(e) => {
                                        const disposition = e.target.value as
                                          "ALLOWED" | "UNALLOWED";

                                        onEditedRowChange(participant.execution_participant_id, {
                                          attendanceStatus: "ABSENT",

                                          absenceDisposition: disposition,

                                          absenceReason:
                                            disposition === "ALLOWED"
                                              ? editedRow.absenceReason
                                              : "",

                                          progressionStatus:
                                            disposition === "ALLOWED"
                                              ? editedRow.progressionStatus
                                              : "NONE",
                                        });
                                      }}
                                    >
                                      <option value="UNALLOWED">🟠 Unallowed Absence</option>

                                      <option value="ALLOWED">🟢 Allowed Absence</option>
                                    </select>
                                  </td>
                                </tr>

                                {editedRow.absenceDisposition === "ALLOWED" && (
                                  <tr className="border-b bg-primary/5">
                                    <td />

                                    <td colSpan={3} className="py-3">
                                      <div className="rounded-lg border bg-background p-4 space-y-2">
                                        <label className="text-sm font-medium">Reason *</label>

                                        <Input
                                          placeholder="Enter reason for allowing absence..."

                                          value={editedRow.absenceReason}

                                          onChange={(e) => {
                                            onEditedRowChange(
                                              participant.execution_participant_id,
                                              {
                                                absenceReason: e.target.value,
                                              },
                                            );
                                          }}
                                        />
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </Fragment>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeSection === "RESTRICTIONS" && (
                <div className="rounded-2xl border bg-background shadow-md">
                  <div className="border-b px-6 py-5">
                    <div className="flex justify-between">
                      <div>
                        <h3 className="text-base font-semibold">Restrictions</h3>

                        <p className="text-sm text-muted-foreground">
                          Review globally restricted students before saving attendance.
                        </p>
                      </div>

                      <div className="text-right text-sm">
                        <div>Restricted : {counts.restricted}</div>

                        <div>Overridden : {counts.overridden}</div>
                      </div>
                    </div>
                  </div>

                  <div className="max-h-[500px] overflow-y-auto">
                    <table className="w-full">
                      <thead className="sticky top-0 z-10 bg-muted/40 backdrop-blur">
                        <tr className="border-b transition-colors hover:bg-muted/30">
                          <th className="p-3 text-left">Enrollment</th>

                          <th className="text-left">Student</th>

                          <th className="text-left">Restriction</th>

                          <th className="text-left">Override</th>
                        </tr>
                      </thead>

                      <tbody>
                        {participants
                          .filter((participant) => participant.is_globally_restricted)
                          .map((participant) => {
                            const editedRow = editedRows[participant.execution_participant_id];

                            return (
                              <Fragment key={participant.execution_participant_id}>
                                <tr key={participant.execution_participant_id} className="border-b">
                                  <td className="px-2 py-3">{participant.student.enrollment_no}</td>

                                  <td>
                                    {participant.student.first_name} {participant.student.last_name}
                                  </td>

                                  <td>{participant.restriction_reason ?? "Active Restriction"}</td>

                                  <td className="px-2 py-3">
                                    <select
                                      className="w-56 rounded-md border bg-background px-3 py-3 text-sm"
                                      value={editedRow.restrictionOverride ? "ALLOW" : "RESTRICT"}
                                      onChange={(e) => {
                                        const allowed = e.target.value === "ALLOW";

                                        onEditedRowChange(participant.execution_participant_id, {
                                          gateStatus: allowed ? "ALLOWED" : "RESTRICTED",

                                          restrictionOverride: allowed,

                                          overrideReason: allowed ? editedRow.overrideReason : "",

                                          progressionStatus: allowed
                                            ? editedRow.progressionStatus
                                            : "NONE",
                                        });
                                      }}
                                    >
                                      <option value="RESTRICT">🔴 Restricted</option>

                                      <option value="ALLOW">🟢 Allowed for Recruitment</option>
                                    </select>
                                  </td>
                                </tr>

                                {editedRow.restrictionOverride && (
                                  <tr className="border-b bg-primary/5">
                                    <td />

                                    <td colSpan={4} className="py-3">
                                      <div className="rounded-lg border bg-background p-4 space-y-2">
                                        <label className="text-sm font-medium">
                                          Override Reason *
                                        </label>

                                        <Input
                                          placeholder="Enter override reason..."

                                          value={editedRow.overrideReason}

                                          onChange={(e) =>
                                            onEditedRowChange(
                                              participant.execution_participant_id,
                                              {
                                                overrideReason: e.target.value,
                                              },
                                            )
                                          }
                                        />
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </Fragment>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeSection === "SUMMARY" && (
                <div className="grid grid-cols-2 gap-5">
                  <div className="rounded-2xl border bg-background p-5 shadow-md">
                    <h3 className="text-base font-semibold">Attendance</h3>

                    <div className="mt-5 space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span>Present</span>
                        <span className="text-base font-semibold">
                          {participants.length - counts.absent}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span>Absent</span>
                        <span className="text-base font-semibold">{counts.absent}</span>
                      </div>

                      <div className="flex justify-between text-green-600">
                        <span>Allowed</span>
                        <span className="text-base font-semibold">{counts.allowed}</span>
                      </div>

                      <div className="flex justify-between text-orange-600">
                        <span>Unallowed</span>
                        <span className="text-base font-semibold">{counts.unallowed}</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border bg-background p-5 shadow-md">
                    <h3 className="text-base font-semibold">Restrictions</h3>

                    <div className="mt-5 space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span>Restricted</span>

                        <span className="text-base font-semibold">{counts.restricted}</span>
                      </div>

                      <div className="flex justify-between text-green-600">
                        <span>Overrides</span>

                        <span className="text-base font-semibold">{counts.overridden}</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border bg-background p-5 shadow-md">
                    <h3 className="text-base font-semibold">Validation</h3>

                    <div className="mt-5">
                      {validationErrors.length === 0 ? (
                        <div className="rounded-lg bg-green-50 p-4 text-green-700">
                          ✓ Ready to Save
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
                          <div className="font-medium text-red-700">
                            {validationErrors.length} issue(s)
                          </div>

                          <ul className="mt-2 list-disc pl-5 text-sm text-red-600">
                            {validationErrors.map((e, i) => (
                              <li key={i}>{e}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border bg-background p-5 shadow-md">
                    <h3 className="text-base font-semibold">Participants</h3>

                    <div className="mt-5 space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span>Total</span>

                        <span className="text-base font-semibold">{participants.length}</span>
                      </div>

                      <div className="flex justify-between">
                        <span>Attendance Reviewed</span>

                        <span className="text-base font-semibold">
                          {Object.keys(editedRows).length}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span>Ready to Save</span>

                      <span
                        className={
                          canSave ? "font-semibold text-green-600" : "font-semibold text-red-600"
                        }
                      >
                        {canSave ? "Yes" : "No"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
        <div className="sticky bottom-0 flex items-center justify-between border-t bg-background px-6 py-4">
          <div>
            <div className="font-medium">Attendance Review</div>

            <div className="text-sm text-muted-foreground">
              Validate absences and restriction overrides before saving.
            </div>

            {validationErrors.length === 0 ? (
              <div className="mt-2 text-sm font-medium text-green-600">✓ Ready to Save</div>
            ) : (
              <div className="mt-2 text-sm font-medium text-red-600">
                {validationErrors.length} validation issue(s)
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl border-slate-300 px-5"
            >
              Cancel
            </Button>

            <Button
              disabled={!canSave || saving}
              onClick={onSave}
              className="rounded-xl bg-gradient-to-r from-blue-700 to-cyan-600 px-6 shadow-lg"
            >
              Save Attendance
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
