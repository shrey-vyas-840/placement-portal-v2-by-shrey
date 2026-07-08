import { createFileRoute } from "@tanstack/react-router";
import { HodDashboardPage } from "@/pages/hod/HodDashboardPage";

export const Route = createFileRoute("/hod/")({
  component: HodDashboardPage,
});
