import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

import {
  ADMIN_LAYOUT,
  ADMIN_NAVIGATION,
} from "./adminNavigation";

import { AdminNavLink } from "./AdminNavLink";

interface AdminSidebarProps {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}

export function AdminSidebar({
  collapsed,
  onCollapsedChange,
}: AdminSidebarProps) {
  const [hovering, setHovering] = useState(false);

  return (
    <aside
      className={cn(
        "sticky top-0 flex h-screen flex-col",
        "border-r border-border bg-background",
        "transition-all duration-300",
        collapsed ? "w-[88px]" : "w-80",
      )}
    >
      {/* Header */}

      <div
        className="border-b border-border p-5"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                {ADMIN_LAYOUT.APP_NAME}
              </div>

              <div className="mt-2 text-lg font-bold">
                {ADMIN_LAYOUT.PANEL_NAME}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() =>
              onCollapsedChange(!collapsed)
            }
            className={cn(
              "flex h-10 w-10 items-center justify-center",
              "rounded-xl border border-border",
              "transition-all hover:bg-muted",
              collapsed && "mx-auto",
            )}
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Navigation */}

      <div className="flex-1 overflow-y-auto px-3 py-4">
        {ADMIN_NAVIGATION.map((group) => (
          <section
            key={group.id}
            className="mb-7"
          >
            {!collapsed && (
              <div className="mb-3 px-3">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {group.title}
                </div>
              </div>
            )}

            <div className="space-y-2">
              {group.items.map((item) => (
                <AdminNavLink
                  key={item.id}
                  item={item}
                  collapsed={collapsed}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Footer */}

      {!collapsed && (
        <div className="border-t border-border p-4">
          <div className="rounded-2xl border border-border bg-muted/30 p-4">
            <div className="text-sm font-semibold">
              Placement Portal V2
            </div>

            <div className="mt-1 text-xs text-muted-foreground">
              Unified administration workspace for
              campus recruitment management.
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}