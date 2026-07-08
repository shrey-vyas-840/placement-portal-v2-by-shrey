import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { OnboardingSubmittedPage } from "@/pages/OnboardingSubmittedPage";
import { getDraftByAuthProviderId } from "@/services/studentOnboardingDraftService";

function ProtectedOnboardingSubmitted() {
  const { user } = useAuth();

  const [redirectTo, setRedirectTo] = useState<string | null>(null);
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    async function load() {
      if (!user) {
        setRedirectTo("/login");
        setAllowed(false);
        return;
      }

      const draft = await getDraftByAuthProviderId(user.id);

      if (!draft) {
        setRedirectTo("/onboarding");
        setAllowed(false);
        return;
      }

      if (draft.approval_status === "PROFILE_APPROVED" || draft.approval_status === "ACTIVE") {
        setRedirectTo("/");
        setAllowed(false);
        return;
      }

      setAllowed(true);
    }

    load();
  }, [user]);

  if (redirectTo) {
    return <Navigate to={redirectTo} replace />;
  }

  if (allowed === null) {
    return <div>Loading...</div>;
  }

  return <OnboardingSubmittedPage />;
}

export const Route = createFileRoute("/onboarding-submitted")({
  component: ProtectedOnboardingSubmitted,
});
