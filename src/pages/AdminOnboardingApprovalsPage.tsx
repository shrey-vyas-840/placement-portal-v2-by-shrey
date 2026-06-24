import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";

import { getPendingOnboardingDrafts } from "@/services/adminOnboardingService";

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

  const activeRows = rows.filter(
    (row) =>
      row.approval_status !== "PROFILE_APPROVED" && row.approval_status !== "PROFILE_REJECTED",
  );

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
      const data = await getPendingOnboardingDrafts();

      console.log("ONBOARDING DRAFTS", data);

      setRows(data);
      setLoading(false);
    }

    void load();
  }, []);

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Onboarding Approvals</h1>
      </div>

      <div className="grid gap-6">
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
    <div className="overflow-hidden rounded-xl border">
      <div className="border-b bg-muted p-4 space-y-3">
        <h2 className="font-semibold">{title}</h2>

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

      <div className="max-h-[400px] overflow-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="p-3 text-left">Enrollment</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Student Preference</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredRows.map((row) => (
              <tr key={row.draft_id} className="border-b">
                <td className="p-3">{row.enrollment_no}</td>

                <td className="p-3">{row.email_address}</td>

                <td className="p-3">{row.edited_profile?.placement_preference ?? "-"}</td>

                <td className="p-3">{formatApprovalStatus(row.approval_status)}</td>

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
