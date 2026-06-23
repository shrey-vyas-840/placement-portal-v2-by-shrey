import { createFileRoute } from "@tanstack/react-router";

import { AdminProtectedRoute } from "@/components/AdminProtectedRoute";

import { AdminCompaniesPage } from "@/pages/AdminCompaniesPage";

export const Route = createFileRoute("/admin/companies")({
  component: () => (
    <AdminProtectedRoute>
      <AdminCompaniesPage />
    </AdminProtectedRoute>
  ),
});
