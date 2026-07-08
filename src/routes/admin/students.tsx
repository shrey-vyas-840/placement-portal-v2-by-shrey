import { createFileRoute } from "@tanstack/react-router";

import { AdminProtectedRoute } from "@/components/AdminProtectedRoute";

import { AdminStudentsPage } from "@/pages/AdminStudentsPage";

export const Route = createFileRoute("/admin/students")({
  component: () => (
    <AdminProtectedRoute>
      <AdminStudentsPage />
    </AdminProtectedRoute>
  ),
});
