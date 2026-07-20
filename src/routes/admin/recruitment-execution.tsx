import { createFileRoute } from "@tanstack/react-router";
import RecruitmentExecutionWorkspacePage from "@/pages/RecruitmentExecutionWorkspacePage";

export const Route = createFileRoute(
  "/admin/recruitment-execution",
)({
  validateSearch: (search: Record<string, unknown>) => ({
    executionId:
      typeof search.executionId === "string"
        ? search.executionId
        : "",
  }),

  component: RecruitmentExecutionWorkspacePage,
});