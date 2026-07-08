import { createFileRoute } from "@tanstack/react-router";

import { MyApplicationsPage } from "@/pages/MyApplicationsPage";

export const Route = createFileRoute("/my-applications")({
  component: MyApplicationsPage,
});
