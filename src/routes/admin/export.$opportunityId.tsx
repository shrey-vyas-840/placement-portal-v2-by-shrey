import { createFileRoute } from "@tanstack/react-router";

import { AdminProtectedRoute } from "@/components/AdminProtectedRoute";

import { AdminOpportunityExportPage } from "@/pages/AdminOpportunityExportPage";

export const Route = createFileRoute("/admin/export/$opportunityId")({
  component: ExportRoute,
});

function ExportRoute() {
  const { opportunityId } = Route.useParams();

  return (
    <AdminProtectedRoute>
      <AdminOpportunityExportPage opportunityId={opportunityId} />
    </AdminProtectedRoute>
  );
}
