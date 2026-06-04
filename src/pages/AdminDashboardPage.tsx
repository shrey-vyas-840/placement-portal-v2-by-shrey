import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { adminStudentService } from "@/services/adminStudentService";
import { useNavigate } from "@tanstack/react-router";

export function AdminDashboardPage() {
    const [metrics, setMetrics] =
        useState({
            totalStudents: 0,
            interestedStudents: 0,
            unplacedStudents: 0,
            placedStudents: 0,
        });

    const navigate =
        useNavigate();

    useEffect(() => {
        async function load() {
            const data =
                await adminStudentService.getDashboardMetrics();

            setMetrics(data);
        }

        load();
    }, []);
    return (
        <div className="min-h-screen bg-background">
            <div className="mx-auto max-w-7xl px-6 py-8">

                <h1 className="text-3xl font-bold">
                    Admin Dashboard
                </h1>

                <p className="mt-2 text-muted-foreground">
                    Admin access verified.
                </p>

                <div className="mt-8 grid gap-4 md:grid-cols-4">

                    <div className="rounded-lg border p-5">
                        <h3 className="text-sm text-muted-foreground">
                            Total Students
                        </h3>

                        <p className="mt-2 text-3xl font-bold">
                            {metrics.totalStudents}
                        </p>
                    </div>

                    <div className="rounded-lg border p-5">
                        <h3 className="text-sm text-muted-foreground">
                            Interested
                        </h3>

                        <p className="mt-2 text-3xl font-bold">
                            {metrics.interestedStudents}
                        </p>
                    </div>

                    <div className="rounded-lg border p-5">
                        <h3 className="text-sm text-muted-foreground">
                            Unplaced
                        </h3>

                        <p className="mt-2 text-3xl font-bold">
                            {metrics.unplacedStudents}
                        </p>
                    </div>

                    <div className="rounded-lg border p-5">
                        <h3 className="text-sm text-muted-foreground">
                            Placed
                        </h3>

                        <p className="mt-2 text-3xl font-bold">
                            {metrics.placedStudents}
                        </p>
                    </div>

                </div>

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
                    <Link
                        to="/admin/companies"
                        className="rounded-lg border border-border bg-card p-5 transition hover:border-primary/40"
                    >
                        <h2 className="text-lg font-semibold">
                            Companies
                        </h2>

                        <p className="mt-2 text-sm text-muted-foreground">
                            Manage company records.
                        </p>
                    </Link>
                    <Link
                        to="/admin/drives"
                        className="rounded-lg border border-border bg-card p-5 transition hover:border-primary/40"
                    >
                        <h2 className="text-lg font-semibold">
                            Drives
                        </h2>

                        <p className="mt-2 text-sm text-muted-foreground">
                            Manage placement drives.
                        </p>
                    </Link>
                    <Link
                        to="/admin/opportunities"
                        className="rounded-lg border border-border bg-card p-5 transition hover:border-primary/40"
                    >
                        <h2 className="text-lg font-semibold">
                            Opportunities
                        </h2>

                        <p className="mt-2 text-sm text-muted-foreground">
                            Manage published opportunities and applications.
                        </p>
                    </Link>
                    <Link
                        to="/admin/noc"
                        className="rounded-lg border border-border bg-card p-5 transition hover:border-primary/40"
                    >
                        <h2 className="text-base font-medium text-foreground">
                            NOC Dashboard
                        </h2>

                        <p className="mt-1 text-sm text-muted-foreground">
                            Review, manage, and approve NOC requests.
                        </p>
                    </Link>
                </div>
            </div>
        </div>
    );
}