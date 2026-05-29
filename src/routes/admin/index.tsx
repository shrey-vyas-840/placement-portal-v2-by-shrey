import { createFileRoute } from "@tanstack/react-router";

import { AdminProtectedRoute } from "@/components/AdminProtectedRoute";
import { AdminDashboardPage } from "@/pages/AdminDashboardPage";

export const Route = createFileRoute("/admin/")({
  component: () => (
    <AdminProtectedRoute>
    <AdminDashboardPage />
    </AdminProtectedRoute>
  ),
});