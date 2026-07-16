import { useEffect, useMemo, useState } from "react";
import { Search, Users } from "lucide-react";
import { ApplicantDetailsDrawer } from "./ApplicantDetailsDrawer";
import {
  getRecruitmentApplicants,
  getApplicantQuestionAnswers,
  getApplicantDocuments,
  type RecruitmentApplicant,
  type RecruitmentQuestionAnswer,
  type RecruitmentDocument,
} from "@/services/recruitmentAnalyticsService";
interface ApplicantsTabProps {
  opportunityId: string | null;
}

export function ApplicantsTab({
  opportunityId,
}: ApplicantsTabProps) {
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [applicants, setApplicants] = useState<
    RecruitmentApplicant[]
  >([]);
  const [selectedApplicant, setSelectedApplicant] =
  useState<RecruitmentApplicant | null>(null);

const [drawerOpen, setDrawerOpen] =
  useState(false);

  const [answers, setAnswers] =
  useState<RecruitmentQuestionAnswer[]>([]);

  const [documents, setDocuments] =
  useState<RecruitmentDocument[]>([]);

  useEffect(() => {
    if (!opportunityId) {
      setApplicants([]);
      setLoading(false);
      return;
    }

    let mounted = true;

    async function loadApplicants() {
      setLoading(true);

      try {
        const data =
          await getRecruitmentApplicants(opportunityId!);

        if (!mounted) return;

        setApplicants(data);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadApplicants();

    return () => {
      mounted = false;
    };
  }, [opportunityId]);

  const filteredApplicants = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return applicants;

    return applicants.filter((applicant) =>
      applicant.fullName.toLowerCase().includes(query)
    );
  }, [applicants, search]);

 return (
  <>
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div>

          <h2 className="text-2xl font-bold">
            Applicants
          </h2>

          <p className="text-muted-foreground">
            {filteredApplicants.length} applicant(s)
          </p>

        </div>

        <div className="relative w-full lg:w-80">

          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

          <input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search applicant..."
            className="w-full rounded-xl border bg-background py-2 pl-10 pr-4 outline-none"
          />

        </div>

      </div>

      <div className="overflow-hidden rounded-2xl border">

        <table className="w-full">

          <thead className="bg-muted/50">

            <tr>

              <th className="px-5 py-3 text-left">
                Student
              </th>

              <th className="px-5 py-3 text-left">
                Institute
              </th>

              <th className="px-5 py-3 text-left">
                Branch
              </th>

              <th className="px-5 py-3 text-left">
                Roles
              </th>

              <th className="px-5 py-3 text-left">
                Applied
              </th>

              <th className="px-5 py-3 text-left">
                Status
              </th>

            </tr>

          </thead>

          <tbody>

            {loading && (

              <tr>

                <td
                  colSpan={6}
                  className="p-12 text-center"
                >
                  Loading applicants...
                </td>

              </tr>

            )}

            {!loading &&
              filteredApplicants.length === 0 && (

                <tr>

                  <td
                    colSpan={6}
                    className="p-16 text-center"
                  >

                    <Users className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />

                    <div className="font-semibold">
                      No Applicants Yet
                    </div>

                    <div className="text-sm text-muted-foreground">
                      Applications will appear here automatically.
                    </div>

                  </td>

                </tr>

              )}

            {!loading &&
              filteredApplicants.map(
                (applicant) => (

               <tr
  key={applicant.applicationId}
onClick={async () => {

  setSelectedApplicant(applicant);

  setDrawerOpen(true);

  const [
    answerResult,
    documentResult,
  ] = await Promise.all([

    getApplicantQuestionAnswers(
      applicant.applicationId
    ),

    getApplicantDocuments(
      applicant.applicationId
    ),

  ]);

  setAnswers(answerResult);

  setDocuments(documentResult);

}}
  className="cursor-pointer transition-colors hover:bg-muted/40"
                  >

                    <td className="px-5 py-4 font-medium">
                      {applicant.fullName}
                    </td>

                    <td className="px-5 py-4">
                      {applicant.institute}
                    </td>

                    <td className="px-5 py-4">
                      {applicant.branch}
                    </td>

                    <td className="px-5 py-4">

                      <div className="flex flex-wrap gap-2">

                        {applicant.roles.map((role) => (

                          <span
                            key={role}
                            className="rounded-full bg-primary/10 px-3 py-1 text-xs"
                          >
                            {role}
                          </span>

                        ))}

                      </div>

                    </td>

                    <td className="px-5 py-4">
                      {new Date(
                        applicant.appliedAt
                      ).toLocaleString()}
                    </td>

                    <td className="px-5 py-4">

                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                        {applicant.applicationStatus}
                      </span>

                    </td>

                  </tr>

                )
              )}

          </tbody>

        </table>

      </div>

       </div>

<ApplicantDetailsDrawer
  applicant={selectedApplicant}
  answers={answers}
  documents={documents}
  open={drawerOpen}
  onClose={() => setDrawerOpen(false)}
/>
  </>
  );
}