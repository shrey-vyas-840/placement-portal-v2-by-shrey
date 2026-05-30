import { createFileRoute } from "@tanstack/react-router";

import { StudentOpportunitiesPage } from "@/pages/StudentOpportunitiesPage";

export const Route =
    createFileRoute(
        "/opportunities",
    )({
        component:
            StudentOpportunitiesPage,
    });