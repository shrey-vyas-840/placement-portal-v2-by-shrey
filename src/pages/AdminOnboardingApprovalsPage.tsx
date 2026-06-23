import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";

import { getPendingOnboardingDrafts } from "@/services/adminOnboardingService";

export function AdminOnboardingApprovalsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

      <div className="overflow-hidden rounded-xl border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted">
              <th className="p-3 text-left">Enrollment</th>

              <th className="p-3 text-left">Email</th>

              <th className="p-3 text-left">Stage</th>

              <th className="p-3 text-left">Mail</th>

              <th className="p-3 text-left">Action</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => (
              <tr key={row.draft_id} className="border-b">
                <td className="p-3">{row.enrollment_no}</td>

                <td className="p-3">{row.email_address}</td>

                <td className="p-3">{row.onboarding_stage}</td>

                <td className="p-3">{row.mail_confirmation_received ? "Yes" : "No"}</td>

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
