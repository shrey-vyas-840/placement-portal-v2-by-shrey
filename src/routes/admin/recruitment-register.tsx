import { createFileRoute } from "@tanstack/react-router";

import { AdminProtectedRoute } from "@/components/AdminProtectedRoute";
import { AdminRecruitmentRegisterPage } from "@/pages/AdminRecruitmentRegisterPage";

export const Route = createFileRoute("/admin/recruitment-register")({
  component: () => (
    <AdminProtectedRoute>
      <AdminRecruitmentRegisterPage />
    </AdminProtectedRoute>
  ),
});