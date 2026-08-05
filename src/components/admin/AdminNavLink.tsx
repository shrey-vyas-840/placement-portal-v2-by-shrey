import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

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
      activeOptions={{
        exact: item.to === "/admin",
      }}
      className="
        group
        relative
        block
        rounded-2xl
        transition-all
        duration-300
      "
      activeProps={{
        className:
          "shadow-[0_15px_40px_rgba(37,99,235,0.18)] dark:shadow-blue-900/20",
      }}
    >
      {({ isActive }) => (
        <div
          className={cn(
            "relative flex items-center gap-4 py-3 rounded-2xl border px-4 transition-all duration-300",

            isActive
              ? "border-blue-200 bg-gradient-to-r from-blue-50 via-blue-50/30 to-white"
              : "border-slate-200/60 bg-gradient-to-br from-white to-slate-50/85 backdrop-blur-sm hover:-translate-y-0.5 hover:border-slate-200 hover:bg-gradient-to-br from-white to-slate-50 hover:shadow-lg"
          )}
        >
          {isActive && (
            <div className="absolute left-0 top-4 py-3 bottom-4 w-1 rounded-r-full bg-blue-600" />
          )}

          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border transition-all duration-300",

              isActive
                ? "border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-300/40"
                : "border-slate-200 bg-gradient-to-br from-white to-slate-50 text-slate-700 group-hover:border-blue-200 group-hover:bg-blue-50 group-hover:text-blue-600"
            )}
          >
            <Icon className="h-5 w-5" />
          </div>

          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <div
                  className={cn(
                    "truncate text-base font-semibold transition-colors",

                    isActive
                      ? "text-slate-900"
                      : "text-slate-800"
                  )}
                >
                  {item.label}
                </div>

                <div
                  className={cn(
                    "mt-1 text-[13px] leading-5",

                    isActive
                      ? "text-slate-500"
                      : "text-slate-500"
                  )}
                >
                  {item.description}
                </div>
              </div>

              <ChevronRight
                className={cn(
                  "h-4 w-4 transition-all duration-300",

                  isActive
                    ? "translate-x-0 text-blue-600 opacity-100"
                    : "translate-x-0 text-slate-300 opacity-0 group-hover:translate-x-1 group-hover:opacity-100"
                )}
              />
            </>
          )}
        </div>
      )}
    </Link>
  );
}