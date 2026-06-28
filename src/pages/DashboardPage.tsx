import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

import { profileCompletionService } from "@/services/profileCompletionService";
import { studentService } from "@/services/studentService";
import { rbacService } from "@/services/rbacService";
import { getMyStudentDrilldown } from "@/services/studentDashboardAnalyticsService";
import { StudentAnalyticsSection } from "@/components/dashboard/StudentAnalyticsSection";
import { PortalFooter } from "@/components/PortalFooter";

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
      activeProps={{
        className: "border-primary/20 bg-primary/5 shadow-md",
      }}
      className="
        group
        relative
        block
        overflow-hidden
        rounded-2xl
        border
        border-border
        bg-card
        p-4
        transition-all
        duration-200
        hover:-translate-y-0.5
        hover:border-primary/30
        hover:shadow-lg
      "
    >
      <div
        className="
          absolute
          left-0
          top-0
          h-full
          w-1
          bg-primary
          opacity-0
          transition-opacity
          group-hover:opacity-100
        "
      />

      <div className="font-semibold text-foreground">{label}</div>

      <div className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</div>
    </Link>
  );
}

export function DashboardPage() {
  const { user } = useAuth();

  console.log("AUTH USER", user);
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

    placementStatus: "Unplaced",

    placementPreference: "Interested",

    placedCompany: null as string | null,

    placedPackage: null as number | null,

    placementType: null as string | null,

    placedAt: null as string | null,

    restrictionActive: false,

    restrictionType: null as string | null,

    restrictionReason: null as string | null,

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
        if (!user) return;

        await rbacService.getCurrentUserRole(user.id);

        const progress = await profileCompletionService.getCompletion(user.id);
        setCompletion(progress);

        const profile = await studentService.getProfileByUserId(user.id);

        if (profile) {
          setCompletionName(`${profile.first_name} ${profile.last_name}`);

          const metrics = await studentService.getDashboardMetrics(user.id);
          console.log("Dashboard Metrics", metrics);
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

  const profileCompleted = completion.percentage >= 100;

  const showPlacedBanner = dashboard.placementStatus === "Placed";

  const showRestrictionBanner = !showPlacedBanner && dashboard.restrictionActive;

  const showPreferenceBanner =
    !showPlacedBanner && !showRestrictionBanner && dashboard.placementPreference !== "Interested";

  const profileAndApplicationsBlock = (
    <div className="max-w-md">
      {!profileCompleted && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-lg font-semibold">Profile Completion</h2>

          <p className="mt-2 text-3xl font-bold">{completion.percentage}%</p>

          <div className="mt-4 space-y-2 text-sm">
            <div>{completion.profile ? "✓" : "✗"} Basic Profile</div>
            <div>{completion.resume ? "✓" : "✗"} Resume</div>
            <div>{completion.academics ? "✓" : "✗"} Academic Details</div>
            <div>{completion.skills ? "✓" : "✗"} Skills Profile</div>
          </div>
        </div>
      )}
    </div>
  );

  const formatRestrictionType = (type: string | null) => {
    if (!type) return "-";

    return type
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const formatPlacementDate = (date: string | null) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-background lg:flex">
      <aside
        className="
    border-r
    border-border/60
    bg-white/70
    backdrop-blur-xl
    p-5
    lg:w-80
  "
      >
        <div className="mb-6">
          <div className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
            Indus Placement Nexus
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            Student Workspace
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Welcome{completionName ? `, ${completionName}` : ""}.
          </p>
        </div>

        <div
          className="
    mb-6
    overflow-hidden
    rounded-3xl
    border
    border-primary/10
    bg-gradient-to-br
    from-primary
    to-blue-700
    p-5
    text-white
  "
        >
          <div
            className="
      flex
      h-12
      w-12
      items-center
      justify-center
      rounded-2xl
      bg-white/20
      text-lg
      font-bold
    "
          >
            {completionName?.charAt(0) || "S"}
          </div>

          <div className="mt-4">
            <div className="font-semibold">{completionName}</div>

            <div className="text-sm text-white/70">Student</div>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between text-xs">
              <span>Profile Completion</span>
              <span>{completion.percentage}%</span>
            </div>

            <div className="mt-2 h-2 rounded-full bg-white/20">
              <div
                className="h-2 rounded-full bg-white"
                style={{
                  width: `${completion.percentage}%`,
                }}
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <SidebarLink
            to="/dashboard"
            label="Dashboard"
            description="Your overview and analytics."
          />
          <SidebarLink to="/profile" label="Profile" description="Update your personal details." />
          <SidebarLink
            to="/opportunities"
            label="Opportunities"
            description="Browse available roles."
          />
          <SidebarLink
            to="/my-applications"
            label="My Applications"
            description="Track your applications."
          />
          <SidebarLink
            to="/student/noc"
            label="NOC Requests"
            description="Submit and track NOC status."
          />
        </div>
      </aside>

      <main className="flex-1 px-6 py-10 sm:px-8 lg:px-10">
        {showPlacedBanner && (
          <div className="mb-8 rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50 p-8 shadow-sm">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
              Placement Successful
            </div>

            <h2 className="mt-3 text-3xl font-bold text-emerald-900">🎉 Congratulations!</h2>

            <p className="mt-4 text-lg leading-8 text-emerald-800">
              Congratulations on your successful placement at{" "}
              <strong>{dashboard.placedCompany}</strong>. Your dedication and hard work have paid
              off. We wish you continued success in your professional journey.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border bg-white p-4">
                <div className="text-xs uppercase text-muted-foreground">Company</div>

                <div className="mt-1 font-semibold">{dashboard.placedCompany}</div>
              </div>

              <div className="rounded-xl border bg-white p-4">
                <div className="text-xs uppercase text-muted-foreground">Package</div>

                <div className="mt-1 font-semibold">
                  {dashboard.placedPackage != null
                    ? `${Number(dashboard.placedPackage).toFixed(2)} LPA`
                    : "-"}
                </div>
              </div>

              <div className="rounded-xl border bg-white p-4">
                <div className="text-xs uppercase text-muted-foreground">Placement Type</div>

                <div className="mt-1 font-semibold">{dashboard.placementType}</div>
              </div>

              <div className="rounded-xl border bg-white p-4">
                <div className="text-xs uppercase text-muted-foreground">Placement Date</div>

                <div className="mt-1 font-semibold">{formatPlacementDate(dashboard.placedAt)}</div>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-emerald-200 bg-white p-4 text-sm text-emerald-800">
              Thank you for actively participating in the campus placement process. Further
              applications have been disabled. We wish you continued success in your professional
              journey.
            </div>
          </div>
        )}

        {showRestrictionBanner && (
          <div className="mb-8 rounded-3xl border border-red-200 bg-red-50 p-8">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-red-700">
              Placement Restriction
            </div>

            <h2 className="mt-3 text-3xl font-bold text-red-900">Applications Restricted</h2>

            <div className="mt-6 rounded-xl border bg-white p-5">
              <div className="rounded-xl border bg-red-50 p-4">
                <div className="text-xs uppercase tracking-wider text-red-600">
                  Restriction Type
                </div>

                <div className="mt-1 text-lg font-semibold text-red-900">
                  {formatRestrictionType(dashboard.restrictionType)}
                </div>
              </div>

              <div className="mt-4 rounded-xl border bg-background p-4">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Reason</div>

                <div className="mt-1 text-base">{dashboard.restrictionReason}</div>
              </div>
            </div>

            <p className="mt-5 text-red-800">
              Please contact the Training & Placement Cell for further assistance.
            </p>
          </div>
        )}

        {showPreferenceBanner && (
          <div className="mb-8 rounded-3xl border border-amber-300 bg-amber-50 p-8">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
              Placement Participation
            </div>

            <h2 className="mt-3 text-3xl font-bold text-amber-900">
              Placement Participation Disabled
            </h2>

            <div className="mt-5 rounded-xl border bg-white p-4">
              <div className="text-xs uppercase tracking-wider text-amber-700">
                Current Placement Preference
              </div>

              <div className="mt-2 text-lg font-bold text-amber-900">
                {dashboard.placementPreference}
              </div>
            </div>

            <div className="mt-6 rounded-xl border bg-white p-5">
              To change your placement preference, please visit the
              <div className="mt-4 font-semibold">Training & Placement Cell</div>
              <div className="text-sm text-muted-foreground">
                1st Floor,
                <br />
                Main Building,
                <br />
                Near MBA Seminar Hall
              </div>
            </div>
          </div>
        )}

        {!showPlacedBanner && !showRestrictionBanner && !showPreferenceBanner && (
          <div
            className="
    relative
    overflow-hidden
    rounded-[32px]
    border
    border-primary/10
    bg-gradient-to-r
    from-primary
    via-blue-700
    to-cyan-600
    p-8
    text-white
    shadow-xl
  "
          >
            <div className="relative z-10">
              <div className="text-sm font-medium text-white/80">Student Workspace</div>

              <h1 className="mt-2 text-4xl font-bold tracking-tight">
                Welcome{completionName ? `, ${completionName}` : ""}
              </h1>

              <p className="mt-3 max-w-2xl text-white/80">
                Track opportunities, applications, placement progress, attendance and NOC activities
                from a single workspace.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to="/opportunities"
                  className="
          rounded-xl
          bg-white
          px-4
          py-2
          text-sm
          font-semibold
          text-primary
        "
                >
                  Browse Opportunities
                </Link>

                <Link
                  to="/profile"
                  className="
          rounded-xl
          border
          border-white/30
          px-4
          py-2
          text-sm
          font-semibold
          text-white
        "
                >
                  View Profile
                </Link>
              </div>
            </div>

            <div
              className="
      absolute
      -right-20
      -top-20
      h-72
      w-72
      rounded-full
      bg-white/10
    "
            />

            <div
              className="
      absolute
      right-16
      bottom-0
      h-40
      w-40
      rounded-full
      bg-cyan-300/10
    "
            />
          </div>
        )}

        {!profileCompleted && <div className="mt-8">{profileAndApplicationsBlock}</div>}

        {profileCompleted &&
          !studentAnalytics &&
          !showPlacedBanner &&
          !showRestrictionBanner &&
          !showPreferenceBanner && (
            <div className="mt-8 rounded-lg border border-border bg-card p-5">
              <div className="rounded-3xl border border-dashed border-primary/20 bg-primary/5 p-10 text-center">
                <div className="mx-auto max-w-2xl">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                    Placement Ready
                  </div>

                  <h3 className="mt-3 text-3xl font-bold">Your Profile Is Complete 🚀</h3>

                  <p className="mt-4 text-muted-foreground">
                    Participate in your first campus opportunity to unlock placement analytics,
                    attendance tracking, application insights and participation history.
                  </p>

                  <Link
                    to="/opportunities"
                    className="mt-6 inline-flex rounded-xl bg-primary px-6 py-3 font-medium text-white"
                  >
                    Browse Opportunities
                  </Link>
                </div>
              </div>
            </div>
          )}

        {profileCompleted && studentAnalytics && !showPlacedBanner && (
          <section className="mt-8 grid gap-4">
            <div className="rounded-lg border border-border bg-card p-5">
              <h2 className="text-lg font-semibold">My Placement Analytics</h2>

              <p className="mt-1 text-sm text-muted-foreground">
                This section is loaded only for your own student profile.
              </p>

              <StudentAnalyticsSection report={studentAnalytics} loading={analyticsLoading} />
            </div>
          </section>
        )}

        <PortalFooter />
      </main>
    </div>
  );
}
