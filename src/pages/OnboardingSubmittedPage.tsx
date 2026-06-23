import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { authService } from "@/services/authService";

export function OnboardingSubmittedPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-2xl rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
        <h1 className="text-3xl font-bold">Verification Submitted</h1>

        <p className="mt-4 text-muted-foreground">
          Your onboarding details have been submitted successfully.
        </p>

        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Your account is currently under verification by the Training & Placement Cell.
        </div>

        <div className="mt-6 space-y-2 text-sm text-muted-foreground">
          <div>✓ Details Submitted</div>
          <div>⏳ Awaiting Verification</div>
          <div>🔒 Placement Participation Disabled</div>
        </div>

        <Button
          className="mt-8"
          onClick={async () => {
            try {
              await authService.signOut();

              navigate({
                to: "/login",
              });
            } catch (error) {
              console.error("LOGOUT ERROR", error);
            }
          }}
        >
          Logout & Return To Login
        </Button>
      </div>
    </div>
  );
}
