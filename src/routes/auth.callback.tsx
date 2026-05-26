import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ensureUserProvisioned } from "@/services/provisionService";

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
        navigate({ to: "/login" });
        return;
      }

      if (data.session) {
  try {
    await ensureUserProvisioned();

    console.log(
      "User provisioning completed",
    );

    navigate({
      to: "/dashboard",
    });
  } catch (err) {
    console.error(
      "Provisioning failed",
      err,
    );

    navigate({
      to: "/login",
    });
  }
} else {
  navigate({
    to: "/login",
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