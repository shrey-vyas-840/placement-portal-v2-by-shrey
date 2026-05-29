import { createFileRoute } from "@tanstack/react-router";

import { AdminProtectedRoute } from "@/components/AdminProtectedRoute";

import { AdminDrivesPage } from "@/pages/AdminDrivesPage";

export const Route =
    createFileRoute(
        "/admin/drives",
    )({
        component: () => (
            <AdminProtectedRoute>
                <AdminDrivesPage />
            </AdminProtectedRoute>
        ),
    });