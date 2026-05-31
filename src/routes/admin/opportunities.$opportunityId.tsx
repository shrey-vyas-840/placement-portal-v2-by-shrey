import {
    createFileRoute,
} from "@tanstack/react-router";

import {
    AdminOpportunityApplicantsPage,
} from "@/pages/AdminOpportunityApplicantsPage";


export const Route =
    createFileRoute(
        "/admin/opportunities/$opportunityId"
    )({

        component:
            AdminOpportunityRoute,

    });


function AdminOpportunityRoute() {

    const {
        opportunityId,
    } =
        Route.useParams();


    return (

        <AdminOpportunityApplicantsPage

            opportunityId={
                opportunityId
            }

        />

    );

}