import {
    createFileRoute,
} from "@tanstack/react-router";

import {
    AdminProtectedRoute,
} from "@/components/AdminProtectedRoute";

import {
    AdminOpportunityApplicantsPage,
} from "@/pages/AdminOpportunityApplicantsPage";


export const Route =
    createFileRoute(
        "/admin/opportunities/$opportunityId",
    )({

        component:
            OpportunityApplicantRoute,

    });


function OpportunityApplicantRoute() {

    const {
        opportunityId,
    } =
        Route.useParams();


    return (

        <AdminProtectedRoute>

            <AdminOpportunityApplicantsPage
                opportunityId={
                    opportunityId
                }
            />

        </AdminProtectedRoute>

    );

}  