import { createFileRoute } from "@tanstack/react-router";

import { AdminProtectedRoute } from "@/components/AdminProtectedRoute";
import { RecruitmentWizardPage } from "@/pages/RecruitmentWizardPage";

export const Route = createFileRoute("/admin/recruitment-new")({
  component: () => (
    <AdminProtectedRoute>
      <RecruitmentWizardPage />
    </AdminProtectedRoute>
  ),
});