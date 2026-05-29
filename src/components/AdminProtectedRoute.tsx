import { Navigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { rbacService } from "@/services/rbacService";
import type { ReactNode } from "react";

export function AdminProtectedRoute({
  children,
}: {
  children: ReactNode;
}) {
  const { user, status } = useAuth();

  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkRole() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {

        const role =
          await rbacService.getCurrentUserRole(
            user.id,
          );

        setIsAdmin(
          role?.role_name === "Admin",
        );
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    checkRole();
  }, [user]);

  if (
    status === "loading" ||
    loading
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (!isAdmin) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  return <>{children}</>;
}