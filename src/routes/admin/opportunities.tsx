import { createFileRoute } from "@tanstack/react-router";

import { AdminProtectedRoute } from "@/components/AdminProtectedRoute";
import { AdminOpportunitiesPage } from "@/pages/AdminOpportunitiesPage";

export const Route =
    createFileRoute(
        "/admin/opportunities",
    )({
        component: () => (
            <AdminProtectedRoute>
                <AdminOpportunitiesPage />
            </AdminProtectedRoute>
        ),
    });