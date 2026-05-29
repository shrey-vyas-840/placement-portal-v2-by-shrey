import { Link } from "@tanstack/react-router";

export function AdminDashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-6 py-8">

        <h1 className="text-3xl font-bold">
          Admin Dashboard
        </h1>

        <p className="mt-2 text-muted-foreground">
          Admin access verified.
        </p>

        <div className="mt-8 grid gap-4">

          <Link
            to="/admin/students"
            className="rounded-lg border border-border bg-card p-5 transition hover:border-primary/40"
          >
            <h2 className="text-lg font-semibold">
              Student Viewer
            </h2>

            <p className="mt-2 text-sm text-muted-foreground">
              View all registered students.
            </p>
          </Link>

        </div>
      </div>
    </div>
  );
}