import { Navigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { studentService } from "@/services/studentService";
import { getDraftByAuthProviderId } from "@/services/studentOnboardingDraftService";

/**
 * Client-side auth + student access guard.
 * Redirects unauthenticated users to /login.
 * Redirects unapproved students away from student pages.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, status } = useAuth();

  const [loading, setLoading] = useState(true);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function checkAccess() {
      if (status === "loading") {
        return;
      }

      if (!user) {
        if (!cancelled) {
          setRedirectTo("/login");
          setLoading(false);
        }
        return;
      }

      const pathname = location.pathname;

      // Never block the onboarding flow itself.
      if (pathname === "/onboarding" || pathname === "/onboarding-submitted") {
        if (!cancelled) {
          setRedirectTo(null);
          setLoading(false);
        }
        return;
      }

      try {
        const profile = await studentService.getProfileByUserId(user.id);

        if (cancelled) return;

        if (profile) {
          setRedirectTo(null);
          setLoading(false);
          return;
        }

        const draft = await getDraftByAuthProviderId(user.id);

        if (cancelled) return;

        if (!draft) {
          setRedirectTo("/onboarding");
          setLoading(false);
          return;
        }

        if (draft.approval_status === "PROFILE_APPROVED" || draft.approval_status === "ACTIVE") {
          setRedirectTo(null);
          setLoading(false);
          return;
        }

        setRedirectTo("/onboarding-submitted");
        setLoading(false);
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          setRedirectTo("/onboarding");
          setLoading(false);
        }
      }
    }

    void checkAccess();

    return () => {
      cancelled = true;
    };
  }, [user, status]);

  if (status === "loading" || loading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex min-h-screen items-center justify-center text-muted-foreground"
      >
        Loading…
      </div>
    );
  }

  if (redirectTo) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
