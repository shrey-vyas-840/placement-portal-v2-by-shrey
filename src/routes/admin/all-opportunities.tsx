import {
    createFileRoute
}
from "@tanstack/react-router";

import {
    AdminAllOpportunitiesPage
}
from "@/pages/AdminAllOpportunitiesPage";

export const Route =
    createFileRoute(
        "/admin/all-opportunities"
    )({
        component:
            AdminAllOpportunitiesPage,
    });