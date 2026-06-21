import { createFileRoute } from "@tanstack/react-router";
import { OnboardingSubmittedPage } from "@/pages/OnboardingSubmittedPage";

export const Route = createFileRoute(
  "/onboarding-submitted",
)({
  component: OnboardingSubmittedPage,
});