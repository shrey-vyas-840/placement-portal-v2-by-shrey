import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ensureUserProvisioned } from "@/services/provisionService";
import { canAccessPortal, getLandingRoute } from "@/services/identityPolicyService";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuth = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Auth callback error:", error);
        navigate({ to: "/login", replace: true });
        return;
      }

      const session = data.session;

      if (!session) {
        navigate({ to: "/login", replace: true });
        return;
      }

      if (!canAccessPortal(session.user?.email)) {
        await supabase.auth.signOut();
        navigate({ to: "/login", replace: true });
        return;
      }

      try {
        await ensureUserProvisioned();

        navigate({
          to: getLandingRoute(session.user?.email),
          replace: true,
        });
      } catch (err) {
        console.error("Provisioning failed", err);

        await supabase.auth.signOut();

        navigate({
          to: "/login",
          replace: true,
        });
      }
    };

    handleAuth();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      Signing you in...
    </div>
  );
}