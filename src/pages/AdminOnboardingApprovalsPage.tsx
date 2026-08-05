import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  getPendingOnboardingDrafts,
  searchOnboardingStudents,
} from "@/services/adminOnboardingService";

import { approveOnboardingDraft } from "@/services/studentOnboardingDraftService";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { authService } from "@/services/authService";

export function AdminOnboardingApprovalsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [interestedSearch, setInterestedSearch] = useState("");
  const [changedSearch, setChangedSearch] = useState("");
  const [optedOutSearch, setOptedOutSearch] = useState("");
  const [approvedSearch, setApprovedSearch] = useState("");
  const [rejectedSearch, setRejectedSearch] = useState("");

  const [interestedStatus, setInterestedStatus] = useState("ALL");
  const [changedStatus, setChangedStatus] = useState("ALL");
  const [optedOutStatus, setOptedOutStatus] = useState("ALL");
  const [approvedStatus, setApprovedStatus] = useState("ALL");
  const [rejectedStatus, setRejectedStatus] = useState("ALL");

  const [currentView, setCurrentView] = useState<
    "interested" | "changed" | "optedout" | "approved" | "rejected"
  >("interested");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [globalSearch, setGlobalSearch] = useState("");
  const [globalResults, setGlobalResults] = useState<any[]>([]);
  const [globalLoading, setGlobalLoading] = useState(false);

  const activeRows = rows.filter(
    (row) =>
      row.approval_status !== "PROFILE_APPROVED" && row.approval_status !== "PROFILE_REJECTED",
  );

  const uncategorizedStudents = activeRows.filter((row) => {
    const registry = row.registry_snapshot?.placement_preference_text?.toLowerCase() ?? "";

    const student = row.edited_profile?.placement_preference?.toLowerCase() ?? "";

    const isInterested =
      registry.includes("opt") && registry.includes("in") && student === "interested";

    const isChanged =
      registry.includes("opt") && registry.includes("in") && student !== "interested";

    const isOptedOut = registry.includes("out");

    return !isInterested && !isChanged && !isOptedOut;
  });

  const interestedStudents = activeRows.filter((row) => {
    const registry = row.registry_snapshot?.placement_preference_text?.toLowerCase() ?? "";

    const student = row.edited_profile?.placement_preference?.toLowerCase() ?? "";

    return registry.includes("opt") && registry.includes("in") && student === "interested";
  });

  const changedPreferenceStudents = activeRows.filter((row) => {
    const registry = row.registry_snapshot?.placement_preference_text?.toLowerCase() ?? "";

    const student = row.edited_profile?.placement_preference?.toLowerCase() ?? "";

    return registry.includes("opt") && registry.includes("in") && student !== "interested";
  });

  const optedOutStudents = activeRows.filter((row) => {
    const registry = row.registry_snapshot?.placement_preference_text?.toLowerCase() ?? "";

    return registry.includes("out");
  });

  const approvedStudents = rows.filter((row) => row.approval_status === "PROFILE_APPROVED");

  const rejectedStudents = rows.filter((row) => row.approval_status === "PROFILE_REJECTED");

  useEffect(() => {
    async function load() {
      const result = await getPendingOnboardingDrafts();

      setRows(result.rows);

      setLoading(false);
    }

    void load();
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        if (!globalSearch.trim()) {
          setGlobalResults([]);
          return;
        }

        setGlobalLoading(true);

        const data = await searchOnboardingStudents(globalSearch);

        setGlobalResults(data);
      } finally {
        setGlobalLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [globalSearch]);

  if (loading) {
    return <div className="mx-auto max-w-[1600px] space-y-6 p-6">Loading...</div>;
  }

  return (
    <AdminLayout
      title="Onboarding"
      description="Review, approve and manage every student onboarding request from one centralized workspace."
    >
      <div className="mx-auto max-w-[1900px] space-y-6">
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
            <p className="text-xs uppercase tracking-widest text-white/70">
              Administration Workspace
            </p>

            <h1 className="mt-2 text-4xl font-bold">Onboarding Approvals</h1>

            <p className="mt-2 text-sm text-white/80">
              Review, approve and manage every student onboarding request from one centralized
              workspace.
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              <div className="rounded-full bg-white/20 px-4 py-2 text-sm font-medium">
                Pending Review : {activeRows.length}
              </div>

              <div className="rounded-full bg-white/20 px-4 py-2 text-sm font-medium">
                Approved : {approvedStudents.length}
              </div>

              <div className="rounded-full bg-white/20 px-4 py-2 text-sm font-medium">
                Rejected : {rejectedStudents.length}
              </div>
            </div>
          </div>

          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-white/10" />
          <div className="absolute bottom-0 right-10 h-24 w-24 rounded-full bg-white/10" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <div className="rounded-3xl border border-violet-400 bg-white p-5 shadow-sm transition hover:shadow-md">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-600">
              Pending Review
            </div>

            <div className="mt-3 text-5xl font-bold tracking-tight">{activeRows.length}</div>

            <div className="mt-2 text-sm text-slate-500">Awaiting administrator review</div>
          </div>

          <div className="rounded-2xl border border-emerald-400 bg-white p-5 shadow-sm transition hover:shadow-md">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-600">
              Opted - IN
            </div>

            <div className="mt-3 text-5xl font-bold tracking-tight">
              {interestedStudents.length}
            </div>

            <div className="mt-2 text-sm text-slate-500">Ready for approval</div>
          </div>

          <div className="rounded-2xl border border-amber-400 bg-white p-5 shadow-sm transition hover:shadow-md">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-600">
              Preference Changed
            </div>

            <div className="mt-3 text-5xl font-bold tracking-tight">
              {changedPreferenceStudents.length}
            </div>

            <div className="mt-2 text-sm text-slate-500">Requires administrator review</div>
          </div>

          <div className="rounded-2xl border border-orange-400 bg-white p-5 shadow-sm transition hover:shadow-md">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-orange-600">
              Opted-Out
            </div>

            <div className="mt-3 text-5xl font-bold tracking-tight">{optedOutStudents.length}</div>

            <div className="mt-2 text-sm text-slate-500">Students not seeking placements</div>
          </div>
          <div className="rounded-2xl border border-green-400 bg-white p-5 shadow-sm transition hover:shadow-md">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-green-600">
              Approved
            </div>

            <div className="mt-3 text-5xl font-bold tracking-tight">{approvedStudents.length}</div>

            <div className="mt-2 text-sm text-slate-500">Successfully approved</div>
          </div>

          <div className="rounded-2xl border border-red-400 bg-white p-5 shadow-sm transition hover:shadow-md">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-red-600">
              Rejected
            </div>

            <div className="mt-3 text-5xl font-bold tracking-tight">{rejectedStudents.length}</div>

            <div className="mt-2 text-sm text-slate-500">Approval declined</div>
          </div>
        </div>

        <div
          className="
rounded-[30px]
border
border-blue-200
bg-white
p-6
shadow-md
"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-2xl">
              🔎
            </div>

            <div>
              <h2 className="text-2xl font-bold">Global Student Search</h2>

              <p className="text-sm text-muted-foreground">
                Search every onboarding draft regardless of workflow status.
              </p>
            </div>
          </div>

          <div className="relative mt-6">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-200">🔍</span>

            <input
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="Search by Enrollment Number or Email..."
              className="
w-full
rounded-2xl
border
border-slate-300
bg-slate-50
pl-12
pr-4
py-3
text-sm
shadow-sm
transition-all
focus:border-blue-300
focus:bg-white
focus:ring-4
focus:ring-blue-100
"
            />
          </div>

          {globalLoading ? (
            <div className="mt-4 flex items-center gap-2 text-sm text-blue-600">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
              Searching students...
            </div>
          ) : null}

          {globalResults.length > 0 ? (
            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-300">
              <table className="min-w-225 w-full">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="px-6 py-4 text-left text-[14px] font-bold uppercase tracking-[0.2em] text-slate-500">
                      Enrollment
                    </th>
                    <th className="px-6 py-4 text-left text-[14px] font-bold uppercase tracking-[0.2em] text-slate-500">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-[14px] font-bold uppercase tracking-[0.2em] text-slate-500">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-[14px] font-bold uppercase tracking-[0.2em] text-slate-500">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {globalResults.map((row) => (
                    <tr key={row.draft_id} className="border-b">
                      <td className="p-3">{row.enrollment_no}</td>

                      <td className="p-3">{row.email_address}</td>

                      <td className="px-5 py-4">
                        {row.approval_status === "PROFILE_APPROVED" && (
                          <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                            Approved
                          </span>
                        )}

                        {row.approval_status === "PROFILE_REJECTED" && (
                          <span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                            Rejected
                          </span>
                        )}

                        {row.approval_status === "PENDING_PROFILE_VERIFICATION" && (
                          <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                            Pending Review
                          </span>
                        )}

                        {![
                          "PROFILE_APPROVED",
                          "PROFILE_REJECTED",
                          "PENDING_PROFILE_VERIFICATION",
                        ].includes(row.approval_status ?? "") && (
                          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                            Pending
                          </span>
                        )}
                      </td>

                      <td className="p-3">
                        <div className="flex gap-2">
                          <Link
                            to="/admin/onboarding-review/$draftId"
                            params={{
                              draftId: row.draft_id,
                            }}
                            className="rounded-lg border px-3 py-1"
                          >
                            Review
                          </Link>

                          <button
                            onClick={async () => {
                              try {
                                const session = await authService.getSession();

                                if (!session?.user?.id) {
                                  alert("Admin session not found");
                                  return;
                                }

                                await approveOnboardingDraft(row.draft_id, session.user.id);

                                window.location.reload();
                              } catch (error) {
                                alert(error instanceof Error ? error.message : "Approval failed");
                              }
                            }}
                            className="rounded-lg bg-green-600 px-3 py-1 text-white"
                          >
                            Approve
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>

        <div className="grid gap-6 xl:grid-cols-1">
          <div className="rounded-3xl border border-slate-200 bg-white shadow-lg overflow-hidden">
            <div className="border-b bg-slate-50 px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Student Approval Workflow</h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Review and manage onboarding approvals.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setCurrentView("interested")}
                    className={
                      currentView === "interested"
                        ? "rounded-full bg-gradient-to-r from-blue-600 to-blue-700 shadow-md px-4 py-2 text-sm font-semibold text-white"
                        : "rounded-full border border-slate-300 bg-white px-4 py-2 text-sm transition hover:bg-slate-100"
                    }
                  >
                    Interested ({interestedStudents.length})
                  </button>

                  <button
                    onClick={() => setCurrentView("changed")}
                    className={
                      currentView === "changed"
                        ? "rounded-full bg-gradient-to-r from-blue-600 to-blue-700 shadow-md px-4 py-2 text-sm font-semibold text-white"
                        : "rounded-full border border-slate-300 bg-white px-4 py-2 text-sm transition hover:bg-slate-100"
                    }
                  >
                    Preference Changed ({changedPreferenceStudents.length})
                  </button>

                  <button
                    onClick={() => setCurrentView("optedout")}
                    className={
                      currentView === "optedout"
                        ? "rounded-full bg-gradient-to-r from-blue-600 to-blue-700 shadow-md px-4 py-2 text-sm font-semibold text-white"
                        : "rounded-full border border-slate-300 bg-white px-4 py-2 text-sm transition hover:bg-slate-100"
                    }
                  >
                    Opted-Out ({optedOutStudents.length})
                  </button>

                  <button
                    onClick={() => setCurrentView("approved")}
                    className={
                      currentView === "approved"
                        ? "rounded-full bg-gradient-to-r from-blue-600 to-blue-700 shadow-md px-4 py-2 text-sm font-semibold text-white"
                        : "rounded-full border border-slate-300 bg-white px-4 py-2 text-sm transition hover:bg-slate-100"
                    }
                  >
                    Approved ({approvedStudents.length})
                  </button>

                  <button
                    onClick={() => setCurrentView("rejected")}
                    className={
                      currentView === "rejected"
                        ? "rounded-full bg-gradient-to-r from-blue-600 to-blue-700 shadow-md px-4 py-2 text-sm font-semibold text-white"
                        : "rounded-full border border-slate-300 bg-white px-4 py-2 text-sm transition hover:bg-slate-100"
                    }
                  >
                    Rejected ({rejectedStudents.length})
                  </button>
                </div>
              </div>
            </div>

            <SectionTable
              title=""

              rows={
                currentView === "interested"
                  ? interestedStudents
                  : currentView === "changed"
                    ? changedPreferenceStudents
                    : currentView === "optedout"
                      ? optedOutStudents
                      : currentView === "approved"
                        ? approvedStudents
                        : rejectedStudents
              }

              search={
                currentView === "interested"
                  ? interestedSearch
                  : currentView === "changed"
                    ? changedSearch
                    : currentView === "optedout"
                      ? optedOutSearch
                      : currentView === "approved"
                        ? approvedSearch
                        : rejectedSearch
              }

              onSearchChange={
                currentView === "interested"
                  ? setInterestedSearch
                  : currentView === "changed"
                    ? setChangedSearch
                    : currentView === "optedout"
                      ? setOptedOutSearch
                      : currentView === "approved"
                        ? setApprovedSearch
                        : setRejectedSearch
              }

              statusFilter={
                currentView === "interested"
                  ? interestedStatus
                  : currentView === "changed"
                    ? changedStatus
                    : currentView === "optedout"
                      ? optedOutStatus
                      : currentView === "approved"
                        ? approvedStatus
                        : rejectedStatus
              }

              onStatusFilterChange={
                currentView === "interested"
                  ? setInterestedStatus
                  : currentView === "changed"
                    ? setChangedStatus
                    : currentView === "optedout"
                      ? setOptedOutStatus
                      : currentView === "approved"
                        ? setApprovedStatus
                        : setRejectedStatus
              }
            />
          </div>

          <div className="flex items-center justify-center gap-3 py-4">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border px-4 py-2"
            >
              Previous
            </button>

            <span className="font-medium">
              Page {page} of {totalPages}
            </span>

            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border px-4 py-2"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function formatApprovalStatus(status?: string | null) {
  switch (status) {
    case "PENDING_PROFILE_VERIFICATION":
      return "Pending Review";

    case "PROFILE_APPROVED":
      return "Approved";

    case "PROFILE_REJECTED":
      return "Rejected";

    default:
      return "Pending";
  }
}
function SectionTable({
  title,
  rows,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}: {
  title: string;
  rows: any[];
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
}) {
  const [selectedDrafts, setSelectedDrafts] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);

  const filteredRows = rows.filter((row) => {
    const value = search.toLowerCase();

    const matchesSearch =
      row.enrollment_no?.toLowerCase().includes(value) ||
      row.email_address?.toLowerCase().includes(value) ||
      row.edited_profile?.placement_preference?.toLowerCase().includes(value);

    const matchesStatus =
      statusFilter === "ALL" || (row.approval_status ?? "Pending") === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="overflow-hidden">
      <div className="border-b bg-slate-50 px-6 py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1">
            <input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search enrollment number, email or preference..."
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm"
            >
              <option value="ALL">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="PENDING_PROFILE_VERIFICATION">Pending Review</option>
              <option value="PROFILE_APPROVED">Approved</option>
              <option value="PROFILE_REJECTED">Rejected</option>
            </select>

            <button
              disabled={selectedDrafts.length === 0 || processing}
              onClick={async () => {
                try {
                  setProcessing(true);

                  const session = await authService.getSession();

                  if (!session?.user?.id) {
                    alert("Admin session not found");
                    return;
                  }

                  for (const draftId of selectedDrafts) {
                    await approveOnboardingDraft(draftId, session.user.id);
                  }

                  alert(`${selectedDrafts.length} student(s) approved successfully`);

                  window.location.reload();
                } catch (error) {
                  alert(error instanceof Error ? error.message : "Bulk approval failed");
                } finally {
                  setProcessing(false);
                }
              }}
              className="inline-flex h-11 items-center rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white shadow transition hover:bg-emerald-700 disabled:bg-slate-300
disabled:text-slate-500
disabled:shadow-none
disabled:cursor-not-allowed"
            >
              Approve Selected ({selectedDrafts.length})
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[1650px]">
          <table className="min-w-[1850px] w-full table-auto">
            <thead className="border-b bg-slate-100">
              <tr>
                <th className="w-12 px-5 py-4 text-left text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
                  <input
                    type="checkbox"
                    checked={
                      filteredRows.length > 0 &&
                      filteredRows.every((row) => selectedDrafts.includes(row.draft_id))
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedDrafts(filteredRows.map((row) => row.draft_id));
                      } else {
                        setSelectedDrafts([]);
                      }
                    }}
                  />
                </th>

                <th
                  className="
px-6
py-5
text-left
text-[13px]
font-bold
uppercase
tracking-[0.20em]
text-slate-700
whitespace-nowrap
"
                >
                  Enrollment
                </th>

                <th
                  className="
px-6
py-5
text-left
text-[13px]
font-bold
uppercase
tracking-[0.20em]
text-slate-700
whitespace-nowrap
"
                >
                  Email
                </th>

                <th
                  className="
px-6
py-5
text-left
text-[13px]
font-bold
uppercase
tracking-[0.20em]
text-slate-700
whitespace-nowrap
"
                >
                  Student Preference
                </th>

                <th
                  className="
px-6
py-5
text-left
text-[13px]
font-bold
uppercase
tracking-[0.20em]
text-slate-700
whitespace-nowrap
"
                >
                  Status
                </th>

                <th
                  className="
px-6
py-5
text-left
text-[13px]
font-bold
uppercase
tracking-[0.20em]
text-slate-700
whitespace-nowrap
"
                >
                  Reviewed At
                </th>

                <th
                  className="
px-6
py-5
text-left
text-[13px]
font-bold
uppercase
tracking-[0.20em]
text-slate-700
whitespace-nowrap
"
                >
                  Admin
                </th>

                <th
                  className="
px-6
py-5
text-left
text-[13px]
font-bold
uppercase
tracking-[0.20em]
text-slate-700
whitespace-nowrap
"
                >
                  Reason
                </th>

                <th
                  className="
min-w-[150px]
px-6
py-5
text-center
text-[13px]
font-bold
uppercase
tracking-[0.20em]
text-slate-700
whitespace-nowrap
"
                >
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.draft_id} className="border-b transition hover:bg-slate-50">
                  <td className="px-5 py-4">
                    <input
                      type="checkbox"
                      checked={selectedDrafts.includes(row.draft_id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedDrafts((current) => [...current, row.draft_id]);
                        } else {
                          setSelectedDrafts((current) =>
                            current.filter((id) => id !== row.draft_id),
                          );
                        }
                      }}
                    />
                  </td>

                  <td className="px-5 py-4 font-medium">{row.enrollment_no}</td>

                  <td className="px-5 py-4">{row.email_address}</td>

                  <td className="px-5 py-4">{row.edited_profile?.placement_preference ?? "-"}</td>

                  <td className="px-5 py-4">{formatApprovalStatus(row.approval_status)}</td>

                  <td className="px-5 py-4">
                    {row.reviewed_at ? new Date(row.reviewed_at).toLocaleString() : "-"}
                  </td>

                  <td className="px-5 py-4">{row.reviewed_by ?? "-"}</td>

                  <td className="px-5 py-4">{row.rejection_reason ?? "-"}</td>

                  <td className="px-5 py-4 text-center">
                    <Link
                      to="/admin/onboarding-review/$draftId"
                      params={{
                        draftId: row.draft_id,
                      }}
                      className="
inline-flex
items-center
justify-center
rounded-xl
border
border-slate-300
bg-white
px-4
py-2
text-sm
font-medium
text-slate-700
transition-all
duration-200
hover:border-blue-400
hover:bg-blue-50
hover:text-blue-700
"
                    >
                      Review
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
