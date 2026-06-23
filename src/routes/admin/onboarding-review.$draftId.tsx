import { createFileRoute } from "@tanstack/react-router";

import { AdminProtectedRoute } from "@/components/AdminProtectedRoute";

import { AdminOnboardingReviewPage } from "@/pages/AdminOnboardingReviewPage";

export const Route =
  createFileRoute(
    "/admin/onboarding-review/$draftId",
  )({
    component: ReviewRoute,
  });

function ReviewRoute() {
  const { draftId } =
    Route.useParams();

  return (
    <AdminProtectedRoute>
      <AdminOnboardingReviewPage
        draftId={draftId}
      />
    </AdminProtectedRoute>
  );
}