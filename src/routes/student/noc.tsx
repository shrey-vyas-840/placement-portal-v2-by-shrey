import {
    createFileRoute,
} from "@tanstack/react-router";

import {
    StudentNocPage,
} from "@/pages/student/StudentNocPage";

export const Route =
    createFileRoute(
        "/student/noc"
    )({
        component:
            StudentNocPage,
    });