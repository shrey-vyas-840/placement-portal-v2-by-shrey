import {
    createFileRoute,
} from "@tanstack/react-router";


import {
    AdminOpportunitiesPage,
} from "@/pages/AdminOpportunitiesPage";


export const Route =
    createFileRoute(
        "/admin/opportunities/",
    )({

        component:
            AdminOpportunitiesPage,

    });