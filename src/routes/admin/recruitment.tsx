import { createFileRoute } from "@tanstack/react-router";

import { AdminProtectedRoute } from "@/components/AdminProtectedRoute";
import { AdminRecruitmentHubPage } from "@/pages/AdminRecruitmentHubPage";

export const Route = createFileRoute("/admin/recruitment")({
  component: () => (
    <AdminProtectedRoute>
      <AdminRecruitmentHubPage />
    </AdminProtectedRoute>
  ),
});