import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { FirstTimeSetupPage } from "@/pages/FirstTimeSetupPage";

export const Route = createFileRoute("/onboarding")({
  component: () => (
    <ProtectedRoute>
      <FirstTimeSetupPage />
    </ProtectedRoute>
  ),
});
