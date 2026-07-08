import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardPage } from "@/pages/DashboardPage";
import { ProfileProtectedRoute } from "@/components/ProfileProtectedRoute";

export const Route = createFileRoute("/dashboard")({
  component: () => (
    <ProtectedRoute>
      <ProfileProtectedRoute>
        <DashboardPage />
      </ProfileProtectedRoute>
    </ProtectedRoute>
  ),
});
