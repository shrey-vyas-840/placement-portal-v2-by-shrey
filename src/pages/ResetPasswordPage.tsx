import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { authService } from "@/services/authService";

const STRONG_PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{7,}$/;

function isStrongPassword(value: string): boolean {
  return STRONG_PASSWORD_REGEX.test(value);
}

export function ResetPasswordPage() {
  const { status, user } = useAuth();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h1 className="text-2xl font-semibold">Reset Password</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Open the password reset link from your email first.
          </p>

          <button
            type="button"
            onClick={() => navigate({ to: "/login", replace: true })}
            className="mt-6 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!isStrongPassword(newPassword)) {
      setError(
        "Password must be at least 7 characters and include 1 uppercase letter, 1 number, and 1 special character.",
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setSaving(true);
      await authService.updatePassword(newPassword);
      await authService.signOut();
      navigate({ to: "/login", replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Password update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Reset Password</h1>
        <p className="mt-2 text-sm text-muted-foreground">Set a new password for your account.</p>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 outline-none focus:border-primary"
              autoComplete="new-password"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onPaste={(e) => e.preventDefault()}
              onCopy={(e) => e.preventDefault()}
              onCut={(e) => e.preventDefault()}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 outline-none focus:border-primary"
              autoComplete="new-password"
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </div>
    </div>
  );
}
