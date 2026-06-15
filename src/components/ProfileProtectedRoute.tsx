import { useEffect, useState } from "react";
import { Navigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { profileStatusService } from "@/services/profileStatusService";
import { isDeveloperEmail } from "@/services/identityPolicyService";

type Props = {
  children: React.ReactNode;
};

export function ProfileProtectedRoute({
  children,
}: Props) {
  const { user, status } = useAuth();

  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkProfile() {
      if (!user) {
        setLoading(false);
        return;
      }

      if (isDeveloperEmail(user.email)) {
        if (active) {
          setHasProfile(true);
          setLoading(false);
        }
        return;
      }

      try {
        const exists = await profileStatusService.hasProfile(user.id);

        if (active) {
          setHasProfile(exists);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    checkProfile();

    return () => {
      active = false;
    };
  }, [user]);

  if (status === "loading" || loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (isDeveloperEmail(user.email)) {
    return <>{children}</>;
  }

  if (!hasProfile) {
    return <Navigate to="/profile" replace />;
  }

  return <>{children}</>;
}