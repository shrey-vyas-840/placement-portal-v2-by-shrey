import { createFileRoute } from "@tanstack/react-router";

import { AdminRecruitmentHubPage } from "@/pages/AdminRecruitmentHubPage";

export const Route = createFileRoute("/admin/recruitment/")({
  component: AdminRecruitmentHubPage,
});