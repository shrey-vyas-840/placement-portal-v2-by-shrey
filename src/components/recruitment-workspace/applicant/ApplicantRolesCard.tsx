import { Briefcase } from "lucide-react";

interface Props {
  roles: string[];
}

export function ApplicantRolesCard({
  roles,
}: Props) {
  return (
    <div className="rounded-2xl border p-5">

      <h3 className="mb-4 text-lg font-semibold">
        Selected Roles
      </h3>

      <div className="space-y-3">

        {roles.length === 0 ? (
          <div className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">
            No roles selected.
          </div>
        ) : (
          roles.map((role, index) => (
            <div
              key={`${role}-${index}`}
              className="flex items-center gap-3 rounded-xl bg-muted p-3"
            >
              <Briefcase className="h-4 w-4 text-primary" />

              <span>{role}</span>
            </div>
          ))
        )}

      </div>

    </div>
  );
}