import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { WorkspaceRegistryImportPage } from "@/pages/WorkspaceRegistryImportPage";

export const Route = createFileRoute("/workspace/registry-import")({
  component: () => (
    <ProtectedRoute>
      <WorkspaceRegistryImportPage />
    </ProtectedRoute>
  ),
});
