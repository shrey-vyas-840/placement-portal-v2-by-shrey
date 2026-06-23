import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { APP_METADATA } from "@/config/appMetadata";

export function AppHeader() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/login", replace: true });
  };

  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/dashboard" className="text-base font-semibold text-foreground">
          {APP_METADATA.appName}
        </Link>
        <nav className="flex items-center gap-2" aria-label="Primary">
          <Link
            to="/dashboard"
            className="rounded px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
            activeProps={{ className: "text-foreground font-medium" }}
          >
            Dashboard
          </Link>
          <Link
            to="/profile"
            className="rounded px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
            activeProps={{ className: "text-foreground font-medium" }}
          >
            Profile
          </Link>
          <span
            className="hidden text-xs text-muted-foreground sm:inline"
            aria-label="Signed in as"
          >
            {user?.email ? `Signed in as ${user.email}` : ""}
          </span>
          <Button size="sm" variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </nav>
      </div>
    </header>
  );
}
