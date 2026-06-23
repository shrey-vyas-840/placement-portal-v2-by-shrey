import { useEffect, useState } from "react";

import {
  approveOnboardingDraft,
  rejectOnboardingDraft,
  getDraftById,
} from "@/services/studentOnboardingDraftService";

import { authService } from "@/services/authService";

export function AdminOnboardingReviewPage({ draftId }: { draftId: string }) {
  const [draft, setDraft] = useState<any>(null);
  const [reason, setReason] = useState("");
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

      <div className="rounded-xl border p-4">
        <pre>{JSON.stringify(draft, null, 2)}</pre>
      </div>

      <div className="flex gap-3">
        <button
          className="rounded bg-green-600 px-4 py-2 text-white"
          onClick={async () => {
            try {
              console.log("APPROVE CLICKED");

              const session = await authService.getSession();

              console.log("SESSION", session);

              if (!session?.user?.id) {
                alert("No admin session");
                return;
              }

              await approveOnboardingDraft(draft.auth_provider_id, session.user.id);

              console.log("APPROVE SUCCESS");

              alert("Approved");
            } catch (error) {
              console.error("APPROVE ERROR", error);

              alert(error instanceof Error ? error.message : "Approve failed");
            }
          }}
        >
          Approve
        </button>

        <button
          disabled={!reason.trim()}
          className="rounded bg-red-600 px-4 py-2 text-white"
          onClick={async () => {
            const session = await authService.getSession();

            if (!session?.user?.id) {
              return;
            }

            await rejectOnboardingDraft(draft.auth_provider_id, session.user.id, reason);

            alert("Rejected");
          }}
        >
          Reject
        </button>
      </div>

      <textarea
        rows={4}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="w-full rounded border p-3"
        placeholder="Rejection reason"
      />
    </div>
  );
}
