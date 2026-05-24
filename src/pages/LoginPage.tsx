import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export function LoginPage() {
  const { signInWithGoogle, status } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      navigate({ to: "/dashboard", replace: true });
    }
  }, [status, navigate]);

  const handleGoogleSignIn = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await signInWithGoogle();
      // Browser may redirect; otherwise auth state listener navigates.
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed");
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-foreground">
          Placement Portal
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in to access your student dashboard.
        </p>

        <div className="mt-6">
          <Button
            type="button"
            className="w-full"
            onClick={handleGoogleSignIn}
            disabled={submitting}
            aria-label="Sign in with Google"
          >
            {submitting ? "Redirecting…" : "Continue with Google"}
          </Button>
        </div>

        {error && (
          <p
            role="alert"
            className="mt-4 text-sm text-destructive"
          >
            {error}
          </p>
        )}
      </div>
    </main>
  );
}
