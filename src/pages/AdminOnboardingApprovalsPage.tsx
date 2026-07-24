import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  getPendingOnboardingDrafts,
  searchOnboardingStudents,
} from "@/services/adminOnboardingService";

import { approveOnboardingDraft } from "@/services/studentOnboardingDraftService";

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
    <div className="mx-auto max-w-[1900px] space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Onboarding Approvals</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <div className="rounded-xl border bg-background p-4">
          <div className="text-sm text-muted-foreground">Pending Review</div>

          <div className="mt-2 text-3xl font-bold">{activeRows.length}</div>
        </div>

        <div className="rounded-xl border bg-background p-4">
          <div className="text-sm text-muted-foreground">Interested</div>

          <div className="mt-2 text-3xl font-bold">{interestedStudents.length}</div>
        </div>

        <div className="rounded-xl border bg-background p-4">
          <div className="text-sm text-muted-foreground">Preference Changed</div>

          <div className="mt-2 text-3xl font-bold">{changedPreferenceStudents.length}</div>
        </div>

        <div className="rounded-xl border bg-background p-4">
          <div className="text-sm text-muted-foreground">Opted-Out</div>

          <div className="mt-2 text-3xl font-bold">{optedOutStudents.length}</div>
        </div>

        <div className="rounded-xl border bg-background p-4">
          <div className="text-sm text-muted-foreground">Approved</div>

          <div className="mt-2 text-3xl font-bold">{approvedStudents.length}</div>
        </div>

        <div className="rounded-xl border bg-background p-4">
          <div className="text-sm text-muted-foreground">Rejected</div>

          <div className="mt-2 text-3xl font-bold">{rejectedStudents.length}</div>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Global Student Search</h2>

        <p className="mt-1 text-sm text-muted-foreground">Search entire onboarding database.</p>

        <input
          value={globalSearch}
          onChange={(e) => setGlobalSearch(e.target.value)}
          placeholder="Search enrollment number or email..."
          className="mt-4 w-full rounded-xl border px-3 py-2"
        />

        {globalLoading ? <div className="mt-4 text-sm">Searching...</div> : null}

        {globalResults.length > 0 ? (
          <div className="mt-4 overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-3 text-left">Enrollment</th>
                  <th className="p-3 text-left">Email</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Action</th>
                </tr>
              </thead>

              <tbody>
                {globalResults.map((row) => (
                  <tr key={row.draft_id} className="border-b">
                    <td className="p-3">{row.enrollment_no}</td>

                    <td className="p-3">{row.email_address}</td>

                    <td className="p-3">{formatApprovalStatus(row.approval_status)}</td>

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
                      ? "rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow"
                      : "rounded-full border bg-white px-4 py-2 text-sm"
                  }
                >
                  Interested ({interestedStudents.length})
                </button>

                <button
                  onClick={() => setCurrentView("changed")}
                  className={
                    currentView === "changed"
                      ? "rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow"
                      : "rounded-full border bg-white px-4 py-2 text-sm"
                  }
                >
                  Preference Changed ({changedPreferenceStudents.length})
                </button>

                <button
                  onClick={() => setCurrentView("optedout")}
                  className={
                    currentView === "optedout"
                      ? "rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow"
                      : "rounded-full border bg-white px-4 py-2 text-sm"
                  }
                >
                  Opted-Out ({optedOutStudents.length})
                </button>

                <button
                  onClick={() => setCurrentView("approved")}
                  className={
                    currentView === "approved"
                      ? "rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow"
                      : "rounded-full border bg-white px-4 py-2 text-sm"
                  }
                >
                  Approved ({approvedStudents.length})
                </button>

                <button
                  onClick={() => setCurrentView("rejected")}
                  className={
                    currentView === "rejected"
                      ? "rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow"
                      : "rounded-full border bg-white px-4 py-2 text-sm"
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
              className="inline-flex h-11 items-center rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white shadow transition hover:bg-emerald-700 disabled:opacity-40"
            >
              Approve Selected ({selectedDrafts.length})
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-362.5">
          <thead className="border-b bg-white">
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

              <th className="min-w-[170px] px-5 py-4 text-left text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
                Enrollment
              </th>

              <th className="min-w-[250px] px-5 py-4 text-left text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
                Email
              </th>

              <th className="min-w-[180px] px-5 py-4 text-left text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
                Student Preference
              </th>

              <th className="min-w-[150px] px-5 py-4 text-left text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
                Status
              </th>

              <th className="min-w-[220px] px-5 py-4 text-left text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
                Reviewed At
              </th>

              <th className="min-w-[250px] px-5 py-4 text-left text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
                Admin
              </th>

              <th className="min-w-[320px] px-5 py-4 text-left text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
                Reason
              </th>

              <th className="min-w-[130px] px-5 py-4 text-center text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
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
                        setSelectedDrafts((current) => current.filter((id) => id !== row.draft_id));
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
                    className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium transition hover:bg-slate-100"
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
  );
}
