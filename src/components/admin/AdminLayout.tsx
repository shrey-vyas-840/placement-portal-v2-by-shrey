import { type ReactNode, useState } from "react";
import { Menu } from "lucide-react";

import { AdminSidebar } from "./AdminSidebar";

interface AdminLayoutProps {
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
}

export function AdminLayout({
  title,
  description,
  children,
  actions,
}: AdminLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex">
        {/* Desktop Sidebar */}

        <div className="hidden lg:block">
          <AdminSidebar
            collapsed={collapsed}
            onCollapsedChange={setCollapsed}
          />
        </div>

        {/* Main Area */}

        <div className="flex min-h-screen flex-1 flex-col">
          {/* Header */}

          <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
            <div className="flex h-20 items-center justify-between px-8">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border lg:hidden"
                >
                  <Menu className="h-5 w-5" />
                </button>

                <div>
                  <h1 className="text-2xl font-bold tracking-tight">
                    {title}
                  </h1>

                  {description && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {description}
                    </p>
                  )}
                </div>
              </div>

              {actions && (
                <div className="flex items-center gap-3">
                  {actions}
                </div>
              )}
            </div>
          </header>

          {/* Page */}

          <main className="flex-1">
            <div className="mx-auto w-full max-w-[1700px] p-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}