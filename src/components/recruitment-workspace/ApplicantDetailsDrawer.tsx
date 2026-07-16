import { X } from "lucide-react";
import { ApplicantProfileCard } from "./applicant/ApplicantProfileCard";
import { ApplicantAcademicCard } from "./applicant/ApplicantAcademicCard";
import { ApplicantRolesCard } from "./applicant/ApplicantRolesCard";
import { ApplicantAnswersCard } from "./applicant/ApplicantAnswersCard";

import type {
  RecruitmentQuestionAnswer,
  RecruitmentDocument,
} from "@/services/recruitmentAnalyticsService";
interface ApplicantDetails {
  applicationId: string;
  studentId: string;
  fullName: string;

  institute: string;
  branch: string;

  currentCgpa: number | null;
  currentSemester: number | null;
  graduationYear: number | null;
  activeBacklogs: number | null;
  yearGapCount: number | null;

  applicationStatus: string;
  appliedAt: string;

  roles: string[];
}

interface Props {
  applicant: ApplicantDetails | null;
  answers: RecruitmentQuestionAnswer[];
  documents: RecruitmentDocument[];
  open: boolean;
  onClose: () => void;
}
export function ApplicantDetailsDrawer({
  applicant,
  answers,
  documents,
  open,
  onClose,
}: Props) {
  if (!open || !applicant) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />

      <div className="fixed right-0 top-0 z-50 h-screen w-[520px] overflow-y-auto border-l bg-background shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b bg-background px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Applicant
            </p>

            <h2 className="mt-1 text-2xl font-bold">{applicant.fullName}</h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Applied {new Date(applicant.appliedAt).toLocaleString()}
            </p>
          </div>

          <button onClick={onClose} className="rounded-lg p-2 hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 p-6">
         <ApplicantProfileCard
  fullName={applicant.fullName}
  institute={applicant.institute}
  branch={applicant.branch}
/>

<ApplicantAcademicCard
  currentCgpa={applicant.currentCgpa}
  currentSemester={applicant.currentSemester}
  graduationYear={applicant.graduationYear}
  activeBacklogs={applicant.activeBacklogs}
  yearGapCount={applicant.yearGapCount}
/>

<ApplicantRolesCard
  roles={applicant.roles}
/>

<ApplicantAnswersCard
  answers={answers}
  documents={documents}
/>

        </div>
      </div>
    </>
  );
}
