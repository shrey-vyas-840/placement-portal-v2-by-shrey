import { Link } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { ensureUserProvisioned } from "@/services/provisionService";
import { profileCompletionService } from "@/services/profileCompletionService";
import { studentService } from "@/services/studentService";
import { rbacService } from "@/services/rbacService";
import { useNavigate } from "@tanstack/react-router";


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
      percentage: 0,
    });

  useEffect(() => {
    async function init() {
      try {
        await ensureUserProvisioned();

        if (!user) return;

        const role =
          await rbacService.getCurrentUserRole(
            user.id,
          );

        const progress =
          await profileCompletionService.getCompletion(
            user.id,
          );
        setCompletion(progress);

        const profile =
          await studentService.getProfileByUserId(
            user.id,
          );

        const navigate =
          useNavigate();

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
            </div>
          </div>

          <Link
            to="/admin"
            className="rounded-lg border border-border bg-card p-5 transition hover:border-primary/40"
          >
            <h2 className="text-base font-medium text-foreground">
              Admin Dashboard
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Open admin panel.
            </p>
          </Link>

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

          <Link
            to="/opportunities"
            className="rounded-lg border border-border bg-card p-5 transition hover:border-primary/40"
          >
            <h2 className="text-base font-medium text-foreground">
              Opportunities
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              View available placement opportunities.
            </p>
          </Link>

          <Link
            to="/my-applications"
            className="rounded-lg border border-border bg-card p-5 transition hover:border-primary/40"
          >
            <h2 className="text-base font-medium text-foreground">
              My Applications
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Track your placement applications.
            </p>
          </Link>

          <Link
            to="/student/noc"
            className="rounded-lg border border-border bg-card p-5 transition hover:border-primary/40"
          >
            <h2 className="text-base font-medium text-foreground">
              NOC Requests
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Submit and track your NOC requests.
            </p>
          </Link>

        </section>
      </main>
    </div>
  );

}
