import { Link } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { ensureUserProvisioned } from "@/services/provisionService";
import { profileCompletionService } from "@/services/profileCompletionService";
import { studentService } from "@/services/studentService";

export function DashboardPage() {
  const { user } = useAuth();
  const [completionName, setCompletionName] =
    useState("");

  const [completion, setCompletion] =
    useState({
      profile: false,
      resume: false,
      academics: false,
      skills: false,
      certifications: false,
      percentage: 0,
    });

  useEffect(() => {
    async function init() {
      try {
        await ensureUserProvisioned();

        if (!user) return;

        const progress =
          await profileCompletionService.getCompletion(
            user.id,
          );

        setCompletion(progress);

        const profile =
          await studentService.getProfileByUserId(
            user.id,
          );

        if (profile) {
          setCompletionName(
            `${profile.first_name} ${profile.last_name}`
          );
        }
      } catch (err) {
        console.error(err);
      }
    }

    init();
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-semibold text-foreground">
          Welcome
          {completionName
            ? `, ${completionName}`
            : ""}
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Manage your profile, documents and placement activities through the Placement Portal.
        </p>

        <section className="mt-8 grid gap-4">
          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-lg font-semibold">
              Profile Completion
            </h2>

            <p className="mt-2 text-3xl font-bold">
              {completion.percentage}%
            </p>

            <div className="mt-4 space-y-2 text-sm">
              <div>
                {completion.profile ? "✓" : "✗"} Basic Profile
              </div>

              <div>
                {completion.resume ? "✓" : "✗"} Resume
              </div>

              <div>
                {completion.academics ? "✓" : "✗"} Academic Details
              </div>

              <div>
                {completion.skills ? "✓" : "✗"} Skills Profile
              </div>

              <div>
                {completion.certifications ? "✓" : "✗"} Certifications
              </div>
            </div>
          </div>

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
