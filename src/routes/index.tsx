import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import AppLoadingScreen from "@/components/ui/AppLoadingScreen";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { status } = useAuth();
 if (status === "loading") {
  return <AppLoadingScreen page="auth" />;
}
  return <Navigate to={status === "authenticated" ? "/dashboard" : "/login"} replace />;
}
