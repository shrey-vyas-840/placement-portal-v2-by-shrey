import { X, GraduationCap, Building2, UserCircle2, Briefcase } from "lucide-react";

interface ApplicantDetails {
  applicationId: string;
  studentId: string;
  fullName: string;
  institute: string;
  branch: string;
  applicationStatus: string;
  appliedAt: string;
  roles: string[];
}

interface Props {
  applicant: ApplicantDetails | null;
  open: boolean;
  onClose: () => void;
}

export function ApplicantDetailsDrawer({
  applicant,
  open,
  onClose,
}: Props) {
  if (!open || !applicant) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/30"
        onClick={onClose}
      />

      <div className="fixed right-0 top-0 z-50 h-screen w-[520px] overflow-y-auto border-l bg-background shadow-2xl">

        <div className="sticky top-0 flex items-center justify-between border-b bg-background px-6 py-5">

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Applicant
            </p>

            <h2 className="mt-1 text-2xl font-bold">
              {applicant.fullName}
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Applied {new Date(applicant.appliedAt).toLocaleString()}
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>

        </div>

        <div className="space-y-6 p-6">

          <div className="rounded-2xl border p-5">

            <h3 className="mb-4 text-lg font-semibold">
              Student Information
            </h3>

            <div className="space-y-4">

              <div className="flex items-center gap-3">
                <UserCircle2 className="h-5 w-5 text-primary" />
                <span>{applicant.fullName}</span>
              </div>

              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-primary" />
                <span>{applicant.institute}</span>
              </div>

              <div className="flex items-center gap-3">
                <GraduationCap className="h-5 w-5 text-primary" />
                <span>{applicant.branch}</span>
              </div>

            </div>

          </div>

          <div className="rounded-2xl border p-5">

            <h3 className="mb-4 text-lg font-semibold">
              Selected Roles
            </h3>

            <div className="space-y-3">

              {applicant.roles.map((role) => (
                <div
                  key={role}
                  className="flex items-center gap-3 rounded-xl bg-muted p-3"
                >
                  <Briefcase className="h-4 w-4 text-primary" />

                  <span>{role}</span>

                </div>
              ))}

            </div>

          </div>

        </div>

      </div>
    </>
  );
}