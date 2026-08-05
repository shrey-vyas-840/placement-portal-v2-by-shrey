import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import type { AdminNavigationItem } from "./adminNavigation";

interface AdminNavLinkProps {
  item: AdminNavigationItem;
  collapsed: boolean;
  onNavigate?: () => void;
}

export function AdminNavLink({
  item,
  collapsed,
  onNavigate,
}: AdminNavLinkProps) {
  const Icon = item.icon;

  return (
    <Link
      to={item.to}
      onClick={onNavigate}
      activeProps={{
        className:
          "border-primary/30 bg-primary/10 text-primary shadow-sm",
      }}
      activeOptions={{
        exact: item.to === "/admin",
      }}
      className={cn(
        "group flex items-center gap-3 rounded-2xl border border-transparent",
        "px-3 py-3 transition-all duration-200",
        "hover:border-border hover:bg-muted/60",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
      )}
    >
      <div
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
          "border border-border bg-background",
          "transition-colors duration-200",
          "group-hover:border-primary/20 group-hover:bg-primary/5",
        )}
      >
        <Icon className="h-5 w-5" />
      </div>

      {!collapsed && (
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">
            {item.label}
          </div>

          <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {item.description}
          </div>
        </div>
      )}
    </Link>
  );
}