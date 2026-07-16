import { ReactNode, useEffect, useState } from "react";
import { ActionCenter } from "./ActionCenter";
import {
  BriefcaseBusiness,
  CalendarDays,
  FileText,
  CircleDot,
  Users,
  UserCheck,
  Trophy,
} from "lucide-react";

import {
  getRecruitmentWorkspaceSummary,
  type RecruitmentWorkspaceSummary,
} from "@/services/recruitmentAnalyticsService";

import type { RecruitmentDraftRow } from "@/services/recruitmentDraftService";

interface SummaryTabProps {
  draft: RecruitmentDraftRow | null;
  summary: RecruitmentWorkspaceSummary | null;
  loading: boolean;
}

export function SummaryTab({ draft, summary, loading }: SummaryTabProps) {
  if (loading) {
    return (
      <div className="flex h-[500px] items-center justify-center">
        <div className="text-muted-foreground">Loading recruitment summary...</div>
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="flex h-[500px] items-center justify-center">
        <div className="text-destructive">Recruitment not found.</div>
      </div>
    );
  }

  function SummaryMetricCard({
    title,
    value,
    icon,
  }: {
    title: string;
    value: ReactNode;
    icon: ReactNode;
  }) {
    return (
      <div className="rounded-2xl border bg-card px-5 py-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              {title}
            </div>

            <div className="mt-3 text-4xl font-bold">{value}</div>
          </div>

          <div className="rounded-xl bg-primary/10 p-3">{icon}</div>
        </div>
      </div>
    );
  }

  function OverviewItem({ label, value }: { label: string; value: ReactNode }) {
    return (
      <div className="rounded-xl bg-muted/40 p-4">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>

        <div className="mt-2 text-lg font-semibold">{value}</div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border bg-card p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Recruitment Overview
            </div>

            <h2 className="mt-2 text-3xl font-bold">{summary?.recruitmentName}</h2>

            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span>
                Company:
                <span className="ml-1 font-medium text-foreground">
                  {summary?.companyName || "-"}
                </span>
              </span>

              <span>•</span>

              <span>
                Roles:
                <span className="ml-1 font-medium text-foreground">
                  {summary?.totalRoles ?? "-"}
                </span>
              </span>

              <span>•</span>

              <span>
                Applications:
                <span className="ml-1 font-medium text-foreground">
                  {summary?.totalApplications ?? "-"}
                </span>
              </span>
            </div>
          </div>

          <div className="rounded-full bg-green-100 px-5 py-2 text-sm font-semibold text-green-700">
            {summary?.applicationStatus}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <SummaryMetricCard
          title="Applications"
          value={summary?.totalApplications ?? 0}
          icon={<FileText className="h-6 w-6 text-primary" />}
        />

        <SummaryMetricCard
          title="Roles"
          value={summary?.totalRoles ?? 0}
          icon={<BriefcaseBusiness className="h-6 w-6 text-primary" />}
        />

        <SummaryMetricCard
          title="Applicants"
          value={summary?.totalApplications ?? 0}
          icon={<Users className="h-6 w-6 text-primary" />}
        />

        <SummaryMetricCard
          title="Shortlisted"
          value={0}
          icon={<UserCheck className="h-6 w-6 text-green-600" />}
        />

        <SummaryMetricCard
          title="Selected"
          value={0}
          icon={<Trophy className="h-6 w-6 text-amber-600" />}
        />

        <SummaryMetricCard
          title="Status"
          value={summary?.applicationStatus ?? "-"}
          icon={<CircleDot className="h-6 w-6 text-green-500" />}
        />
      </div>

      <div className="space-y-5">
        <ActionCenter summary={summary} />

        <div className="rounded-2xl border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Role Distribution
              </div>

              <div className="mt-1 text-lg font-semibold">Applications per Role</div>
            </div>

            <div className="text-sm text-muted-foreground">{summary?.totalRoles ?? 0} Roles</div>
          </div>

          <div className="mt-6 space-y-4">
            {(summary?.roleDistribution ?? []).length ? (
              (summary?.roleDistribution ?? []).map(
                (role: { roleId: string; roleName: string; applicationCount: number }) => {
                  const max = Math.max(
                    ...(summary?.roleDistribution ?? []).map((r) => r.applicationCount),
                    1,
                  );

                  const percentage = (role.applicationCount / max) * 100;

                  return (
                    <div key={role.roleId}>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="font-medium">{role.roleName}</span>

                        <span className="text-sm text-muted-foreground">
                          {role.applicationCount}
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-500"
                          style={{
                            width: `${percentage}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                },
              )
            ) : (
              <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
                No applications yet.
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-3">
          <div className="xl:col-span-2 rounded-2xl border bg-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Recruitment Overview
                </div>

                <div className="mt-2 text-2xl font-bold">{summary?.companyName}</div>
              </div>

              <div className="rounded-full bg-primary/10 px-4 py-2 text-sm font-medium">
                {summary?.applicationStatus}
              </div>
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-2">
              <OverviewItem
                label="Application Window"
                value={
                  summary?.applicationStartDate && summary?.applicationEndDate
                    ? `${new Date(summary.applicationStartDate).toLocaleDateString()} → ${new Date(
                        summary.applicationEndDate,
                      ).toLocaleDateString()}`
                    : "-"
                }
              />

              <OverviewItem label="Published Roles" value={summary?.totalRoles ?? 0} />

              <OverviewItem label="Applications" value={summary?.totalApplications ?? 0} />

              <OverviewItem
                label="Average / Role"
                value={summary?.averageApplicationsPerRole ?? 0}
              />
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-6">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Recent Activity
            </div>

            <div className="mt-6 space-y-3">
              {summary?.recentApplications?.length ? (
                summary.recentApplications.slice(0, 6).map((application) => (
                  <div key={application.applicationId} className="rounded-xl border p-4">
                    <div className="font-medium">Student Applied</div>

                    <div className="mt-1 text-sm text-muted-foreground">
                      {new Date(application.appliedAt).toLocaleString()}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
                  No activity yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
