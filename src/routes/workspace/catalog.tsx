import { createFileRoute } from "@tanstack/react-router";
import { WorkspaceCatalogPage } from "@/pages/WorkspaceCatalogPage";

export const Route = createFileRoute(
  "/workspace/catalog",
)({
  component: WorkspaceCatalogPage,
});