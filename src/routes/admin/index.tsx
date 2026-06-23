import { createFileRoute } from "@tanstack/react-router";

import { AdminProtectedRoute } from "@/components/AdminProtectedRoute";
import { AdminDashboardPage } from "@/pages/AdminDashboardPage";
import { AdminOpportunitiesPage } from "@/pages/AdminOpportunitiesPage";

export const Route = createFileRoute("/admin/")({
  component: () => (
    <AdminProtectedRoute>
      <AdminDashboardPage />
    </AdminProtectedRoute>
  ),
});
