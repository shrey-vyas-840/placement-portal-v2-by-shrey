import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";

import { Building2, Download, Loader2, Search } from "lucide-react";

import { recruitmentRegisterService } from "@/services/recruitmentRegisterService";

export function AdminRecruitmentRegisterPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  const [recruitments, setRecruitments] = useState<any[]>([]);

  const [search, setSearch] = useState("");

  async function loadRecruitments() {
    try {
      setLoading(true);

      const data = await recruitmentRegisterService.getRecruitments();

      setRecruitments(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRecruitments();
  }, []);

  const filteredRecruitments = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return recruitments;

    return recruitments.filter((item: any) =>
      [item.company?.company_name, item.drive_name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword),
    );
  }, [recruitments, search]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1600px] px-6 py-8">
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-primary/10 p-4">
              <Building2 className="h-8 w-8 text-primary" />
            </div>

            <div>
              <h1 className="text-3xl font-bold">Recruitment Register</h1>

              <p className="mt-1 text-sm text-muted-foreground">
                Operational register for every recruitment in the placement system.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search company or recruitment..."
                className="w-80 rounded-xl border bg-background py-2 pl-10 pr-4 outline-none transition focus:border-primary"
              />
            </div>

            <button
              type="button"
              className="flex items-center justify-center gap-2 rounded-xl border bg-card px-4 py-2 transition hover:bg-muted"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border bg-card">
          <div className="border-b px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Recruitments</h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  One row represents one recruitment.
                </p>
              </div>

              <div className="text-sm text-muted-foreground">
                {filteredRecruitments.length} Recruitments
              </div>
            </div>
          </div>

          <div className="max-h-[85vh] overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredRecruitments.length === 0 ? (
              <div className="py-20 text-center text-muted-foreground">No recruitments found.</div>
            ) : (
              <table className="w-full border-collapse">
                <thead className="sticky top-0 z-20 bg-background">
                  <tr className="border-b bg-muted/40">
                    <th className="px-5 py-3 text-left font-semibold">Company</th>

                    <th className="px-5 py-3 text-left font-semibold">Roles</th>

                    <th className="px-5 py-3 text-left font-semibold">Eligible Branches</th>

                    <th className="px-5 py-3 text-left font-semibold">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRecruitments.map((item: any) => {
                    const companyName = item.company?.company_name ?? "—";

                    const roleNames = item.roleNames ?? [];

                    const branches = item.eligibleBranches ?? [];

                    const status = item.lifecycleStatus ?? "Unknown";

                    return (
                      <tr
                        key={item.drive_id}
                        className="cursor-pointer border-b transition-all hover:bg-primary/5"
                        onClick={() => {
                          // Navigation will be wired after
                          // Register feature is completed.
                        }}
                      >
                       <td className="w-[24%] px-5 py-4 align-top">
                         <div className="text-[15px] font-semibold">{companyName}</div>

                          <div className="mt-1 text-sm text-muted-foreground">
                            {item.drive_name}
                          </div>
                        </td>

                        <td className="w-[26%] px-5 py-4 align-top">
                          {roleNames.length === 0 ? (
                            <span className="text-sm text-muted-foreground">—</span>
                          ) : (
                            <div className="space-y-1">
                              {roleNames.map((role: string) => (
                                <div key={role} className="text-sm leading-5">
                                  • {role}
                                </div>
                              ))}
                            </div>
                          )}
                        </td>

                        <td className="w-[38%] px-5 py-4 align-top">
                          {branches.length === 0 ? (
                            <span className="text-sm text-muted-foreground">—</span>
                          ) : (
                            <div className="space-y-1">
                              {branches.map((branch: string) => (
                                <div
                                  key={branch}
                                  className="text-sm leading-5 text-muted-foreground"
                                >
                                  • {branch}
                                </div>
                              ))}
                            </div>
                          )}
                        </td>

                        <td className="w-[12%] px-5 py-4 align-top">
                          <span
    className={`
        inline-flex
        rounded-full
        px-3
        py-1
        text-xs
        font-medium
        whitespace-nowrap

        ${
            status === "Registration Open"
                ? "bg-green-100 text-green-700"

            : status === "Upcoming"
                ? "bg-blue-100 text-blue-700"

            : status === "Registration Closed"
                ? "bg-slate-100 text-slate-700"

            : "bg-amber-100 text-amber-700"
        }
    `}
>
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
