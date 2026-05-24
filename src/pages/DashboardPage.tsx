import { Link } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { ensureUserProvisioned } from "@/services/provisionService";

export function DashboardPage() {
  const { user } = useAuth();

  useEffect(() => {
    ensureUserProvisioned().catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-semibold text-foreground">
          Welcome{user?.email ? `, ${user.email}` : ""}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Phase 1 foundation — auth, session persistence, and protected
          routing are live.
        </p>

        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          <Link
            to="/profile"
            className="rounded-lg border border-border bg-card p-5 transition hover:border-primary/40"
          >
            <h2 className="text-base font-medium text-foreground">
              Student Profile
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              View and edit your profile details.
            </p>
          </Link>
        </section>
      </main>
    </div>
  );
}
