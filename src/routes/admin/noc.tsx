import { createFileRoute } from "@tanstack/react-router";

import { AdminNocDashboardPage } from "@/pages/AdminNocDashboardPage";

export const Route = createFileRoute("/admin/noc")({
  component: AdminNocDashboardPage,
});
