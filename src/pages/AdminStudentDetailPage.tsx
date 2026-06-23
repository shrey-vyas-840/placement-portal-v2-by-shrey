import { useEffect, useState } from "react";
import { adminStudentService } from "@/services/adminStudentService";

import {
  getDraftByEnrollmentNo,
  approveOnboardingDraft,
  rejectOnboardingDraft,
} from "@/services/studentOnboardingDraftService";

import { authService } from "@/services/authService";

export function AdminStudentDetailPage({ studentId }: { studentId: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<any>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const result = await adminStudentService.getStudentById(studentId);

        setData(result);

        if (result?.profile?.enrollment_no) {
          const onboardingDraft = await getDraftByEnrollmentNo(result.profile.enrollment_no);

          setDraft(onboardingDraft);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [studentId]);

  if (loading) {
    return <div className="p-8">Loading Student...</div>;
  }

  if (!data?.profile) {
    return <div className="p-8">Student not found.</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <h1 className="text-3xl font-bold">Student Details</h1>

        <div className="mt-8 space-y-6">
          <div className="rounded-lg border p-5">
            <h2 className="font-semibold">Profile</h2>

            <p>
              Name: {data.profile.first_name} {data.profile.last_name}
            </p>

            <p>Enrollment: {data.profile.enrollment_no}</p>

            <p>Institute Email: {data.profile.institute_email}</p>

            <p>Contact: {data.profile.contact_number}</p>
          </div>

          <div className="rounded-lg border p-5">
            <h2 className="font-semibold">Academics</h2>

            <p>CGPA: {data.academics?.current_cgpa}</p>

            <p>Semester: {data.academics?.current_semester}</p>

            <p>Branch: {data.academics?.current_branch_name}</p>

            <p>Graduation: {data.academics?.graduation_year}</p>
          </div>

          <div className="rounded-lg border p-5">
            <h2 className="font-semibold">Skills</h2>

            <p>Programming: {data.skills?.programming_languages}</p>

            <p>Technical: {data.skills?.technical_skills}</p>

            <p>Tools: {data.skills?.tools_and_technologies}</p>
          </div>

          <div className="rounded-lg border p-5">
            <h2 className="font-semibold">Documents</h2>

            <p className="mb-4">Total Documents: {data.documents?.length ?? 0}</p>

            <div className="space-y-3">
              {data.documents?.map((doc: any) => (
                <div key={doc.student_document_id} className="rounded border p-3">
                  <p>
                    <strong>Document:</strong> {doc.document_metadata?.document_name}
                  </p>

                  <p>
                    <strong>Type:</strong> {doc.document_metadata?.document_type}
                  </p>

                  <p>
                    <strong>Status:</strong> {doc.verification_status}
                  </p>

                  {doc.document_metadata?.storage_url && (
                    <a
                      href={doc.document_metadata.storage_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary underline"
                    >
                      Open Document
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>

          {draft && (
            <div className="rounded-lg border p-5">
              <h2 className="font-semibold">Onboarding Review</h2>

              <div className="mt-4 space-y-2">
                <p>
                  <strong>Approval Status:</strong> {draft.approval_status ?? "PENDING_APPROVAL"}
                </p>

                <p>
                  <strong>Registry Found:</strong> {draft.registry_found ? "Yes" : "No"}
                </p>

                <p>
                  <strong>Policy Accepted:</strong> {draft.policy_accepted ? "Yes" : "No"}
                </p>

                <p>
                  <strong>Mail Received:</strong> {draft.mail_confirmation_received ? "Yes" : "No"}
                </p>

                <p>
                  <strong>Mail Type:</strong> {draft.mail_type ?? "-"}
                </p>
              </div>

              <div className="mt-4 rounded border p-3">
                <pre className="overflow-auto text-xs">
                  {JSON.stringify(draft.questionnaire_answers, null, 2)}
                </pre>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    window.open(
                      `https://mail.google.com/mail/u/0/#search/${data.profile.enrollment_no}`,
                      "_blank",
                    );
                  }}
                  className="rounded border px-4 py-2"
                >
                  Check Mail
                </button>

                <button
                  type="button"
                  disabled={reviewLoading}
                  onClick={async () => {
                    try {
                      setReviewLoading(true);

                      const session = await authService.getSession();

                      if (!session?.user?.id) {
                        throw new Error("Unable to determine current admin user.");
                      }

                      await approveOnboardingDraft(draft.auth_provider_id, session.user.id);

                      const refreshed = await getDraftByEnrollmentNo(data.profile.enrollment_no);

                      setDraft(refreshed);

                      alert("Student approved successfully.");
                    } catch (error) {
                      console.error(error);

                      alert("Unable to approve student.");
                    } finally {
                      setReviewLoading(false);
                    }
                  }}
                  className="rounded bg-green-600 px-4 py-2 text-white"
                >
                  Approve
                </button>

                <button
                  type="button"
                  disabled={reviewLoading || !rejectionReason.trim()}
                  onClick={async () => {
                    try {
                      setReviewLoading(true);

                      const session = await authService.getSession();

                      if (!session?.user?.id) {
                        throw new Error("Unable to determine current admin user.");
                      }

                      await rejectOnboardingDraft(draft.auth_provider_id, session.user.id, rejectionReason);

                      const refreshed = await getDraftByEnrollmentNo(data.profile.enrollment_no);

                      setDraft(refreshed);

                      alert("Student rejected successfully.");
                    } catch (error) {
                      console.error(error);

                      alert("Unable to reject student.");
                    } finally {
                      setReviewLoading(false);
                    }
                  }}
                  className="rounded bg-red-600 px-4 py-2 text-white"
                >
                  Reject
                </button>
              </div>

              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Rejection reason (required before rejecting)"
                className="mt-4 w-full rounded border p-3"
                rows={4}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
