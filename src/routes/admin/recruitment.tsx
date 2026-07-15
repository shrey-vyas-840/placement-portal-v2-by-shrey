import { Outlet, createFileRoute } from "@tanstack/react-router";

import { AdminProtectedRoute } from "@/components/AdminProtectedRoute";

export const Route = createFileRoute("/admin/recruitment")({
  component: RecruitmentLayout,
});

function RecruitmentLayout() {
  return (
    <AdminProtectedRoute>
      <Outlet />
    </AdminProtectedRoute>
  );
}