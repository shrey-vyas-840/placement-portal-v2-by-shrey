import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  getPendingOnboardingDrafts,
  searchOnboardingStudents,
} from "@/services/adminOnboardingService";

import {
  approveOnboardingDraft,
  rejectOnboardingDraft,
} from "@/services/studentOnboardingDraftService";

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
    <div className="mx-auto max-w-[1600px] space-y-6 p-6">
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

                        <button
                          onClick={async () => {
                            const reason = window.prompt("Enter rejection reason");

                            if (!reason?.trim()) {
                              return;
                            }

                            try {
                              const session = await authService.getSession();

                              if (!session?.user?.id) {
                                alert("Admin session not found");
                                return;
                              }

                              await rejectOnboardingDraft(
                                row.draft_id,
                                session.user.id,
                                reason.trim(),
                              );

                              window.location.reload();
                            } catch (error) {
                              alert(error instanceof Error ? error.message : "Rejection failed");
                            }
                          }}
                          className="rounded-lg bg-red-600 px-3 py-1 text-white"
                        >
                          Reject
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
        <SectionTable
          title={`Interested Students (${interestedStudents.length})`}
          rows={interestedStudents}
          search={interestedSearch}
          onSearchChange={setInterestedSearch}
          statusFilter={interestedStatus}
          onStatusFilterChange={setInterestedStatus}
        />

        <SectionTable
          title={`Preference Changed (${changedPreferenceStudents.length})`}
          rows={changedPreferenceStudents}
          search={changedSearch}
          onSearchChange={setChangedSearch}
          statusFilter={changedStatus}
          onStatusFilterChange={setChangedStatus}
        />

        <SectionTable
          title={`Opted-Out Students (${optedOutStudents.length})`}
          rows={optedOutStudents}
          search={optedOutSearch}
          onSearchChange={setOptedOutSearch}
          statusFilter={optedOutStatus}
          onStatusFilterChange={setOptedOutStatus}
        />

        <SectionTable
          title={`Approved (${approvedStudents.length})`}
          rows={approvedStudents}
          search={approvedSearch}
          onSearchChange={setApprovedSearch}
          statusFilter={approvedStatus}
          onStatusFilterChange={setApprovedStatus}
        />

        <SectionTable
          title={`Rejected (${rejectedStudents.length})`}
          rows={rejectedStudents}
          search={rejectedSearch}
          onSearchChange={setRejectedSearch}
          statusFilter={rejectedStatus}
          onStatusFilterChange={setRejectedStatus}
        />

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
    <div className="w-full overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="border-b bg-muted/40 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">{title}</h2>

          <div className="flex gap-2">
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
              className="rounded-lg bg-green-600 px-3 py-1 text-sm text-white disabled:opacity-50"
            >
              Approve Selected ({selectedDrafts.length})
            </button>

            <button
              disabled={selectedDrafts.length === 0 || processing}
              onClick={async () => {
                const reason = window.prompt("Enter rejection reason");

                if (!reason?.trim()) {
                  return;
                }

                try {
                  setProcessing(true);

                  const session = await authService.getSession();

                  if (!session?.user?.id) {
                    alert("Admin session not found");
                    return;
                  }

                  for (const draftId of selectedDrafts) {
                    await rejectOnboardingDraft(draftId, session.user.id, reason.trim());
                  }

                  alert(`${selectedDrafts.length} student(s) rejected successfully`);

                  window.location.reload();
                } catch (error) {
                  alert(error instanceof Error ? error.message : "Bulk rejection failed");
                } finally {
                  setProcessing(false);
                }
              }}
              className="rounded-lg bg-red-600 px-3 py-1 text-sm text-white disabled:opacity-50"
            >
              Reject Selected ({selectedDrafts.length})
            </button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search enrollment, email, preference..."
            className="w-full rounded-xl border px-3 py-2"
          />

          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="w-full rounded-xl border px-3 py-2"
          >
            <option value="ALL">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="PENDING_PROFILE_VERIFICATION">Pending Review</option>
            <option value="PROFILE_APPROVED">Approved</option>
            <option value="PROFILE_REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      <div className="max-h-[420px] overflow-auto">
        <table className="w-full min-w-[1400px] text-sm">
          <thead>
            <tr className="border-b">
              <th className="p-3 text-left">
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
              <th className="p-3 text-left">Enrollment</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Student Preference</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Reviewed At</th>
              <th className="p-3 text-left">Admin</th>
              <th className="p-3 text-left">Reason</th>
              <th className="p-3 text-left">Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredRows.map((row) => (
              <tr key={row.draft_id} className="border-b">
                <td className="p-3">
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
                <td className="p-3">{row.enrollment_no}</td>

                <td className="p-3">{row.email_address}</td>

                <td className="p-3">{row.edited_profile?.placement_preference ?? "-"}</td>

                <td className="p-3">{formatApprovalStatus(row.approval_status)}</td>

                <td className="p-3">
                  {row.reviewed_at ? new Date(row.reviewed_at).toLocaleString() : "-"}
                </td>

                <td className="p-3">{row.reviewed_by ?? "-"}</td>

                <td className="p-3">{row.rejection_reason ?? "-"}</td>

                <td className="p-3">
                  <Link
                    to="/admin/onboarding-review/$draftId"
                    params={{
                      draftId: row.draft_id,
                    }}
                    className="underline"
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
