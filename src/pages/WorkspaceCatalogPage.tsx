import { Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { hasWorkspaceAccess } from "@/services/workspaceAccessService";

function SectionTitle({
    title,
}: {
    title: string;
}) {
    return (
        <div className="mb-3 mt-6 border-b border-border pb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {title}
        </div>
    );
}

function MenuLink({
    to,
    label,
}: {
    to: string;
    label: string;
}) {
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
    const { user } = useAuth();

    if (!hasWorkspaceAccess(user?.email)) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="rounded-xl border border-border bg-card p-8 text-center">
                    <h2 className="text-xl font-semibold">
                        Access Denied
                    </h2>

                    <p className="mt-2 text-muted-foreground">
                        You do not have permission to access this workspace.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-background">

            {/* LEFT SIDEBAR */}

            <aside className="w-[320px] border-r border-border bg-card p-6">

                <h1 className="text-xl font-bold">
                    Workspace Catalog
                </h1>

                <p className="mt-1 text-sm text-muted-foreground">
                    Internal Workspace
                </p>

                {/* STUDENT */}

                <SectionTitle
                    title="Student Workspace"
                />

                <div className="space-y-2">

                    <MenuLink
                        to="/dashboard"
                        label="Dashboard"
                    />

                    <MenuLink
                        to="/profile"
                        label="Profile"
                    />

                    <MenuLink
                        to="/opportunities"
                        label="Opportunities"
                    />

                    <MenuLink
                        to="/my-applications"
                        label="My Applications"
                    />

                    <MenuLink
                        to="/student/noc"
                        label="NOC Requests"
                    />

                </div>

                {/* ADMIN */}

                <SectionTitle
                    title="Administration"
                />

                <div className="space-y-2">

                    <MenuLink
                        to="/admin"
                        label="Admin Dashboard"
                    />

                    <MenuLink
                        to="/admin/students"
                        label="Student Management"
                    />

                    <MenuLink
                        to="/admin/opportunities"
                        label="Opportunity Management"
                    />

                    <MenuLink
                        to="/admin/companies"
                        label="Company Management"
                    />

                    <MenuLink
                        to="/admin/drives"
                        label="Drive Management"
                    />

                    <MenuLink
                        to="/admin/attendance"
                        label="Attendance System"
                    />

                    <MenuLink
                        to="/admin/noc"
                        label="NOC Automation Workflow"
                    />

                </div>

                {/* HOD */}

                <SectionTitle
                    title="Department Workspace"
                />

                <div className="space-y-2">

                    <MenuLink
                        to="/hod"
                        label="HOD Dashboard"
                    />

                    <MenuLink
                        to="/hod"
                        label="HOD Approvals"
                    />

                </div>

                {/* FUTURE */}

                <SectionTitle
                    title="Reserved Modules"
                />

                <div className="space-y-2">

                    <div className="rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
                        Operations (Coming Soon)
                    </div>

                    <div className="rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
                        System (Coming Soon)
                    </div>

                </div>

            </aside>

            {/* CENTER CONTENT */}

            <main className="flex-1 p-8">

                <div className="flex h-full min-h-[700px] items-center justify-center rounded-2xl border border-dashed border-border bg-card">

                    <div className="text-center">

                        <h2 className="text-3xl font-semibold">
                            Workspace Catalog
                        </h2>

                        <p className="mt-3 text-muted-foreground">
                            Internal workspace hub.
                        </p>

                        <p className="mt-1 text-sm text-muted-foreground">
                            Future tools will appear here.
                        </p>

                    </div>

                </div>

            </main>

        </div>
    );
}