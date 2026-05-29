import { createFileRoute } from "@tanstack/react-router";

import { AdminProtectedRoute } from "@/components/AdminProtectedRoute";
import { AdminStudentDetailPage } from "@/pages/AdminStudentDetailPage";

export const Route = createFileRoute(
  "/admin/$studentId",
)({
  component: StudentDetailRoute,
});

function StudentDetailRoute() {
  const { studentId } =
    Route.useParams();

  return (
    <AdminProtectedRoute>
      <AdminStudentDetailPage
        studentId={studentId}
      />
    </AdminProtectedRoute>
  );
}