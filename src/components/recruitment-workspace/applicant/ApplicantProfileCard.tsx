import { Building2, GraduationCap, UserCircle2 } from "lucide-react";

interface Props {
  fullName: string;
  institute: string;
  branch: string;
}

export function ApplicantProfileCard({ fullName, institute, branch }: Props) {
  return (
    <div className="rounded-2xl border p-5">
      <h3 className="mb-4 text-lg font-semibold">Student Information</h3>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <UserCircle2 className="h-5 w-5 text-primary" />
          <span>{fullName}</span>
        </div>

        <div className="flex items-center gap-3">
          <Building2 className="h-5 w-5 text-primary" />
          <span>{institute}</span>
        </div>

        <div className="flex items-center gap-3">
          <GraduationCap className="h-5 w-5 text-primary" />
          <span>{branch}</span>
        </div>
      </div>
    </div>
  );
}
