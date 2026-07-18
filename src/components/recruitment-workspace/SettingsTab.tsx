import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { CalendarDays, AlertTriangle, Users, ShieldAlert, Clock3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { RecruitmentDraftRow } from "@/services/recruitmentDraftService";
import type { RecruitmentWorkspaceSummary } from "@/services/recruitmentAnalyticsService";
import {
  recruitmentSettingsService,
  type RecruitmentSettings,
} from "@/services/recruitmentSettingsService";
import {
  getRecruitmentEligibilityAnalytics,
  type EligibilityAnalyticsResult,
} from "@/services/recruitmentEligibilityAnalyticsService";

import { toast } from "sonner";

interface SettingsTabProps {
  draft: RecruitmentDraftRow | null;
  summary: RecruitmentWorkspaceSummary | null;
  loading: boolean;
}

export function SettingsTab({ draft, summary, loading }: SettingsTabProps) {
  const [settings, setSettings] = useState<RecruitmentSettings | null>(null);

  const [analytics, setAnalytics] = useState<EligibilityAnalyticsResult | null>(null);

  const [selectedStudent, setSelectedStudent] = useState<{
    studentId: string;
    fullName: string;
    type: "RESTRICTED" | "PLACED";
  } | null>(null);

  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false);

  const [creatingOverride, setCreatingOverride] = useState(false);

  const [saving, setSaving] = useState(false);

  const [reopenDialogOpen, setReopenDialogOpen] = useState(false);

  const [newClosingDate, setNewClosingDate] = useState("");

  const [reopening, setReopening] = useState(false);

  const [closingDate, setClosingDate] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    if (!draft) {
      return;
    }

    let mounted = true;

    async function loadSettings() {
      const currentDraft = draft;

      if (!currentDraft) {
        return;
      }

      try {
        const data = await recruitmentSettingsService.getSettings(currentDraft.draft_id);

        if (!mounted) {
          return;
        }

        setSettings(data);

        if (data.driveId) {
          const analyticsData = await getRecruitmentEligibilityAnalytics(currentDraft.draft_id);

          if (mounted) {
            setAnalytics(analyticsData);
          }
        }

        setClosingDate(data.applicationEndDate ? data.applicationEndDate.slice(0, 16) : "");
      } catch (error: any) {
        toast.error(error?.message ?? "Failed to load recruitment settings.");
      }
    }

    loadSettings();

    return () => {
      mounted = false;
    };
  }, [draft, toast]);

  if (loading) {
    return (
      <div className="flex h-[500px] items-center justify-center">
        <div className="text-muted-foreground">Loading recruitment settings...</div>
      </div>
    );
  }

  if (!draft || !summary) {
    return (
      <div className="flex h-[500px] items-center justify-center">
        <div className="text-destructive">Recruitment not found.</div>
      </div>
    );
  }

  function SectionCard({
    title,
    description,
    icon,
    children,
  }: {
    title: string;
    description: string;
    icon: React.ReactNode;
    children: React.ReactNode;
  }) {
    return (
      <div className="rounded-2xl border bg-card">
        <div className="flex items-start gap-4 border-b px-6 py-5">
          <div className="rounded-xl bg-primary/10 p-3">{icon}</div>

          <div>
            <div className="text-lg font-semibold">{title}</div>

            <div className="mt-1 text-sm text-muted-foreground">{description}</div>
          </div>
        </div>

        <div className="p-6">{children}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionCard
        title="Application Window"
        description="Manage the application timeline for this live recruitment."
        icon={<CalendarDays className="h-6 w-6 text-primary" />}
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <div className="mb-2 text-sm font-medium">Opening Date</div>

            <div className="flex h-11 items-center rounded-xl border bg-muted/20 px-4">
              <Clock3 className="mr-3 h-4 w-4 text-muted-foreground" />

              <span className="text-sm">
                {settings?.applicationStartDate
                  ? new Date(settings.applicationStartDate).toLocaleString()
                  : "Not Available"}
              </span>
            </div>

            <p className="mt-2 text-xs text-muted-foreground">
              Opening date cannot be modified after publication.
            </p>
          </div>

          <div>
            <div className="mb-2 text-sm font-medium">Closing Date</div>

            <input
              type="datetime-local"
              value={closingDate}
              readOnly
              disabled
              className="h-11 w-full rounded-xl border bg-muted px-4 text-muted-foreground cursor-not-allowed"
            />

            <p className="mt-2 text-xs text-muted-foreground">
              Extending the deadline immediately affects student applications.
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Student Overrides"
        description="Eligible students blocked due to restrictions or placement."
        icon={<Users className="h-6 w-6 text-primary" />}
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">Restricted Students</div>

                <div className="mt-1 text-sm text-muted-foreground">
                  Eligible but globally restricted.
                </div>
              </div>

              <div className="rounded-full bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-800">
                {analytics?.restrictedEligibleStudents.length ?? 0}
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {(analytics?.restrictedEligibleStudents ?? []).slice(0, 5).map((student) => (
                <div
                  key={student.studentId}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <div className="font-medium">{student.fullName}</div>

                    <div className="text-xs text-muted-foreground">{student.restrictionReason}</div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStudent({
                        studentId: student.studentId,
                        fullName: student.fullName,
                        type: "RESTRICTED",
                      });

                      setOverrideDialogOpen(true);
                    }}
                    className="rounded-lg border px-3 py-1 text-sm hover:bg-muted"
                  >
                    Allow
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">Already Placed</div>

                <div className="mt-1 text-sm text-muted-foreground">
                  Eligible but already placed.
                </div>
              </div>

              <div className="rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
                {analytics?.placedEligibleStudents.length ?? 0}
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {(analytics?.placedEligibleStudents ?? []).slice(0, 5).map((student) => (
                <div
                  key={student.studentId}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <div className="font-medium">{student.fullName}</div>

                    <div className="text-xs text-muted-foreground">{student.companyName}</div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStudent({
                        studentId: student.studentId,
                        fullName: student.fullName,
                        type: "PLACED",
                      });

                      setOverrideDialogOpen(true);
                    }}
                    className="rounded-lg border px-3 py-1 text-sm hover:bg-muted"
                  >
                    Allow
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Danger Zone"
        description="Administrative actions affecting the lifecycle of this recruitment."
        icon={<AlertTriangle className="h-6 w-6 text-destructive" />}
      >
        <div className="space-y-4">
          {settings?.applicationStatus === "Open" && (
            <div className="flex items-center justify-between rounded-xl border border-amber-300 bg-amber-50 p-5">
              <div>
                <div className="font-semibold text-amber-900">Close Recruitment</div>

                <div className="mt-1 text-sm text-amber-700">
                  Immediately stop accepting applications.
                </div>
              </div>

              <button
                type="button"
                disabled={!settings || saving}
                onClick={async () => {
                  if (!settings) return;

                  try {
                    setSaving(true);

                    await recruitmentSettingsService.closeRecruitment(settings.opportunityId);

                    toast.success("Recruitment closed.");

                    const refreshed = await recruitmentSettingsService.getSettings(draft.draft_id);

                    setSettings(refreshed);
                  } catch (error: any) {
                    toast.error(error?.message ?? "Unable to close recruitment.");
                  } finally {
                    setSaving(false);
                  }
                }}
                className="rounded-xl bg-amber-600 space-y-4 px-5 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
              >
                Close
              </button>
            </div>
          )}
          <div className="flex items-center justify-between rounded-xl border border-red-300 bg-red-50 p-5">
            <div>
              <div className="font-semibold text-red-900">Archive Recruitment</div>

              <div className="mt-1 text-sm text-red-700">
                Archive this recruitment while preserving historical records.
              </div>
            </div>

            <button
              type="button"
              disabled={saving}
              onClick={async () => {
                if (!draft) return;

                const confirmed = window.confirm(
                  "Archive this recruitment?\n\nIt will be moved to the Archived Recruitments section and can be restored later.",
                );

                if (!confirmed) return;

                try {
                  setSaving(true);

                  await recruitmentSettingsService.archiveRecruitment(draft.draft_id);

                  toast.success("Recruitment archived successfully.");

                  navigate({
                    to: "/admin/recruitment",
                  });
                } catch (error: any) {
                  toast.error(error?.message ?? "Unable to archive recruitment.");
                } finally {
                  setSaving(false);
                }
              }}
              className="rounded-xl bg-red-600 px-5 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              Archive
            </button>
          </div>
        </div>
        <div className="mt-6 space-y-4">
          {settings?.applicationStatus === "Closed" && (
            <div className="flex items-center justify-between rounded-xl border border-green-300 bg-green-50 p-5">
              <div>
                <div className="font-semibold text-green-900">Reopen Recruitment</div>

                <div className="mt-1 text-sm text-green-700">
                  Reopen recruitment by providing a new application deadline.
                </div>
              </div>

              <button
                type="button"
                onClick={() => setReopenDialogOpen(true)}
                className="rounded-xl bg-green-600 px-5 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                Reopen
              </button>
            </div>
          )}
        </div>

        {settings?.applicationStatus === "Closed" && reopenDialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-md rounded-2xl bg-background p-6 shadow-xl">
              <h3 className="text-xl font-semibold">Reopen Recruitment</h3>

              <p className="mt-2 text-sm text-muted-foreground">
                Please select a new application closing date.
              </p>

              <div className="mt-6">
                <label className="mb-2 block text-sm font-medium">New Closing Date</label>

                <input
                  type="datetime-local"
                  value={newClosingDate}
                  onChange={(e) => setNewClosingDate(e.target.value)}
                  className="h-11 w-full rounded-xl border px-4"
                />
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setReopenDialogOpen(false);
                    setNewClosingDate("");
                  }}
                  className="rounded-xl border px-5 py-2"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={reopening}
                  onClick={async () => {
                    if (!settings) return;

                    if (!newClosingDate) {
                      toast.error("Please select a new closing date.");
                      return;
                    }

                    if (new Date(newClosingDate) <= new Date()) {
                      toast.error("Closing date must be in the future.");
                      return;
                    }

                    try {
                      setReopening(true);

                      await recruitmentSettingsService.extendDeadline(
                        settings.opportunityId,
                        newClosingDate,
                      );

                      await recruitmentSettingsService.reopenRecruitment(settings.opportunityId);

                      toast.success("Recruitment reopened successfully.");

                      const refreshed = await recruitmentSettingsService.getSettings(
                        draft.draft_id,
                      );

                      setSettings(refreshed);

                      setClosingDate(refreshed.applicationEndDate?.slice(0, 16) ?? "");

                      setReopenDialogOpen(false);

                      setNewClosingDate("");
                    } catch (error: any) {
                      toast.error(error.message ?? "Unable to reopen recruitment.");
                    } finally {
                      setReopening(false);
                    }
                  }}
                  className="rounded-xl bg-primary px-5 py-2 text-primary-foreground"
                >
                  Reopen
                </button>
              </div>
            </div>
          </div>
        )}
      </SectionCard>

      {overrideDialogOpen && selectedStudent && settings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-background p-6 shadow-2xl">
            <h3 className="text-xl font-semibold">Allow Student</h3>

            <p className="mt-2 text-sm text-muted-foreground">
              This will allow
              <span className="font-medium text-foreground"> {selectedStudent.fullName}</span> to
              participate in this recruitment only.
            </p>

            <div className="mt-6 rounded-xl border bg-muted/30 p-4">
              <div className="text-sm text-muted-foreground">Override Type</div>

              <div className="mt-1 font-medium">
                {selectedStudent.type === "RESTRICTED"
                  ? "Restricted Student"
                  : "Already Placed Student"}
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setOverrideDialogOpen(false);
                  setSelectedStudent(null);
                }}
                className="rounded-xl border px-5 py-2"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={creatingOverride}
                onClick={async () => {
                  try {
                    setCreatingOverride(true);

                    await (supabase as any).from("student_placement_overrides").insert({
                      student_id: selectedStudent.studentId,

                      opportunity_id: settings.opportunityId,

                      override_scope: "SPECIFIC",

                      override_type: selectedStudent.type,

                      override_reason: "Recruitment specific override",

                      granted_at: new Date().toISOString(),

                      is_active: true,
                    });

                    toast.success("Student allowed successfully.");

                    const refreshed = await getRecruitmentEligibilityAnalytics(draft.draft_id);

                    setAnalytics(refreshed);

                    setOverrideDialogOpen(false);

                    setSelectedStudent(null);
                  } catch (error: any) {
                    toast.error(error?.message ?? "Unable to create override.");
                  } finally {
                    setCreatingOverride(false);
                  }
                }}
                className="rounded-xl bg-primary px-5 py-2 text-primary-foreground"
              >
                Allow Student
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
