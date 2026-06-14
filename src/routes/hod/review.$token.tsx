import { createFileRoute } from "@tanstack/react-router";
import { HodReviewPage } from "@/pages/hod/HodReviewPage";

export const Route = createFileRoute("/hod/review/$token")({
    component: RouteComponent,
});

function RouteComponent() {
    const { token } = Route.useParams();

    return (
        <HodReviewPage
            token={token}
        />
    );
}   