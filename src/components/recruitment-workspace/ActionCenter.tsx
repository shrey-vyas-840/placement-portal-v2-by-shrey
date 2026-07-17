import { AlertTriangle, CheckCircle2, BriefcaseBusiness } from "lucide-react";

import type { RecruitmentWorkspaceSummary } from "@/services/recruitmentAnalyticsService";

interface ActionCenterProps {
  summary: RecruitmentWorkspaceSummary | null;
}

export function ActionCenter({ summary }: ActionCenterProps) {
  if (!summary) return null;

  const severityColor = {
    high: "text-red-600",
    medium: "text-amber-600",
    low: "text-green-600",
  } as const;

  const severityIcon = {
    high: AlertTriangle,
    medium: AlertTriangle,
    low: CheckCircle2,
  } as const;

  return (
    <div className="rounded-2xl border bg-card p-6">
      <h3 className="text-lg font-semibold">Action Center</h3>

      <p className="mt-1 text-sm text-muted-foreground">
        Current operational status of this recruitment.
      </p>

    <div className="mt-6 grid gap-5 xl:grid-cols-[420px_1fr]">

  <div className="rounded-2xl border">

    <div className="border-b px-5 py-4">

      <div className="text-sm font-semibold">
        🔴 Students Requiring Action
      </div>

    </div>

    {summary.actionCenter
      .filter((item) => item.actionLabel === "View Students")
      .map((item) => {
        const Icon = severityIcon[item.severity];

        return (
          <div
            key={item.title}
            className="flex items-center justify-between px-5 py-5"
          >
            <div className="flex items-center gap-4">

              <Icon
                className={`h-5 w-5 ${severityColor[item.severity]}`}
              />

              <div>

                <div className="font-medium">
                  {item.title}
                </div>

                <div className="text-sm text-muted-foreground">
                  {item.description}
                </div>

              </div>

            </div>

            <button className="rounded-lg border px-4 py-2 text-sm hover:bg-muted">
              View
            </button>

          </div>
        );
      })}

  </div>

  <div className="rounded-2xl border">

    <div className="border-b px-5 py-4">

      <div className="text-sm font-semibold">
        ⚠ Recruitment Alerts
      </div>

    </div>

    <div className="max-h-[220px] overflow-y-auto">

      {summary.actionCenter
        .filter((item) => item.actionLabel !== "View Students")
        .map((item) => (
          <div
            key={item.title}
            className="flex items-center justify-between border-b px-5 py-4 last:border-b-0"
          >
            <div className="flex items-center gap-3">

              <BriefcaseBusiness className="h-4 w-4 text-primary" />

              <span className="font-medium">
                {item.title}
              </span>

            </div>

            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${
                item.severity === "high"
                  ? "bg-red-100 text-red-700"
                  : item.severity === "medium"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-green-100 text-green-700"
              }`}
            >
              Low Interest
            </span>

          </div>
        ))}

    </div>

  </div>

</div>
    </div>
  );
}
