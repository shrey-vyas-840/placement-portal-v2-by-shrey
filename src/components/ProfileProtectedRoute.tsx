import { Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { isDeveloperEmail } from "@/services/identityPolicyService";
import { getDraftByAuthProviderId } from "@/services/studentOnboardingDraftService";

type Props = {
  children: React.ReactNode;
};

export function ProfileProtectedRoute({ children }: Props) {
  const { user, status } = useAuth();

  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkAccess() {
      if (!user) {
        if (active) setLoading(false);
        return;
      }

      if (isDeveloperEmail(user.email)) {
        if (active) {
          setAllowed(true);
          setLoading(false);
        }
        return;
      }

      try {
        const draft = await getDraftByAuthProviderId(user.id);

        if (!draft) {
          if (active) {
            setAllowed(false);
            setLoading(false);
          }
          return;
        }

        if (!draft.onboarding_completed) {
          if (active) {
            setAllowed(false);
            setLoading(false);
          }
          return;
        }

        if (draft.approval_status !== "PROFILE_APPROVED" && draft.approval_status !== "ACTIVE") {
          if (active) {
            setAllowed(false);
            setLoading(false);
          }
          return;
        }

        if (active) {
          setAllowed(true);
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        if (active) setLoading(false);
      }
    }

    checkAccess();

    return () => {
      active = false;
    };
  }, [user, status]);

  if (status === "loading" || loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowed) {
    return <Navigate to="/onboarding-submitted" replace />;
  }

  return <>{children}</>;
}
