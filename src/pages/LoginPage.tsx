import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { authService } from "@/services/authService";
import { ensureUserProvisioned } from "@/services/provisionService";
import {
  canAccessPortal,
  getLandingRoute,
  isDeveloperEmail,
  normalizeEmail,
} from "@/services/identityPolicyService";
import { getPostLoginRoute } from "@/services/studentOnboardingService";

type Mode = "login" | "firstTime" | "forgot";
type LoginPhase = "email" | "otp";

export function LoginPage() {
  const { status, user } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>("login");
  const [phase, setPhase] = useState<LoginPhase>("email");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [firstTimeEmail, setFirstTimeEmail] = useState("");
  const [otp, setOtp] = useState("");

  const [forgotEmail, setForgotEmail] = useState("");

  useEffect(() => {
    let active = true;

    const routeAuthenticatedUser = async () => {
      if (status !== "authenticated" || !user?.id) {
        return;
      }

      try {
        if (isDeveloperEmail(user.email)) {
          if (active) {
            navigate({
              to: getLandingRoute(user.email),
              replace: true,
            });
          }
          return;
        }

        const route = await getPostLoginRoute(user.id, user.email);

        if (active) {
          navigate({ to: route, replace: true });
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Unable to continue");
        }
      }
    };

    routeAuthenticatedUser();

    return () => {
      active = false;
    };
  }, [status, user?.id, user?.email, navigate]);

  const handleLoginPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    const normalizedEmail = normalizeEmail(loginEmail);

    if (!canAccessPortal(normalizedEmail)) {
      setError("Use your official Indus University email.");
      return;
    }

    if (!loginPassword.trim()) {
      setError("Password is required.");
      return;
    }

    try {
      setSubmitting(true);

      const data = await authService.signInWithEmailPassword(normalizedEmail, loginPassword);

      if (!isDeveloperEmail(normalizedEmail)) {
        await ensureUserProvisioned();
      }

      const authUserId = data.session?.user?.id;

      if (authUserId) {
        const route = isDeveloperEmail(normalizedEmail)
          ? getLandingRoute(normalizedEmail)
          : await getPostLoginRoute(authUserId, normalizedEmail);

        navigate({ to: route, replace: true });
      } else {
        setMessage("Signed in successfully.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendOtp = async () => {
    setMessage(null);
    setError(null);

    const normalizedEmail = normalizeEmail(firstTimeEmail);

    if (!canAccessPortal(normalizedEmail)) {
      setError("Use your official Indus University email.");
      return;
    }

    try {
      setSubmitting(true);
      await authService.sendLoginOtp(normalizedEmail);
      setPhase("otp");
      setMessage("OTP sent to your email.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send OTP");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async () => {
    setMessage(null);
    setError(null);

    const normalizedEmail = normalizeEmail(firstTimeEmail);

    if (!otp.trim()) {
      setError("Enter the OTP.");
      return;
    }

    try {
      setSubmitting(true);

      const data = await authService.verifyLoginOtp(normalizedEmail, otp.trim());

      const authUserId = data.session?.user?.id;

      if (!authUserId) {
        setError("OTP verification failed.");
        setSubmitting(false);
        return;
      }

      if (!isDeveloperEmail(normalizedEmail)) {
        await ensureUserProvisioned();

        const route = await getPostLoginRoute(authUserId, normalizedEmail);
        navigate({ to: route, replace: true });
        return;
      }

      navigate({
        to: getLandingRoute(normalizedEmail),
        replace: true,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "OTP verification failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    const normalizedEmail = normalizeEmail(forgotEmail);

    if (!canAccessPortal(normalizedEmail)) {
      setError("Use your approved portal email.");
      return;
    }

    try {
      setSubmitting(true);
      await authService.sendPasswordResetEmail(normalizedEmail);
      setMessage("Password reset email sent. Check your inbox.");
      setMode("login");
      setLoginEmail(normalizedEmail);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Password reset failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background lg:grid lg:grid-cols-2">
      <section className="hidden lg:flex lg:flex-col lg:justify-between bg-gradient-to-br from-indigo-700 via-blue-700 to-slate-900 px-12 py-10 text-white">
        <div>
          <div className="text-4xl font-bold">Indus Placement Nexus</div>
          <p className="mt-6 max-w-xl text-lg leading-8 text-white/85">
            Secure placement portal for verified students, onboarding, analytics, NOC, and
            approvals.
          </p>

          <div className="mt-10 grid gap-3 text-sm text-white/80">
            <div>• Institutional email verification</div>
            <div>• Password login</div>
            <div>• First time OTP access</div>
            <div>• Onboarding before dashboard</div>
          </div>
        </div>

        <div className="text-sm text-white/60">© Indus Placement Nexus</div>
      </section>

      <section className="flex items-center justify-center px-4 py-8 sm:px-6 lg:px-10">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-foreground">Welcome Back!</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in, first time access, or reset password.
            </p>
          </div>

          <div className="mb-6 grid grid-cols-3 gap-2 rounded-xl border border-border p-1">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError(null);
                setMessage(null);
              }}
              className={`rounded-lg px-3 py-2 text-sm font-medium ${
                mode === "login" ? "bg-primary text-primary-foreground" : "text-foreground"
              }`}
            >
              Login
            </button>

            <button
              type="button"
              onClick={() => {
                setMode("firstTime");
                setError(null);
                setMessage(null);
              }}
              className={`rounded-lg px-3 py-2 text-sm font-medium ${
                mode === "firstTime" ? "bg-primary text-primary-foreground" : "text-foreground"
              }`}
            >
              First Time
            </button>

            <button
              type="button"
              onClick={() => {
                setMode("forgot");
                setError(null);
                setMessage(null);
              }}
              className={`rounded-lg px-3 py-2 text-sm font-medium ${
                mode === "forgot" ? "bg-primary text-primary-foreground" : "text-foreground"
              }`}
            >
              Forgot
            </button>
          </div>

          {message ? (
            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              {message}
            </div>
          ) : null}

          {error ? (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {mode === "login" ? (
            <form onSubmit={handleLoginPassword} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Email</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="name@indusuni.ac.in"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 outline-none focus:border-primary"
                  autoComplete="email"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Password</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 outline-none focus:border-primary"
                  autoComplete="current-password"
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Signing in..." : "Login Now"}
              </Button>
            </form>
          ) : null}

          {mode === "firstTime" ? (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Email</label>
                <input
                  type="email"
                  value={firstTimeEmail}
                  onChange={(e) => setFirstTimeEmail(e.target.value)}
                  placeholder="name@indusuni.ac.in"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 outline-none focus:border-primary"
                  autoComplete="email"
                  required
                />
              </div>

              {phase === "otp" ? (
                <div>
                  <label className="mb-1 block text-sm font-medium">OTP</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter OTP"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 outline-none focus:border-primary"
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    required
                  />
                </div>
              ) : null}

              <Button
                type="button"
                className="w-full"
                onClick={phase === "email" ? handleSendOtp : handleVerifyOtp}
                disabled={submitting}
              >
                {submitting ? "Please wait..." : phase === "email" ? "Send OTP" : "Verify OTP"}
              </Button>

              {phase === "otp" ? (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium"
                  disabled={submitting}
                >
                  Resend OTP
                </button>
              ) : null}
            </div>
          ) : null}

          {mode === "forgot" ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Email</label>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="name@indusuni.ac.in"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 outline-none focus:border-primary"
                  autoComplete="email"
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
          ) : null}
        </div>
      </section>
    </main>
  );
}
