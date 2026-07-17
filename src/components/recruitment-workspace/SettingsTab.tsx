import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Eye,
  EyeOff,
  AlertTriangle,
  Lock,
  Users,
  ShieldAlert,
  GraduationCap,
  Building2,
  GitBranch,
  Clock3,
} from "lucide-react";

import type { RecruitmentDraftRow } from "@/services/recruitmentDraftService";
import type { RecruitmentWorkspaceSummary } from "@/services/recruitmentAnalyticsService";
import {
  recruitmentSettingsService,
  type RecruitmentSettings,
} from "@/services/recruitmentSettingsService";

import { toast } from "sonner";

interface SettingsTabProps {
  draft: RecruitmentDraftRow | null;
  summary: RecruitmentWorkspaceSummary | null;
  loading: boolean;
}

type OverrideScope = "ALL" | "INSTITUTE" | "BRANCH" | "GRADUATION_YEAR";

export function SettingsTab({ draft, summary, loading }: SettingsTabProps) {
  const [settings, setSettings] = useState<RecruitmentSettings | null>(null);

  const [saving, setSaving] = useState(false);

  const [closingDate, setClosingDate] = useState(summary?.applicationEndDate ?? "");

  const [allowRestrictedStudents, setAllowRestrictedStudents] = useState(false);

  const [allowPlacedStudents, setAllowPlacedStudents] = useState(false);

  const [restrictedScope, setRestrictedScope] = useState<OverrideScope>("ALL");

  const [placedScope, setPlacedScope] = useState<OverrideScope>("ALL");

  const [visibility, setVisibility] = useState(
    summary?.applicationStatus === "Closed" ? "HIDDEN" : "VISIBLE",
  );

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

        setClosingDate(data.applicationEndDate ? data.applicationEndDate.slice(0, 16) : "");

        setAllowRestrictedStudents(data.allowRestrictedStudents);

        setAllowPlacedStudents(data.allowPlacedStudents);

        setVisibility(data.visibleToStudents ? "VISIBLE" : "HIDDEN");
      } catch (error: any) {
       toast.error(
  error?.message ??
    "Failed to load recruitment settings.",
);
      }
    }

    loadSettings();

    return () => {
      mounted = false;
    };
  }, [draft, toast]);

  const eligibilityPreview = useMemo(() => {
    const before = summary?.eligibleStudents ?? 0;

    let delta = 0;

    if (allowRestrictedStudents) {
      delta += 12;
    }

    if (allowPlacedStudents) {
      delta += 8;
    }

    return {
      before,
      after: before + delta,
      difference: delta,
    };
  }, [summary, allowRestrictedStudents, allowPlacedStudents]);

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

  function ScopeSelector({
    value,
    onChange,
  }: {
    value: OverrideScope;
    onChange: (value: OverrideScope) => void;
  }) {
    const scopes: OverrideScope[] = ["ALL", "INSTITUTE", "BRANCH", "GRADUATION_YEAR"];

    return (
      <div className="mt-4 flex flex-wrap gap-2">
        {scopes.map((scope) => (
          <button
            key={scope}
            type="button"
            onClick={() => onChange(scope)}
            className={
              value === scope
                ? "rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                : "rounded-full border px-4 py-2 text-sm hover:bg-muted"
            }
          >
            {scope
              .replaceAll("_", " ")
              .toLowerCase()
              .replace(/\b\w/g, (c) => c.toUpperCase())}
          </button>
        ))}
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
                {summary.applicationStartDate
                  ? new Date(summary.applicationStartDate).toLocaleString()
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
              onChange={(e) => setClosingDate(e.target.value)}
              className="h-11 w-full rounded-xl border bg-background px-4"
            />

            <p className="mt-2 text-xs text-muted-foreground">
              Extending the deadline immediately affects student applications.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            disabled={!settings || saving}
            onClick={async () => {
              if (!settings) return;

              try {
                setSaving(true);

                await recruitmentSettingsService.extendDeadline(
                  settings.opportunityId,
                  closingDate,
                );

                toast.success("Application deadline updated successfully.");
              } catch (error: any) {
                toast.error(error?.message ?? "Unable to update application deadline.");
              } finally {
                setSaving(false);
              }
            }}
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            Extend Deadline
          </button>
        </div>
      </SectionCard>

      <SectionCard
        title="Eligibility Overrides"
        description="Temporarily override placement restrictions for this recruitment."
        icon={<ShieldAlert className="h-6 w-6 text-primary" />}
      >
        <div className="space-y-8">
          <div className="rounded-xl border p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">Allow Restricted Students</div>

                <div className="mt-1 text-sm text-muted-foreground">
                  Students having placement restrictions can participate in this recruitment.
                </div>
              </div>

              <button
                type="button"
                onClick={() => setAllowRestrictedStudents(!allowRestrictedStudents)}
                className={
                  allowRestrictedStudents
                    ? "rounded-full bg-green-600 px-5 py-2 text-sm font-medium text-white"
                    : "rounded-full border px-5 py-2 text-sm"
                }
              >
                {allowRestrictedStudents ? "Enabled" : "Disabled"}
              </button>
            </div>

            {allowRestrictedStudents && (
              <>
                <div className="mt-6 text-sm font-medium">Override Scope</div>

                <ScopeSelector value={restrictedScope} onChange={setRestrictedScope} />

                {restrictedScope !== "ALL" && (
                  <div className="mt-5 grid gap-4 lg:grid-cols-3">
                    <select className="h-11 rounded-xl border bg-background px-4">
                      <option>Select Institute</option>
                    </select>

                    <select className="h-11 rounded-xl border bg-background px-4">
                      <option>Select Branch</option>
                    </select>

                    <select className="h-11 rounded-xl border bg-background px-4">
                      <option>Select Graduation Year</option>
                    </select>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="rounded-xl border p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">Allow Already Placed Students</div>

                <div className="mt-1 text-sm text-muted-foreground">
                  Allow students already marked as placed to participate again.
                </div>
              </div>

              <button
                type="button"
                onClick={() => setAllowPlacedStudents(!allowPlacedStudents)}
                className={
                  allowPlacedStudents
                    ? "rounded-full bg-green-600 px-5 py-2 text-sm font-medium text-white"
                    : "rounded-full border px-5 py-2 text-sm"
                }
              >
                {allowPlacedStudents ? "Enabled" : "Disabled"}
              </button>
            </div>

            {allowPlacedStudents && (
              <>
                <div className="mt-6 text-sm font-medium">Override Scope</div>

                <ScopeSelector value={placedScope} onChange={setPlacedScope} />

                {placedScope !== "ALL" && (
                  <div className="mt-5 grid gap-4 lg:grid-cols-3">
                    <select className="h-11 rounded-xl border bg-background px-4">
                      <option>Select Institute</option>
                    </select>

                    <select className="h-11 rounded-xl border bg-background px-4">
                      <option>Select Branch</option>
                    </select>

                    <select className="h-11 rounded-xl border bg-background px-4">
                      <option>Select Graduation Year</option>
                    </select>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Live Eligibility Preview"
        description="Preview how the current override configuration changes the eligible student count."
        icon={<Users className="h-6 w-6 text-primary" />}
      >
        <div className="grid gap-5 md:grid-cols-3">
          <div className="rounded-xl border bg-muted/20 p-5">
            <div className="text-sm text-muted-foreground">Eligible Before</div>

            <div className="mt-3 text-3xl font-bold">{eligibilityPreview.before}</div>
          </div>

          <div className="rounded-xl border bg-muted/20 p-5">
            <div className="text-sm text-muted-foreground">Eligible After</div>

            <div className="mt-3 text-3xl font-bold text-primary">{eligibilityPreview.after}</div>
          </div>

          <div className="rounded-xl border bg-primary/5 p-5">
            <div className="text-sm text-muted-foreground">Difference</div>

            <div
              className={`mt-3 text-3xl font-bold ${
                eligibilityPreview.difference > 0 ? "text-green-600" : "text-muted-foreground"
              }`}
            >
              {eligibilityPreview.difference > 0 ? "+" : ""}
              {eligibilityPreview.difference}
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
          This preview is temporary. Changes are applied only after saving the recruitment settings.
        </div>
      </SectionCard>

      <SectionCard
        title="Recruitment Visibility"
        description="Control whether this published recruitment is visible to students."
        icon={
          visibility === "VISIBLE" ? (
            <Eye className="h-6 w-6 text-primary" />
          ) : (
            <EyeOff className="h-6 w-6 text-primary" />
          )
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <button
            type="button"
            onClick={() => setVisibility("VISIBLE")}
            className={`rounded-2xl border p-6 text-left transition ${
              visibility === "VISIBLE" ? "border-primary bg-primary/5" : "hover:bg-muted/30"
            }`}
          >
            <Eye className="mb-4 h-7 w-7 text-primary" />

            <div className="font-semibold">Visible</div>

            <div className="mt-2 text-sm text-muted-foreground">
              Students can discover and apply for this recruitment.
            </div>
          </button>

          <button
            type="button"
            onClick={() => setVisibility("HIDDEN")}
            className={`rounded-2xl border p-6 text-left transition ${
              visibility === "HIDDEN" ? "border-destructive bg-destructive/5" : "hover:bg-muted/30"
            }`}
          >
            <EyeOff className="mb-4 h-7 w-7 text-destructive" />

            <div className="font-semibold">Hidden</div>

            <div className="mt-2 text-sm text-muted-foreground">
              Hide this recruitment without deleting it.
            </div>
          </button>
        </div>
      </SectionCard>

      <SectionCard
        title="Danger Zone"
        description="Administrative actions affecting the lifecycle of this recruitment."
        icon={<AlertTriangle className="h-6 w-6 text-destructive" />}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-amber-300 bg-amber-50 p-5">
            <div>
              <div className="font-semibold text-amber-900">Close Recruitment</div>

              <div className="mt-1 text-sm text-amber-700">
                Immediately stop accepting applications.
              </div>
            </div>

            <button
              type="button"
              className="rounded-xl bg-amber-600 px-5 py-2 text-sm font-medium text-white hover:bg-amber-700"
            >
              Close
            </button>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-red-300 bg-red-50 p-5">
            <div>
              <div className="font-semibold text-red-900">Archive Recruitment</div>

              <div className="mt-1 text-sm text-red-700">
                Archive this recruitment while preserving historical records.
              </div>
            </div>

            <button
              type="button"
              className="rounded-xl bg-red-600 px-5 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Archive
            </button>
          </div>

          <div className="flex items-center justify-between rounded-xl border p-5">
            <div>
              <div className="font-semibold">Reopen Recruitment</div>

              <div className="mt-1 text-sm text-muted-foreground">
                Reopen a previously closed recruitment.
              </div>
            </div>

            <button
              type="button"
              className="rounded-xl border px-5 py-2 text-sm font-medium hover:bg-muted"
            >
              Reopen
            </button>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
