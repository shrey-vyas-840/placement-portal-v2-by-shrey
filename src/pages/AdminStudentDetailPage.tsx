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

  const [restrictions, setRestrictions] = useState<any[]>([]);
  const [restrictionType, setRestrictionType] = useState("ATTENDANCE_RESTRICTION");
  const [restrictionReason, setRestrictionReason] = useState("");
  const [restrictionLoading, setRestrictionLoading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const result = await adminStudentService.getStudentById(studentId);

        setData(result);

        const restrictionData = await adminStudentService.getStudentRestrictions(studentId);

        setRestrictions(restrictionData);

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

          <div className="rounded-lg border p-5">
            <h2 className="font-semibold">Placement Restrictions</h2>

            <div className="mt-4 grid gap-3">
              <select
                value={restrictionType}
                onChange={(e) => setRestrictionType(e.target.value)}
                className="rounded border p-2"
              >
                <option value="ATTENDANCE_RESTRICTION">Attendance Restriction</option>

                <option value="GRIEVANCE_RESTRICTION">Grievance Restriction</option>

                <option value="MISBEHAVIOR_RESTRICTION">Misbehavior Restriction</option>

                <option value="CUSTOM">Custom Restriction</option>
              </select>

              <textarea
                rows={4}
                value={restrictionReason}
                onChange={(e) => setRestrictionReason(e.target.value)}
                placeholder="Restriction reason"
                className="rounded border p-3"
              />

              <button
                type="button"
                disabled={
                  restrictionLoading || (restrictionType === "CUSTOM" && !restrictionReason.trim())
                }
                onClick={async () => {
                  try {
                    setRestrictionLoading(true);

                    const session = await authService.getSession();

                    if (!session?.user?.id) {
                      throw new Error("Unable to determine admin.");
                    }

                    const finalReason =
                      restrictionType === "CUSTOM"
                        ? restrictionReason
                        : restrictionReason ||
                          {
                            ATTENDANCE_RESTRICTION: "Attendance shortage",
                            GRIEVANCE_RESTRICTION: "Student grievance case under review",
                            MISBEHAVIOR_RESTRICTION: "Student conduct review in progress",
                          }[restrictionType];

                    await adminStudentService.createRestriction({
                      student_id: studentId,
                      restriction_type: restrictionType,
                      restriction_reason: finalReason ?? "",
                      restricted_by: session.user.id,
                    });

                    const refreshed = await adminStudentService.getStudentRestrictions(studentId);

                    setRestrictions(refreshed);

                    setRestrictionReason("");
                  } catch (err) {
                    console.error(err);
                    alert("Unable to create restriction.");
                  } finally {
                    setRestrictionLoading(false);
                  }
                }}
                className="rounded bg-red-600 px-4 py-2 text-white"
              >
                Apply Restriction
              </button>
            </div>

            <div className="mt-6 space-y-3">
              {restrictions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No restrictions found.</p>
              ) : (
                restrictions.map((restriction) => (
                  <div key={restriction.restriction_id} className="rounded border p-3">
                    <p>
                      <strong>Type:</strong> {restriction.restriction_type}
                    </p>

                    <p>
                      <strong>Reason:</strong> {restriction.restriction_reason}
                    </p>

                    <p>
                      <strong>Status:</strong> {restriction.is_active ? "Active" : "Removed"}
                    </p>

                    {restriction.is_active && (
                      <button
                        type="button"
                        onClick={async () => {
                          await adminStudentService.removeRestriction(restriction.restriction_id);

                          const refreshed =
                            await adminStudentService.getStudentRestrictions(studentId);

                          setRestrictions(refreshed);
                        }}
                        className="mt-3 rounded border px-3 py-1"
                      >
                        Remove Restriction
                      </button>
                    )}
                  </div>
                ))
              )}
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

                      await rejectOnboardingDraft(
                        draft.auth_provider_id,
                        session.user.id,
                        rejectionReason,
                      );

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
