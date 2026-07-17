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

      <div className="mt-6 space-y-4">
        {summary.actionCenter.map((item) => {

  const Icon =
    severityIcon[item.severity];
        

          return (
            <div key={item.title} className="flex items-start gap-4 rounded-xl border p-4">
              <div className={
  severityColor[item.severity]
}>
                <Icon className="h-6 w-6" />
              </div>

              <div>
                <div className="flex items-center justify-between">

  <div className="font-medium">

    {item.title}

  </div>

  <span
    className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase ${
      item.severity === "high"
        ? "bg-red-100 text-red-700"
        : item.severity === "medium"
          ? "bg-amber-100 text-amber-700"
          : "bg-green-100 text-green-700"
    }`}
  >

    {item.severity}

  </span>

</div>

                <div className="text-sm text-muted-foreground">{item.description}</div>
                <button
  className="mt-3 rounded-lg border px-3 py-2 text-xs font-medium transition hover:bg-muted"
>

  {item.actionLabel}

</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
