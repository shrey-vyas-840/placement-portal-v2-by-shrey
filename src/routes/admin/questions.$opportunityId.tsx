import {
    createFileRoute,
} from "@tanstack/react-router";


import {
    AdminQuestionBuilderPage,
} from "@/pages/AdminQuestionBuilderPage";


export const Route =
    createFileRoute(
        "/admin/questions/$opportunityId"
    )({

        component:
            QuestionRoute,

    });



function QuestionRoute() {


    const params =
        Route.useParams();


    return (

        <AdminQuestionBuilderPage

            opportunityId={
                params.opportunityId
            }

        />

    );

}