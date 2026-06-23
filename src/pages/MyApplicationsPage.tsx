import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

import { studentApplicationService } from "@/services/studentApplicationService";

export function MyApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);

  async function load() {
    const { data: authData } = await supabase.auth.getUser();

    const authUserId = authData.user?.id;

    if (!authUserId) {
      return;
    }

    const { data: account } = await (supabase as any)
      .from("user_accounts")
      .select("user_id")
      .eq("auth_provider_id", authUserId)
      .maybeSingle();

    if (!account) {
      return;
    }

    const { data: student } = await (supabase as any)
      .from("student_master")
      .select("student_id")
      .eq("user_id", account.user_id)
      .maybeSingle();

    if (!student) {
      return;
    }

    const data = await studentApplicationService.getMyApplications(student.student_id);

    setApplications(data);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div
          className="
        relative
        overflow-hidden
        rounded-3xl
        bg-gradient-to-r
        from-blue-800
        via-blue-700
        to-cyan-600
        p-8
        text-white
        shadow-xl
    "
        >
          <div className="relative z-10">
            <p className="text-xs uppercase tracking-widest text-white/70">Student Workspace</p>

            <h1 className="mt-2 text-4xl font-bold">My Applications</h1>

            <p className="mt-2 text-sm text-white/80">
              Track applications, shortlist progress and hiring status.
            </p>

            <div className="mt-4 inline-flex rounded-full bg-white/20 px-4 py-2 text-sm">
              {applications.length} Applications Submitted
            </div>
          </div>

          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-white/10" />
          <div className="absolute right-10 bottom-0 h-24 w-24 rounded-full bg-white/10" />
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Total Applications
            </p>
            <h3 className="mt-2 text-3xl font-bold">{applications.length}</h3>
          </div>

          <div className="rounded-3xl border bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Applied</p>
            <h3 className="mt-2 text-3xl font-bold text-blue-600">
              {applications.filter((x) => x.application_status === "Applied").length}
            </h3>
          </div>

          <div className="rounded-3xl border bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Shortlisted</p>
            <h3 className="mt-2 text-3xl font-bold text-green-600">
              {applications.filter((x) => x.application_status === "Shortlisted").length}
            </h3>
          </div>

          <div className="rounded-3xl border bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Interview Scheduled
            </p>
            <h3 className="mt-2 text-3xl font-bold text-green-600">
              {applications.filter((x) => x.application_status === "Interview Scheduled").length}
            </h3>
          </div>

          <div className="rounded-3xl border bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Not Selected</p>
            <h3 className="mt-2 text-3xl font-bold text-red-600">
              {applications.filter((x) => x.application_status === "Rejected").length}
            </h3>
          </div>

          <div className="rounded-3xl border bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Selected</p>
            <h3 className="mt-2 text-3xl font-bold text-green-600">
              {applications.filter((x) => x.application_status === "Selected").length}
            </h3>
          </div>
        </div>

        <div
          className="
        mt-8
        grid
        gap-6
     md:grid-cols-2
xl:grid-cols-3
2xl:grid-cols-4
    "
        >
          {applications.map((application) => {
            const company =
              application?.opportunity_master?.drive_master?.company_master?.company_name;

            const drive = application?.opportunity_master?.drive_master;

            return (
              <div
                key={application.application_id}
                className="
                    group
                    rounded-3xl
                    border
                    border-border/50
                    bg-white
                    p-6
                    shadow-sm
                    transition-all
                    duration-300
                    hover:-translate-y-2
hover:shadow-2xl
hover:border-primary/30
                "
              >
                <div className="flex items-start justify-between">
                  <div className="flex gap-3">
                    <div
                      className="
                                flex
                                h-14
                                w-14
                                items-center
                                justify-center
                                rounded-2xl
                                bg-slate-100
                                font-bold
                                text-primary
                            "
                    >
                      {(company?.[0] ?? "C").toUpperCase()}
                    </div>

                    <div>
                      <h3 className="font-bold text-lg">{company ?? "Company"}</h3>

                      <p className="text-xs text-muted-foreground">
                        {application?.opportunity_master?.opportunity_title}
                      </p>
                    </div>
                  </div>

                  <span
                    className={
                      application.application_status === "Shortlisted"
                        ? "rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700"
                        : "rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
                    }
                  >
                    {application.application_status}
                  </span>
                </div>

                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <span
                      className="
            font-medium
            text-blue-700
        "
                    >
                      Package
                    </span>

                    <span
                      className="
            font-semibold
            text-right
            text-slate-900
        "
                    >
                      ₹ {drive?.lowest_package_lpa ?? "-"}
                      {" - "}₹ {drive?.highest_package_lpa ?? "-"} LPA
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Drive Type</span>

                    <span className="font-medium">{drive?.drive_type ?? "-"}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Drive</span>

                    <span className="font-medium">{drive?.drive_name ?? "-"}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Applied</span>

                    <span className="font-medium">
                      {new Date(application.applied_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {applications.length === 0 && (
          <div
            className="
            mt-8
            rounded-3xl
            border
            bg-white
            p-12
            text-center
        "
          >
            <h3 className="text-xl font-semibold">No Applications Yet</h3>

            <p className="mt-2 text-muted-foreground">
              Start applying for opportunities to track them here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
