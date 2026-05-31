import {
    createFileRoute,
    Outlet,
} from "@tanstack/react-router";

import {
    AdminProtectedRoute,
} from "@/components/AdminProtectedRoute";


export const Route =
    createFileRoute(
        "/admin/opportunities",
    )({

        component: () => (

            <AdminProtectedRoute>

                <Outlet />

            </AdminProtectedRoute>

        ),

    });