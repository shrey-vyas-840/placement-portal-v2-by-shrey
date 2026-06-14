import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ensureUserProvisioned } from "@/services/provisionService";
import { profileCompletionService } from "@/services/profileCompletionService";
import { studentService } from "@/services/studentService";
import { rbacService } from "@/services/rbacService";
import { getMyStudentDrilldown } from "@/services/studentDashboardAnalyticsService";
import { StudentAnalyticsSection } from "@/components/dashboard/StudentAnalyticsSection";

function SidebarLink({
  to,
  label,
  description,
}: {
  to: string;
  label: string;
  description: string;
}) {
  return (
    <Link
      to={to}
      className="block rounded-2xl border border-border bg-card p-4 transition hover:border-primary/40 hover:bg-muted/20"
    >
      <div className="font-medium text-foreground">{label}</div>
      <div className="mt-1 text-xs text-muted-foreground">{description}</div>
    </Link>
  );
}

export function DashboardPage() {
  const { user } = useAuth();

  const [completionName, setCompletionName] = useState("");
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  const [completion, setCompletion] = useState({
    profile: false,
    resume: false,
    academics: false,
    skills: false,
    percentage: 0,
  });

  const [dashboard, setDashboard] = useState({
    appliedCount: 0,
    shortlistedCount: 0,
    attendancePresent: 0,
    attendanceAbsent: 0,
    attendancePercentage: 0,
    recentApplications: [] as Array<{
      application_id: string;
      opportunity_title: string;
      application_status: string;
      applied_at: string;
    }>,
  });

  const [studentAnalytics, setStudentAnalytics] = useState<any>(null);

  useEffect(() => {
    async function init() {
      try {
        await ensureUserProvisioned();

        if (!user) return;

        await rbacService.getCurrentUserRole(user.id);

        const progress = await profileCompletionService.getCompletion(user.id);
        setCompletion(progress);

        const profile = await studentService.getProfileByUserId(user.id);

        if (profile) {
          setCompletionName(`${profile.first_name} ${profile.last_name}`);

          const metrics = await studentService.getDashboardMetrics(user.id);
          setDashboard(metrics);

          setAnalyticsLoading(true);
          const report = await getMyStudentDrilldown(user.id);
          setStudentAnalytics(report);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
        setAnalyticsLoading(false);
      }
    }

    init();
  }, [user]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }
  const profileCompleted =
    completion.percentage >= 100;

  const profileAndApplicationsBlock = (
    <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">

      <div className="rounded-2xl border border-border bg-card p-5">
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

      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-lg font-semibold">
          Recent Applications
        </h2>

        <div className="mt-3 space-y-3">
          {dashboard.recentApplications.map((item) => (
            <div
              key={item.application_id}
              className="rounded-lg border border-border p-3"
            >
              <div className="font-medium">
                {item.opportunity_title}
              </div>

              <div className="text-sm text-muted-foreground">
                {item.application_status}
              </div>
            </div>
          ))}

          {dashboard.recentApplications.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No applications yet.
            </div>
          ) : null}
        </div>
      </div>

    </div>
  );

  return (
    <div className="min-h-screen bg-background lg:flex">
      <aside className="border-r border-border bg-card p-4 lg:w-80">
        <div className="mb-6">
          <div className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Placement Portal
          </div>
          <div className="mt-1 text-xl font-bold text-foreground">Student Dashboard</div>
          <p className="mt-2 text-sm text-muted-foreground">
            Welcome{completionName ? `, ${completionName}` : ""}.
          </p>
        </div>

        <div className="space-y-3">
          <SidebarLink to="/dashboard" label="Dashboard" description="Your overview and analytics." />
          <SidebarLink to="/profile" label="Profile" description="Update your personal details." />
          <SidebarLink to="/opportunities" label="Opportunities" description="Browse available roles." />
          <SidebarLink to="/my-applications" label="My Applications" description="Track your applications." />
          <SidebarLink to="/student/noc" label="NOC Requests" description="Submit and track NOC status." />
        </div>
      </aside>

      <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-foreground">
          Welcome{completionName ? `, ${completionName}` : ""}
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Manage your profile, documents and placement activities through the Placement Portal.
        </p>

        {!profileCompleted && (
          <div className="mt-8">
            {profileAndApplicationsBlock}
          </div>
        )}

        <section className="mt-8 grid gap-4">

          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-lg font-semibold">My Placement Analytics</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              This section is loaded only for your own student profile.
            </p>

            <div className="mt-5">

              <StudentAnalyticsSection
                report={studentAnalytics}
                loading={analyticsLoading}
              />

              {profileCompleted && (
                <div className="mt-6">
                  {profileAndApplicationsBlock}
                </div>
              )}

            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
