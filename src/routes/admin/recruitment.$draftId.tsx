import { createFileRoute } from "@tanstack/react-router";

import { AdminProtectedRoute } from "@/components/AdminProtectedRoute";
import { AdminRecruitmentWorkspacePage } from "@/pages/AdminRecruitmentWorkspacePage";

export const Route = createFileRoute("/admin/recruitment/$draftId")({
  component: () => (
    <AdminProtectedRoute>
      <AdminRecruitmentWorkspacePage />
    </AdminProtectedRoute>
  ),
});