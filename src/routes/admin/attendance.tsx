import { createFileRoute } from "@tanstack/react-router";

import { AdminProtectedRoute } from "@/components/AdminProtectedRoute";
import { AdminAttendancePage } from "@/pages/AdminAttendancePage";

export const Route = createFileRoute("/admin/attendance")({
  component: () => (
    <AdminProtectedRoute>
      <AdminAttendancePage />
    </AdminProtectedRoute>
  ),
});
