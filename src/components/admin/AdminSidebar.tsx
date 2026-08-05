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
        collapsed ? "w-24" : "w-[380px]",
      )}
    >
      <div
        className="
    flex
    h-full
    flex-col
    border-r
    border-slate-200/70
    bg-gradient-to-b
    from-white
    via-slate-50
    to-slate-100
    shadow-xl
"
      >
        {/* Header */}

        <div className="border-b border-slate-200/60 bg-white/70 backdrop-blur-xl px-6 py-5">
          <div className="flex items-start justify-between">
            {!collapsed && (
              <div className="flex items-center gap-5">
                <div className="relative shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-[22px] bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-xl shadow-blue-300/40">
                    <Shield className="h-6 w-6" />
                  </div>

                  <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
                </div>

                <div className="min-w-0 flex-1 pl-1">
                  <div className="text-[10px] font-bold uppercase tracking-[0.45em] text-slate-400">
                    INDUS UNIVERSITY
                  </div>

                  <div className="mt-1 text-[30px] font-black leading-none tracking-tight text-slate-900">
                    Placement
                  </div>

                  <div className="-mt-1 text-[30px] font-black leading-none tracking-tight text-slate-900">
                    Nexus
                  </div>

                  <div className="mt-2 text-sm font-medium text-slate-500">
                    Unified Admin Workspace
                  </div>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => onCollapsedChange(!collapsed)}
              className="
        flex
        h-11
        w-11
        items-center
        justify-center
        rounded-2xl
        border
        border-slate-200
        bg-white
        shadow-sm
        transition-all
        duration-300
        hover:-translate-y-0.5
        hover:shadow-lg
      "
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
    px-5
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

              <div className="space-y-2.5">
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
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 p-6 text-white shadow-xl">
              <div className="relative z-10">
                <div className="text-xl font-bold">Indus Placement Nexus</div>

                <div className="mt-3 text-sm leading-7 text-blue-100">
                  Unified administration workspace for campus recruitment management.
                </div>
              </div>

              <div
                className="
        absolute
        -right-5

        -bottom-6
        h-28
        w-28
        rounded-full
        bg-white/10
    "
              />

              <div
                className="
        absolute
        right-8
        top-6
        h-2
        w-2
        rounded-full
        bg-white/70
    "
              />

              <div
                className="
        absolute
        right-14
        top-12
        h-1.5
        w-1.5
        rounded-full
        bg-white/40
    "
              />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
