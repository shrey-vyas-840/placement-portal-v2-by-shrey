import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { OnboardingSubmittedPage } from "@/pages/OnboardingSubmittedPage";
import { getDraftByAuthProviderId } from "@/services/studentOnboardingDraftService";

function ProtectedOnboardingSubmitted() {
  const { user } = useAuth();

  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    async function load() {
      if (!user) {
        setAllowed(false);
        return;
      }

      const draft =
        await getDraftByAuthProviderId(user.id);

      if (!draft) {
        setAllowed(false);
        return;
      }

      const hasSubmitted =
        draft.onboarding_completed === true;

      setAllowed(hasSubmitted);
    }

    load();
  }, [user]);

  if (allowed === null) {
    return <div>Loading...</div>;
  }

  if (!allowed) {
    return (
      <Navigate
        to="/onboarding"
        replace
      />
    );
  }

  return <OnboardingSubmittedPage />;
}

export const Route = createFileRoute(
  "/onboarding-submitted",
)({
  component: ProtectedOnboardingSubmitted,
});