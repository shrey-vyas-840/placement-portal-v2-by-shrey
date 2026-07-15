import {
  AlertTriangle,
  CheckCircle2,
  BriefcaseBusiness,
} from "lucide-react";

import type { RecruitmentWorkspaceSummary } from "@/services/recruitmentAnalyticsService";

interface ActionCenterProps {
  summary: RecruitmentWorkspaceSummary | null;
}

export function ActionCenter({
  summary,
}: ActionCenterProps) {
  if (!summary) return null;

  const items = [
  {
    icon: CheckCircle2,
    color: "text-green-600",
    title: "Recruitment is accepting applications.",
    description:
      summary.applicationStatus === "Open"
        ? "Students can currently submit applications."
        : `Current status: ${summary.applicationStatus}`,
  },

  ...(summary.totalApplications === 0
    ? [
        {
          icon: AlertTriangle,
          color: "text-amber-600",
          title: "No registrations received yet.",
          description:
            "Consider informing eligible students before the application window closes.",
        },
      ]
    : []),

  {
    icon: BriefcaseBusiness,
    color: "text-violet-600",
    title: `${summary.totalRoles} published role${
      summary.totalRoles === 1 ? "" : "s"
    }.`,
    description:
      "All published roles are available for eligible students.",
  },
];

  return (
    <div className="rounded-2xl border bg-card p-6">

      <h3 className="text-lg font-semibold">
        Action Center
      </h3>

      <p className="mt-1 text-sm text-muted-foreground">
        Current operational status of this recruitment.
      </p>

      <div className="mt-6 space-y-4">

        {items.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="flex items-start gap-4 rounded-xl border p-4"
            >
              <div className={item.color}>
                <Icon className="h-6 w-6" />
              </div>

              <div>

                <div className="font-medium">
                  {item.title}
                </div>

                <div className="text-sm text-muted-foreground">
                  {item.description}
                </div>

              </div>

            </div>
          );
        })}

      </div>

    </div>
  );
}