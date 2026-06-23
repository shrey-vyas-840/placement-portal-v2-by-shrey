import { createFileRoute } from "@tanstack/react-router";

import { AdminProtectedRoute } from "@/components/AdminProtectedRoute";

import { AdminOnboardingApprovalsPage } from "@/pages/AdminOnboardingApprovalsPage";

export const Route =
  createFileRoute(
    "/admin/onboarding-approvals",
  )({
    component: () => (
      <AdminProtectedRoute>
        <AdminOnboardingApprovalsPage />
      </AdminProtectedRoute>
    ),
  });