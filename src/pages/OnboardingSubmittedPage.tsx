import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { authService } from "@/services/authService";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function OnboardingSubmittedPage() {
  const navigate = useNavigate();

  const [draft, setDraft] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const session = await authService.getSession();

      if (!session?.user?.email) {
        setLoading(false);
        return;
      }

      const { data, error } = await (supabase as any)
        .from("student_onboarding_drafts")
        .select(
          `
    approval_status,
    rejection_reason,
    rejection_step,
    reviewed_at
  `,
        )
        .eq("email_address", session.user.email)
        .maybeSingle();

      if (error) {
        console.error(error);
      }

      setDraft(data);
      setLoading(false);
    }

    load();
  }, []);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  const rejected = draft?.approval_status === "PROFILE_REJECTED";

  const sectionName =
    draft?.rejection_step === "QUESTIONNAIRE" ? "Questionnaire" : "Profile Details";

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="max-w-2xl rounded-3xl border bg-card p-8 text-center shadow-sm">
        <h1 className="text-3xl font-bold">
          {rejected ? "Profile Requires Changes" : "Verification Submitted"}
        </h1>

        <p className="mt-4 text-muted-foreground">
          {rejected
            ? "The Training & Placement Cell has reviewed your onboarding."
            : "Your onboarding details have been submitted successfully."}
        </p>

        {!rejected && (
          <>
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Your account is currently under verification by the Training & Placement Cell.
            </div>

            <div className="mt-6 space-y-2 text-sm text-muted-foreground">
              <div>✓ Details Submitted</div>
              <div>⏳ Awaiting Verification</div>
              <div>🔒 Placement Participation Disabled</div>
            </div>
          </>
        )}

        {rejected && (
          <div className="mt-6 rounded-2xl border border-red-300 bg-red-50 p-6 text-left">
            <div className="mb-4">
              <div className="text-xs uppercase text-muted-foreground">Review Section</div>

              <div className="font-semibold">{sectionName}</div>
            </div>

            <div className="mb-4">
              <div className="text-xs uppercase text-muted-foreground">Reason</div>

              <div className="font-semibold">{draft?.rejection_reason || "-"}</div>
            </div>

            <div>
              <div className="text-xs uppercase text-muted-foreground">Reviewed On</div>

              <div className="font-semibold">
                {draft?.reviewed_at ? new Date(draft.reviewed_at).toLocaleString() : "-"}
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-center gap-4">
          {rejected && (
            <Button
  onClick={async () => {

    const nextStage =
      draft?.rejection_step === "QUESTIONNAIRE"
        ? "QUESTIONNAIRE"
        : "PROFILE";

    await (supabase as any)
      .from("student_onboarding_drafts")
      .update({
        onboarding_stage: nextStage,
      })
      .eq("email_address", (await authService.getSession())?.user?.email);

    navigate({
      to: "/onboarding",
    });

  }}
>
  Continue Editing
</Button>
          )}

          <Button
            variant="outline"
            onClick={async () => {
              await authService.signOut();

              navigate({
                to: "/login",
              });
            }}
          >
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}
