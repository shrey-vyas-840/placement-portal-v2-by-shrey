import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { hodService } from "@/services/hodService";

function formatDateTime(value?: string | null) {
  return value ? new Date(value).toLocaleString() : "-";
}

function formatDateOnly(value?: string | null) {
  return value ? new Date(value).toLocaleDateString() : "-";
}

function isExpired(row: any) {
  return !!row?.is_expired;
}

function TableShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border">
      <div className="overflow-x-auto">
        <div className="max-h-[420px] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

export function HodDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [branches, setBranches] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [approved, setApproved] = useState<any[]>([]);
  const [rejected, setRejected] = useState<any[]>([]);

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const data = await hodService.getDashboardData();
      setEmail(data.email);
      setBranches(data.branches);
      setPending(data.pending);
      setApproved(data.approved);
      setRejected(data.rejected);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load HOD dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(
    () => ({
      pending: pending.length,
      approved: approved.length,
      rejected: rejected.length,
      branches: branches.length,
    }),
    [pending.length, approved.length, rejected.length, branches.length],
  );

  async function approveRow(row: any) {
    const identifier = row.approval_token ?? row.noc_request_id;
    const ok = window.confirm("Approve this NOC request?");
    if (!ok) return;

    await hodService.approveByToken(identifier);
    await load();
  }

  async function rejectRow(row: any) {
    const identifier = row.approval_token ?? row.noc_request_id;
    const reason = window.prompt("Enter rejection reason");
    if (!reason || !reason.trim()) return;

    await hodService.rejectByToken(identifier, reason.trim());
    await load();
  }

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">HOD Dashboard</h1>
        <p className="mt-2 text-sm text-muted-foreground">Logged in as {email || "-"}</p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Pending Approval</div>
          <div className="text-3xl font-bold">{stats.pending}</div>
        </div>

        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Approved History</div>
          <div className="text-3xl font-bold">{stats.approved}</div>
        </div>

        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Rejected History</div>
          <div className="text-3xl font-bold">{stats.rejected}</div>
        </div>

        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Mapped Branches</div>
          <div className="text-3xl font-bold">{stats.branches}</div>
        </div>
      </div>

      <div className="mb-8 rounded-lg border bg-slate-50 p-4">
        <div className="text-sm text-muted-foreground">Assigned Branches</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {branches.length ? (
            branches.map((row: any) => (
              <span key={row.mapping_id} className="rounded-full border bg-white px-3 py-1 text-xs">
                {row.institute_name} • {row.degree_name} • {row.branch_name}
              </span>
            ))
          ) : (
            <span className="text-sm text-muted-foreground">No branch mapping found.</span>
          )}
        </div>
      </div>

      <h2 className="mb-4 text-xl font-semibold">Pending Approval</h2>
      <TableShell>
        <table className="min-w-[1400px] w-full text-sm">
          <thead className="sticky top-0 z-10 bg-white">
            <tr className="border-b">
              <th className="p-3 text-left">Student</th>
              <th className="p-3 text-left">Enrollment</th>
              <th className="p-3 text-left">Institute</th>
              <th className="p-3 text-left">Course</th>
              <th className="p-3 text-left">Branch</th>
              <th className="p-3 text-left">Company</th>
              <th className="p-3 text-left">NOC Type</th>
              <th className="p-3 text-left">Submitted At</th>
              <th className="p-3 text-left">Approval Deadline</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pending.map((row: any) => {
              const identifier = row.approval_token ?? row.noc_request_id;
              const expired = isExpired(row);

              return (
                <tr key={row.noc_request_id} className="border-b">
                  <td className="p-3">{row.snapshot?.student_name ?? "-"}</td>
                  <td className="p-3">{row.snapshot?.enrollment_no ?? "-"}</td>
                  <td className="p-3">{row.snapshot?.institute_name ?? "-"}</td>
                  <td className="p-3">{row.snapshot?.course ?? "-"}</td>
                  <td className="p-3">{row.snapshot?.branch ?? "-"}</td>
                  <td className="p-3">{row.snapshot?.company_name ?? "-"}</td>
                  <td className="p-3">{row.noc_type ?? "-"}</td>
                  <td className="p-3">{formatDateTime(row.created_at)}</td>
                  <td className="p-3">
                    <span className={expired ? "font-semibold text-red-600" : ""}>
                      {formatDateTime(row.hod_approval_deadline ?? row.approval_token_expires_at)}
                    </span>
                  </td>
                  <td className="p-3">
                    {expired ? (
                      <span className="rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                        Expired
                      </span>
                    ) : (
                      <span className="rounded bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        to="/hod/review/$token"
                        params={{ token: identifier }}
                        className="rounded border px-3 py-1"
                      >
                        View
                      </Link>
                      <button
                        disabled={expired}
                        onClick={() => approveRow(row)}
                        className="rounded border px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        disabled={expired}
                        onClick={() => rejectRow(row)}
                        className="rounded border px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableShell>

      <h2 className="mt-10 mb-4 text-xl font-semibold">Approved History</h2>
      <TableShell>
        <table className="min-w-[1200px] w-full text-sm">
          <thead className="sticky top-0 z-10 bg-white">
            <tr className="border-b">
              <th className="p-3 text-left">Student</th>
              <th className="p-3 text-left">Enrollment</th>
              <th className="p-3 text-left">Company</th>
              <th className="p-3 text-left">NOC Type</th>
              <th className="p-3 text-left">Approved At</th>
              <th className="p-3 text-left">Approved By</th>
              <th className="p-3 text-left">View</th>
            </tr>
          </thead>
          <tbody>
            {approved.map((row: any) => (
              <tr key={row.noc_request_id} className="border-b">
                <td className="p-3">{row.snapshot?.student_name ?? "-"}</td>
                <td className="p-3">{row.snapshot?.enrollment_no ?? "-"}</td>
                <td className="p-3">{row.snapshot?.company_name ?? "-"}</td>
                <td className="p-3">{row.noc_type ?? "-"}</td>
                <td className="p-3">{formatDateTime(row.approved_at)}</td>
                <td className="p-3">HOD</td>
                <td className="p-3">
                  <Link
                    to="/hod/review/$token"
                    params={{ token: row.approval_token ?? row.noc_request_id }}
                    className="rounded border px-3 py-1"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>

      <h2 className="mt-10 mb-4 text-xl font-semibold">Rejected History</h2>
      <TableShell>
        <table className="min-w-[1200px] w-full text-sm">
          <thead className="sticky top-0 z-10 bg-white">
            <tr className="border-b">
              <th className="p-3 text-left">Student</th>
              <th className="p-3 text-left">Enrollment</th>
              <th className="p-3 text-left">Company</th>
              <th className="p-3 text-left">NOC Type</th>
              <th className="p-3 text-left">Rejected At</th>
              <th className="p-3 text-left">Reason</th>
              <th className="p-3 text-left">View</th>
            </tr>
          </thead>
          <tbody>
            {rejected.map((row: any) => (
              <tr key={row.noc_request_id} className="border-b">
                <td className="p-3">{row.snapshot?.student_name ?? "-"}</td>
                <td className="p-3">{row.snapshot?.enrollment_no ?? "-"}</td>
                <td className="p-3">{row.snapshot?.company_name ?? "-"}</td>
                <td className="p-3">{row.noc_type ?? "-"}</td>
                <td className="p-3">{formatDateTime(row.rejection_at)}</td>
                <td className="p-3">{row.rejection_reason ?? "-"}</td>
                <td className="p-3">
                  <Link
                    to="/hod/review/$token"
                    params={{ token: row.approval_token ?? row.noc_request_id }}
                    className="rounded border px-3 py-1"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>
    </div>
  );
}
