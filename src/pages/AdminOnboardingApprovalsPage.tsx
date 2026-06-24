import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";

import { getPendingOnboardingDrafts } from "@/services/adminOnboardingService";

export function AdminOnboardingApprovalsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
        />

        <SectionTable
          title={`Preference Changed (${changedPreferenceStudents.length})`}
          rows={changedPreferenceStudents}
        />

        <SectionTable
          title={`Opted-Out Students (${optedOutStudents.length})`}
          rows={optedOutStudents}
        />

        <SectionTable title={`Approved (${approvedStudents.length})`} rows={approvedStudents} />

        <SectionTable title={`Rejected (${rejectedStudents.length})`} rows={rejectedStudents} />
      </div>
    </div>
  );
}

function SectionTable({ title, rows }: { title: string; rows: any[] }) {
  return (
    <div className="overflow-hidden rounded-xl border">
      <div className="border-b bg-muted p-4">
        <h2 className="font-semibold">{title}</h2>
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
            {rows.map((row) => (
              <tr key={row.draft_id} className="border-b">
                <td className="p-3">{row.enrollment_no}</td>

                <td className="p-3">{row.email_address}</td>

                <td className="p-3">{row.edited_profile?.placement_preference ?? "-"}</td>

                <td className="p-3">{row.approval_status ?? "Pending"}</td>

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
