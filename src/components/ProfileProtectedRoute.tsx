import { Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { studentService } from "@/services/studentService";
import { getOnboardingByStudentId } from "@/services/studentOnboardingService";
import { isDeveloperEmail } from "@/services/identityPolicyService";

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
        const profile = await studentService.getProfileByUserId(user.id);

        if (!profile) {
          if (active) {
            setAllowed(false);
            setLoading(false);
          }
          return;
        }

        const onboarding = await getOnboardingByStudentId(profile.student_id);

        if (
          !onboarding ||
          onboarding.onboarding_status !== "COMPLETED"
        ) {
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
  }, [user]);

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowed && !isDeveloperEmail(user.email)) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}