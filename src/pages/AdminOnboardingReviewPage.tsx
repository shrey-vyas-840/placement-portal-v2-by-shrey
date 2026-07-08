import { useEffect, useState } from "react";

import {
  approveOnboardingDraft,
  rejectOnboardingDraft,
  getDraftById,
  REVIEW_SECTIONS,
  type ReviewSection,
} from "@/services/studentOnboardingDraftService";

import { authService } from "@/services/authService";

function formatRegistryStatus(value?: string | null) {
  const normalized = value?.toLowerCase() ?? "";

  if (normalized.includes("out")) {
    return "Placement Opted-Out";
  }

  if (normalized.includes("in")) {
    return "Placement Opted-In";
  }

  return "-";
}

function formatApprovalStatus(status?: string | null) {
  switch (status) {
    case "PENDING_PROFILE_VERIFICATION":
      return "Pending Review";

    case "PROFILE_APPROVED":
      return "Approved";

    case "PROFILE_REJECTED":
      return "Rejected";

    default:
      return "Pending";
  }
}

export function AdminOnboardingReviewPage({ draftId }: { draftId: string }) {
  const [draft, setDraft] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showGeneratedMail, setShowGeneratedMail] = useState(false);
  const [reviewSection, setReviewSection] = useState<ReviewSection>(REVIEW_SECTIONS.PROFILE);

  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    async function load() {
      const result = await getDraftById(draftId);

      setDraft(result);
      setLoading(false);
    }

    load();
  }, [draftId]);

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!draft) {
    return <div className="p-8">Draft not found.</div>;
  }
  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <h1 className="text-3xl font-bold">Onboarding Review</h1>
      {draft.approval_status === "PENDING_PROFILE_VERIFICATION" && (
        <div
          className="
    sticky
    top-4
    z-30
    mb-4
    flex
    justify-end
    gap-3
    rounded-2xl
    border
    bg-white/90
    p-4
    backdrop-blur
    shadow-lg
  "
        >
          {draft.approval_status === "PENDING_PROFILE_VERIFICATION" && (
            <div className="flex gap-3">
              <button
                className="rounded bg-green-600 px-4 py-2 text-white"
                onClick={async () => {
                  try {
                    const session = await authService.getSession();

                    if (!session?.user?.id) {
                      alert("No admin session");
                      return;
                    }

                    await approveOnboardingDraft(draft.draft_id, session.user.id);

                    alert("Approved");

                    window.location.reload();
                  } catch (error) {
                    alert(error instanceof Error ? error.message : "Approve failed");
                  }
                }}
              >
                Approve
              </button>

              <div className="flex items-center gap-3">
                <select
                  value={reviewSection}
                  onChange={(e) => setReviewSection(e.target.value as ReviewSection)}
                  className="rounded border px-3 py-2"
                >
                  <option value={REVIEW_SECTIONS.PROFILE}>Profile Details</option>

                  <option value={REVIEW_SECTIONS.QUESTIONNAIRE}>Questionnaire</option>
                </select>

                <input
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter rejection reason..."
                  className="w-80 rounded border px-3 py-2"
                />

                <button
                  className="rounded bg-red-600 px-4 py-2 text-white"
                  onClick={async () => {
                    if (!rejectionReason.trim()) {
                      alert("Please enter rejection reason.");
                      return;
                    }

                    const session = await authService.getSession();

                    if (!session?.user?.id) {
                      alert("No admin session");
                      return;
                    }

                    await rejectOnboardingDraft(
                      draft.draft_id,
                      session.user.id,
                      rejectionReason.trim(),
                      reviewSection,
                    );

                    alert("Rejected");

                    window.location.reload();
                  }}
                >
                  Reject
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid gap-6">
        <div className="rounded-2xl border bg-card space-y-6 p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Student Information</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <ReviewField label="Enrollment Number" value={draft.enrollment_no} />

            <ReviewField label="Email:" value={draft.email_address} />
            <ReviewField label="First Name:" value={draft.edited_profile?.first_name ?? "-"} />
            <ReviewField label="Last Name:" value={draft.edited_profile?.last_name ?? "-"} />
            <ReviewField label="Gender:" value={draft.edited_profile?.gender ?? "-"} />
            <ReviewField label="Contact:" value={draft.edited_profile?.contact_number ?? "-"} />
            <ReviewField
              label="Date of Birth:"
              value={draft.edited_profile?.date_of_birth ?? "-"}
            />
            <ReviewField
              label="Graduation Year:"
              value={draft.edited_profile?.graduation_year ?? "-"}
            />
          </div>
        </div>

        <div
          className="
  rounded-3xl
  border
  border-border/50
  bg-white
  space-y-4
  p-6
  shadow-sm
"
        >
          <h2 className="text-xl font-semibold">Registry Snapshot</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <ReviewField label="Institute" value={draft.registry_snapshot?.institute_name ?? "-"} />

            <ReviewField label="Degree" value={draft.registry_snapshot?.current_degree ?? "-"} />

            <ReviewField
              label="Branch"
              value={draft.registry_snapshot?.bachelors_degree_branch ?? "-"}
            />
          </div>
        </div>

        <div
          className="
  rounded-3xl
  border
  border-border/50
  bg-white
  space-y-6
  p-6
  shadow-sm
"
        >
          <h2 className="text-xl font-semibold">Student Preference</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <ReviewField
              label="Registry Participation Status"
              value={formatRegistryStatus(draft.registry_snapshot?.placement_preference_text)}
            />

            <ReviewField
              label="Student Placement Preference"
              value={draft.edited_profile?.placement_preference ?? "-"}
            />
          </div>

          {draft.edited_profile?.placement_preference &&
            (draft.registry_snapshot?.placement_preference_text?.toLowerCase().includes("out") ||
              draft.edited_profile.placement_preference !== "Interested") && (
              <div
                className="
    mt-6
    rounded-2xl
    border
    border-amber-300
    bg-gradient-to-r
    from-amber-50
    to-orange-50
    p-5
    shadow-sm
  "
              >
                <div className="flex items-start gap-3">
                  <div className="text-xl">⚠️</div>

                  <div>
                    <div className="font-semibold text-amber-900">Preference Requires Review</div>

                    <div className="mt-2 text-sm text-amber-800">
                      Registry Status:{" "}
                      {formatRegistryStatus(draft.registry_snapshot?.placement_preference_text)}
                    </div>

                    <div className="text-sm text-amber-800">
                      Student Selected: {draft.edited_profile?.placement_preference}
                    </div>
                  </div>
                </div>
              </div>
            )}
        </div>
        <div
          className="
  rounded-3xl
  border
  border-border/50
  bg-white
  space-y-4
  p-6
  shadow-sm
"
        >
          <h2 className="text-xl font-semibold">Questionnaire Responses</h2>

          <div className="grid gap-4 md:grid-cols-2">
            <ReviewField
              label="Career Goal"
              value={draft.questionnaire_answers?.careerGoal ?? "-"}
            />

            <ReviewField
              label="Abroad Plan"
              value={draft.questionnaire_answers?.abroadPlan ? "Yes" : "No"}
            />

            <ReviewField
              label="Higher Studies"
              value={draft.questionnaire_answers?.higherStudies ? "Yes" : "No"}
            />

            <ReviewField
              label="Startup Plan"
              value={draft.questionnaire_answers?.startupPlan ? "Yes" : "No"}
            />

            <ReviewField
              label="LOR Required"
              value={draft.questionnaire_answers?.lorRequired ? "Yes" : "No"}
            />

            <ReviewField
              label="Competitive Exam"
              value={draft.questionnaire_answers?.competitiveExam ? "Yes" : "No"}
            />

            <ReviewField
              label="Opt-Out Required"
              value={draft.questionnaire_answers?.optOutRequired ? "Yes" : "No"}
            />

            <ReviewField
              label="Opt-Out Email Sent"
              value={draft.questionnaire_answers?.optOutEmailRequested ? "Yes" : "No"}
            />
          </div>
        </div>

        {draft.questionnaire_answers?.optOutReason && (
          <div
            className="
  rounded-3xl
  border
  border-border/50
  bg-white
  p-6
  shadow-sm
"
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Generated Opt-Out Request</h2>

                <p className="text-sm text-muted-foreground">
                  Generated automatically from onboarding responses.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowGeneratedMail(!showGeneratedMail)}
                className="
  rounded-xl
  border
  px-4
  py-2
  font-medium
  transition-all
  hover:bg-slate-50
  hover:shadow-md
"
              >
                {showGeneratedMail ? "Hide Mail" : "View Mail"}
              </button>
            </div>

            {showGeneratedMail && (
              <div className="rounded-xl border bg-muted/30 p-4">
                <pre
                  className="
    whitespace-pre-wrap
    rounded-2xl
    border
    bg-white
    space-y-6
    p-6
    text-sm
    leading-7
    shadow-inner
  "
                >
                  {draft.questionnaire_answers.optOutReason}
                </pre>
              </div>
            )}
          </div>
        )}

        <div
          className="
    rounded-3xl
    border
    border-border/50
    bg-white
    space-y-6
    p-6
    shadow-sm
  "
        >
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Policy & Submission</h2>

            <p className="text-sm text-muted-foreground">
              Final onboarding declarations and verification status.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <ReviewField label="Policy Accepted" value={draft.policy_accepted ? "Yes" : "No"} />

            <ReviewField
              label="Final Confirmation"
              value={draft.final_confirmation ? "Yes" : "No"}
            />

            <ReviewField
              label="Onboarding Completed"
              value={draft.onboarding_completed ? "Yes" : "No"}
            />

            <ReviewField
              label="Approval Status"
              value={formatApprovalStatus(draft.approval_status)}
            />
          </div>
        </div>
        <div className="rounded-2xl border bg-card space-y-6 p-6 shadow-sm">
          <h2 className="text-xl font-semibold space-y-6 p-2">Review History</h2>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <ReviewField label="Approved By" value={draft.approved_by ?? "-"} />

            <ReviewField
              label="Approved At"
              value={draft.approved_at ? new Date(draft.approved_at).toLocaleString() : "-"}
            />

            <ReviewField label="Reviewed By:" value={draft.reviewed_by ?? "-"} />

            <ReviewField
              label="Reviewed At:"
              value={draft.reviewed_at ? new Date(draft.reviewed_at).toLocaleString() : "-"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div
      className="
        rounded-2xl
        border
        border-border/80
        bg-white
        p-4
        transition-all
        hover:-translate-y-1
        hover:border-primary/60
        hover:bg-slate-50
        hover:shadow-md
      "
    >
      <div
        className="
          text-xs
          uppercase
          tracking-[0.12em]
          text-muted-foreground
        "
      >
        {label}
      </div>

      <div className="mt-2 font-semibold">{value || "-"}</div>
    </div>
  );
}
