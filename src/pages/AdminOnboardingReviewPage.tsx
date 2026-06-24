import { useEffect, useState } from "react";

import {
  approveOnboardingDraft,
  rejectOnboardingDraft,
  getDraftById,
} from "@/services/studentOnboardingDraftService";

import { authService } from "@/services/authService";

export function AdminOnboardingReviewPage({ draftId }: { draftId: string }) {
  const [draft, setDraft] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">Onboarding Review</h1>

      <div className="grid gap-6">
        <div className="rounded-xl border p-4">
          <h2 className="mb-3 text-lg font-semibold">Student Information</h2>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="font-medium">Enrollment:</span> {draft.enrollment_no}
            </div>

            <div>
              <span className="font-medium">Email:</span> {draft.email_address}
            </div>

            <div>
              <span className="font-medium">First Name:</span>{" "}
              {draft.edited_profile?.first_name ?? "-"}
            </div>

            <div>
              <span className="font-medium">Last Name:</span>{" "}
              {draft.edited_profile?.last_name ?? "-"}
            </div>

            <div>
              <span className="font-medium">Contact:</span>{" "}
              {draft.edited_profile?.contact_number ?? "-"}
            </div>

            <div>
              <span className="font-medium">Gender:</span> {draft.edited_profile?.gender ?? "-"}
            </div>

            <div>
              <span className="font-medium">DOB:</span> {draft.edited_profile?.date_of_birth ?? "-"}
            </div>

            <div>
              <span className="font-medium">Graduation Year:</span>{" "}
              {draft.edited_profile?.graduation_year ?? "-"}
            </div>
          </div>
        </div>

        <div className="rounded-xl border p-4">
          <h2 className="mb-3 text-lg font-semibold">Registry Snapshot</h2>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="font-medium">Institute:</span>{" "}
              {draft.registry_snapshot?.institute_name ?? "-"}
            </div>

            <div>
              <span className="font-medium">Degree:</span>{" "}
              {draft.registry_snapshot?.current_degree ?? "-"}
            </div>

            <div>
              <span className="font-medium">Branch:</span>{" "}
              {draft.registry_snapshot?.bachelors_degree_branch ?? "-"}
            </div>

            <div>
              <span className="font-medium">Registry Participation Status:</span>{" "}
              {draft.registry_snapshot?.placement_preference_text ?? "-"}
            </div>
          </div>
        </div>

        <div className="rounded-xl border p-4">
          <h2 className="mb-3 text-lg font-semibold">Student Preference</h2>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="font-medium">Registry Participation Status:</span>{" "}
              {draft.registry_snapshot?.placement_preference_text ?? "-"}
            </div>

            <div>
              <span className="font-medium">Student Placement Preference:</span>{" "}
              {draft.edited_profile?.placement_preference ?? "-"}
            </div>
          </div>

          {draft.registry_snapshot?.placement_preference_text &&
            draft.edited_profile?.placement_preference &&
            (draft.registry_snapshot.placement_preference_text.toLowerCase().includes("out") ||
              draft.edited_profile.placement_preference !== "Interested") && (
              <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4">
                <div className="font-semibold text-amber-800">Preference Requires Review</div>

                <div className="mt-2 text-sm">
                  Registry Status: {draft.registry_snapshot?.placement_preference_text}
                </div>

                <div className="text-sm">
                  Student Selected: {draft.edited_profile?.placement_preference}
                </div>
              </div>
            )}
        </div>

        <div className="rounded-xl border p-4">
          <h2 className="mb-3 text-lg font-semibold">Questionnaire Responses</h2>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="font-medium">Career Goal:</span>{" "}
              {draft.questionnaire_answers?.careerGoal ?? "-"}
            </div>

            <div>
              <span className="font-medium">Abroad Plan:</span>{" "}
              {draft.questionnaire_answers?.abroadPlan ? "Yes" : "No"}
            </div>

            <div>
              <span className="font-medium">Higher Studies:</span>{" "}
              {draft.questionnaire_answers?.higherStudies ? "Yes" : "No"}
            </div>

            <div>
              <span className="font-medium">Startup Plan:</span>{" "}
              {draft.questionnaire_answers?.startupPlan ? "Yes" : "No"}
            </div>

            <div>
              <span className="font-medium">LOR Required:</span>{" "}
              {draft.questionnaire_answers?.lorRequired ? "Yes" : "No"}
            </div>

            <div>
              <span className="font-medium">Competitive Exam:</span>{" "}
              {draft.questionnaire_answers?.competitiveExam ? "Yes" : "No"}
            </div>

            <div>
              <span className="font-medium">Opt-Out Required:</span>{" "}
              {draft.questionnaire_answers?.optOutRequired ? "Yes" : "No"}
            </div>

            <div>
              <span className="font-medium">Opt-Out Email Sent:</span>{" "}
              {draft.questionnaire_answers?.optOutEmailRequested ? "Yes" : "No"}
            </div>
          </div>
        </div>

        {draft.questionnaire_answers?.optOutReason && (
          <div className="mt-4 rounded-xl border border-border bg-background p-4">
            <div className="mb-2 font-semibold">Generated Opt-Out Request</div>

            <pre className="whitespace-pre-wrap text-sm">
              {draft.questionnaire_answers.optOutReason}
            </pre>
          </div>
        )}

        <div className="rounded-xl border p-4">
          <h2 className="mb-3 text-lg font-semibold">Policy & Submission</h2>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>Policy Accepted: {draft.policy_accepted ? "Yes" : "No"}</div>

            <div>Final Confirmation: {draft.final_confirmation ? "Yes" : "No"}</div>

            <div>Onboarding Completed: {draft.onboarding_completed ? "Yes" : "No"}</div>

            <div>Approval Status: {draft.approval_status ?? "Pending"}</div>
          </div>
        </div>
      </div>

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

          <button
            className="rounded bg-red-600 px-4 py-2 text-white"
            onClick={async () => {
              const rejectionReason = window.prompt("Please enter rejection reason");

              if (!rejectionReason?.trim()) {
                return;
              }

              const session = await authService.getSession();

              if (!session?.user?.id) {
                return;
              }

              await rejectOnboardingDraft(draft.draft_id, session.user.id, rejectionReason.trim());

              alert("Rejected");

              window.location.reload();
            }}
          >
            Reject
          </button>
        </div>
      )}
    </div>
  );
}
