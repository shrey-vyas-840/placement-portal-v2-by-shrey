import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { authService } from "@/services/authService";
import { ensureUserProvisioned } from "@/services/provisionService";
import {
  canAccessPortal,
  getLandingRoute,
  isInstitutionalEmail,
  normalizeEmail,
} from "@/services/identityPolicyService";
import { verifyStudentRegistryEntry } from "@/services/studentRegistryService";

type Mode = "login" | "register" | "forgot";

const STRONG_PASSWORD_REGEX =
  /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{7,}$/;

function isStrongPassword(value: string): boolean {
  return STRONG_PASSWORD_REGEX.test(value);
}

export function LoginPage() {
  const { status, user } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>("login");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [registerEmail, setRegisterEmail] = useState("");
  const [registerEnrollment, setRegisterEnrollment] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");

  const [forgotEmail, setForgotEmail] = useState("");

  useEffect(() => {
    if (status === "authenticated" && !submitting) {
      navigate({ to: getLandingRoute(user?.email), replace: true });
    }
  }, [status, user?.email, submitting, navigate]);

  const loginEmailAllowed = useMemo(
    () => canAccessPortal(normalizeEmail(loginEmail)),
    [loginEmail],
  );

  const registerEmailAllowed = useMemo(
    () => isInstitutionalEmail(normalizeEmail(registerEmail)),
    [registerEmail],
  );

  const forgotEmailAllowed = useMemo(
    () => canAccessPortal(normalizeEmail(forgotEmail)),
    [forgotEmail],
  );

  const handleGoogleSignIn = async () => {
    setMessage(null);
    setError(null);
    setSubmitting(true);

    try {
      await authService.signInWithGoogle();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed");
      setSubmitting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
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

      await authService.signInWithEmailPassword(
        normalizedEmail,
        loginPassword,
      );

      await ensureUserProvisioned();

      navigate({
        to: getLandingRoute(normalizedEmail),
        replace: true,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    const normalizedEmail = normalizeEmail(registerEmail);
    const normalizedEnrollment = registerEnrollment
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "");

    if (!isInstitutionalEmail(normalizedEmail)) {
      setError("Institute email must end with indusuni.ac.in.");
      return;
    }

    if (!/^IU[0-9]{8,13}$/.test(normalizedEnrollment)) {
      setError("Enrollment number must start with IU followed by 8 to 13 digits.");
      return;
    }

    if (!isStrongPassword(registerPassword)) {
      setError(
        "Password must be at least 7 characters and include 1 uppercase letter, 1 number, and 1 special character.",
      );
      return;
    }

    if (registerPassword !== registerConfirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setSubmitting(true);

      const registryMatch = await verifyStudentRegistryEntry(
        normalizedEmail,
        normalizedEnrollment,
      );

      if (!registryMatch) {
        setError("No matching student was found in the registry.");
        setSubmitting(false);
        return;
      }

      const data = await authService.signUpWithEmailPassword(
        normalizedEmail,
        registerPassword,
      );

      if (data.session?.user?.email) {
        await ensureUserProvisioned();

        navigate({
          to: getLandingRoute(data.session.user.email),
          replace: true,
        });

        return;
      }

      setMessage(
        "Account created. Please check your email and confirm your account before logging in.",
      );
      setMode("login");
      setLoginEmail(normalizedEmail);
      setLoginPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Account creation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    const normalizedEmail = normalizeEmail(forgotEmail);

    if (!forgotEmailAllowed) {
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
            Secure placement portal for verified students, onboarding, analytics, NOC, and approvals.
          </p>

          <div className="mt-10 grid gap-3 text-sm text-white/80">
            <div>• Institutional email verification</div>
            <div>• Registry-backed first time access</div>
            <div>• Password login + reset support</div>
            <div>• Google sign-in still supported</div>
          </div>
        </div>

        <div className="text-sm text-white/60">
          © Indus Placement Nexus
        </div>
      </section>

      <section className="flex items-center justify-center px-4 py-8 sm:px-6 lg:px-10">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-foreground">
              Welcome Back!
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in, create account, or reset password.
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
                setMode("register");
                setError(null);
                setMessage(null);
              }}
              className={`rounded-lg px-3 py-2 text-sm font-medium ${
                mode === "register" ? "bg-primary text-primary-foreground" : "text-foreground"
              }`}
            >
              Create Account
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
            <form onSubmit={handleLogin} className="space-y-4">
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

              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium"
                disabled={submitting}
              >
                Continue with Google
              </button>
            </form>
          ) : null}

          {mode === "register" ? (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Institute Email</label>
                <input
                  type="email"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  placeholder="name@indusuni.ac.in"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 outline-none focus:border-primary"
                  autoComplete="email"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Enrollment Number</label>
                <input
                  type="text"
                  value={registerEnrollment}
                  onChange={(e) => setRegisterEnrollment(e.target.value)}
                  placeholder="IUxxxxxxxx"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 outline-none focus:border-primary"
                  autoComplete="off"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Password</label>
                <input
                  type="password"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  placeholder="Min 7 chars, 1 uppercase, 1 number, 1 special"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 outline-none focus:border-primary"
                  autoComplete="new-password"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Confirm Password</label>
                <input
                  type="password"
                  value={registerConfirmPassword}
                  onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                  onPaste={(e) => e.preventDefault()}
                  onCopy={(e) => e.preventDefault()}
                  onCut={(e) => e.preventDefault()}
                  placeholder="Re-enter password"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 outline-none focus:border-primary"
                  autoComplete="new-password"
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Creating account..." : "Create Account"}
              </Button>
            </form>
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