import { ChevronLeft, ChevronRight, Shield } from "lucide-react";

import { cn } from "@/lib/utils";
import { ADMIN_LAYOUT, ADMIN_NAVIGATION } from "./adminNavigation";
import { AdminNavLink } from "./AdminNavLink";

interface AdminSidebarProps {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}

export function AdminSidebar({ collapsed, onCollapsedChange }: AdminSidebarProps) {
  return (
    <aside
      className={cn(
        "sticky top-0 h-screen shrink-0 transition-all duration-300",
        collapsed ? "w-24" : "w-[340px]",
      )}
    >
      <div className="flex h-full flex-col border-r border-slate-200/70 bg-gradient-to-b
from-white
via-slate-50
to-slate-100 shadow-2xl">
        {/* Header */}

        <div className="border-b border-slate-200 px-6 py-6">
          <div className="flex items-start justify-between">
            {!collapsed && (
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-300/40">
                  <Shield className="h-7 w-7" />
                </div>

                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-500">
                    INDUS
                  </div>

                  <div className="mt-1 text-[28px] font-extrabold leading-none tracking-tight text-slate-900">
                    Placement Nexus
                  </div>

                  <div className="mt-1 text-sm font-medium text-slate-500">
                    Unified Admin Workspace
                  </div>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => onCollapsedChange(!collapsed)}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
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

        <div
          className="
    flex-1
    overflow-y-auto
    px-7
    py-7
    scrollbar-thin
    scrollbar-thumb-slate-300
    scrollbar-track-transparent
  "
        >
          {ADMIN_NAVIGATION.map((group) => (
            <section key={group.id} className="mb-6">
              {!collapsed && (
                <>
                  <div className="mb-3 flex items-center gap-3">
                    <div className="h-px flex-1 bg-slate-200" />

                    <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-500">
                      {group.title}
                    </span>

                    <div className="h-px flex-1 bg-slate-200" />
                  </div>
                </>
              )}

              <div className="space-y-2">
                {group.items.map((item) => (
                  <AdminNavLink key={item.id} item={item} collapsed={collapsed} />
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Footer */}

        {!collapsed && (
          <div className="border-t border-slate-200 px-5 pt-5 pb-8">
            <div className="rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 px-5 pt-5 pb-8 text-white shadow-lg">
              <div className="text-lg font-bold">Indus Placement Nexus</div>

              <div className="mt-2 text-sm leading-6 text-blue-100">
                Unified administration workspace for campus recruitment management.
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
