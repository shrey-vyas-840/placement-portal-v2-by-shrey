import { Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { hasWorkspaceAccess } from "@/services/workspaceAccessService";

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="mb-3 mt-6 border-b border-border pb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
      {title}
    </div>
  );
}

function MenuLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="block rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium transition hover:border-primary hover:bg-muted/40"
    >
      {label}
    </Link>
  );
}

export function WorkspaceCatalogPage() {
  const { user, status } = useAuth();

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <h2 className="text-xl font-semibold">Loading workspace…</h2>
          <p className="mt-2 text-muted-foreground">Checking your session and permissions.</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-sm">
          <h2 className="text-2xl font-semibold">Session Expired</h2>

          <p className="mt-3 text-sm text-muted-foreground">
            Your login session has expired or is unavailable. Please sign in again to continue.
          </p>

          <Link
            to="/login"
            className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2 text-primary-foreground transition hover:opacity-90"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  if (!hasWorkspaceAccess(user?.email)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-sm">
          <h2 className="text-2xl font-semibold">Access Denied</h2>

          <p className="mt-3 text-sm text-muted-foreground">
            Your account is authenticated, but you don't have permission to access the Developer
            Workspace.
          </p>

          <Link
            to="/"
            className="mt-6 inline-flex w-full items-center justify-center rounded-lg border border-border px-4 py-2 transition hover:bg-muted"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-[320px] border-r border-border bg-card p-6">
        <h1 className="text-xl font-bold">Workspace Catalog</h1>
        <p className="mt-1 text-sm text-muted-foreground">Internal Workspace</p>

        <SectionTitle title="Student Workspace" />
        <div className="space-y-2">
          <MenuLink to="/dashboard" label="Dashboard" />
          <MenuLink to="/profile" label="Profile" />
          <MenuLink to="/opportunities" label="Opportunities" />
          <MenuLink to="/my-applications" label="My Applications" />
          <MenuLink to="/student/noc" label="NOC Requests" />
        </div>

        <SectionTitle title="Administration" />
        <div className="space-y-2">
          <MenuLink to="/admin" label="Admin Dashboard" />
          <MenuLink to="/admin/students" label="Student Management" />
          <MenuLink to="/admin/opportunities" label="Opportunity Management" />
          <MenuLink to="/admin/companies" label="Company Management" />
          <MenuLink to="/admin/drives" label="Drive Management" />
          <MenuLink to="/admin/attendance" label="Attendance System" />
          <MenuLink to="/admin/recruitment-execution" label="Recruitment Execution Workspace" />
          <MenuLink to="/admin/noc" label="NOC Automation Workflow" />
          <MenuLink to="/admin/onboarding-approvals" label="Onboarding Management" />
        </div>

        <SectionTitle title="Department Workspace" />
        <div className="space-y-2">
          <MenuLink to="/hod" label="HOD Dashboard" />
          <MenuLink to="/hod" label="HOD Approvals" />
        </div>

        <SectionTitle title="Reserved Modules" />
        <div className="space-y-2">
          <div className="rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
            Operations (Coming Soon)
          </div>
          <div className="rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
            System (Coming Soon)
          </div>
        </div>
      </aside>

      <main className="flex-1 p-8">
        <div className="grid gap-4">
          <Link
            to="/workspace/registry-import"
            className="rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:border-primary/40 hover:bg-muted/20"
          >
            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Phase 1</div>
            <h2 className="mt-2 text-2xl font-semibold">Master Student Registry Import</h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Upload Excel, validate the exact header order, dedupe by latest timestamp, scan
              conflicts, and push only clean rows to the registry table.
            </p>
            <div className="mt-4 inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              Open Import Tool
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
