import { Link } from "@tanstack/react-router";

function SidebarLink({
  to,
  label,
  description,
}: {
  to: string;
  label: string;
  description: string;
}) {
  return (
    <Link
      to={to}
      activeProps={{
        className: "border-primary/20 bg-primary/5 shadow-md",
      }}
      className="
        group
        relative
        block
        overflow-hidden
        rounded-2xl
        border
        border-border
        bg-card
        p-4
        transition-all
        duration-200
        hover:-translate-y-0.5
        hover:border-primary/30
        hover:shadow-lg
      "
    >
      <div
        className="
          absolute
          left-0
          top-0
          h-full
          w-1
          bg-primary
          opacity-0
          transition-opacity
          group-hover:opacity-100
        "
      />

      <div className="font-semibold text-foreground">
        {label}
      </div>

      <div className="mt-1 text-xs leading-relaxed text-muted-foreground">
        {description}
      </div>
    </Link>
  );
}

interface StudentSidebarProps {
  completionName: string;
  completionPercentage: number;
}

export function StudentSidebar({
  completionName,
  completionPercentage,
}: StudentSidebarProps) {
  return (
<aside
  className="
    w-full
    border-r
    border-border/60
    bg-white/70
    backdrop-blur-xl
    p-5
    lg:w-[285px]
    lg:min-w-[285px]
    lg:max-w-[285px]
    lg:flex-shrink-0
  "
>
      <div className="mb-6">
        <div className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
          Indus Placement Nexus
        </div>

        <div className="mt-2 text-2xl font-bold tracking-tight text-foreground">
          Student Workspace
        </div>

        <p className="mt-2 text-sm text-muted-foreground">
          Welcome
          {completionName ? `, ${completionName}` : ""}.
        </p>
      </div>

      <div
        className="
          mb-6
          overflow-hidden
          rounded-3xl
          border
          border-primary/10
          bg-gradient-to-br
          from-primary
          to-blue-700
          p-5
          text-white
        "
      >
        <div
          className="
            flex
            h-12
            w-12
            items-center
            justify-center
            rounded-2xl
            bg-white/20
            text-lg
            font-bold
          "
        >
          {completionName?.charAt(0) || "S"}
        </div>

        <div className="mt-4">
          <div className="font-semibold">
            {completionName || "Student"}
          </div>

          <div className="text-sm text-white/70">
            Student
          </div>
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between text-xs">
            <span>Profile Completion</span>

            <span>{completionPercentage}%</span>
          </div>

          <div className="mt-2 h-2 rounded-full bg-white/20">
            <div
              className="h-2 rounded-full bg-white"
              style={{
                width: `${completionPercentage}%`,
              }}
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <SidebarLink
          to="/dashboard"
          label="Dashboard"
          description="Your overview and analytics."
        />

        <SidebarLink
          to="/profile"
          label="Profile"
          description="Update your personal details."
        />

        <SidebarLink
          to="/opportunities"
          label="Opportunities"
          description="Browse available roles."
        />

        <SidebarLink
          to="/my-applications"
          label="My Applications"
          description="Track your applications."
        />

        <SidebarLink
          to="/student/noc"
          label="NOC Requests"
          description="Submit and track NOC status."
        />
      </div>
    </aside>
  );
}