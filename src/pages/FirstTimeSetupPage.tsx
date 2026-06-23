import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { authService } from "@/services/authService";
import { studentService } from "@/services/studentService";
import { type StudentMasterRegistryRow } from "@/services/studentRegistryService";
import { isDeveloperEmail } from "@/services/identityPolicyService";
import { isStudentFieldLocked } from "@/config/studentFieldLocks";
import { supabase } from "@/integrations/supabase/client";
import {
  completeDraft,
  ensureDraftForUser,
  getDraftByAuthProviderId,
  saveDraft,
  type StudentOnboardingDraftRow,
} from "@/services/studentOnboardingDraftService";
import { getRegistryStudentByEmail } from "@/services/studentRegistryService";

const STRONG_PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{7,}$/;

function isStrongPassword(value: string): boolean {
  return STRONG_PASSWORD_REGEX.test(value);
}
type Step = 1 | 2 | 3 | 4 | 5;
type CareerGoal = "Internship" | "Placements" | "Internship + PPO";

type EditableProfile = {
  first_name: string;
  middle_name: string;
  last_name: string;
  institute_email: string;
  personal_email: string;
  contact_number: string;
  alternate_contact_number: string;
  gender: "" | "Male" | "Female" | "Other";
  date_of_birth: string;

  graduation_year: string;

  placement_preference: "Interested" | "Not Interested" | "Higher Studies" | "Entrepreneurship";
};

const EMPTY_PROFILE: EditableProfile = {
  first_name: "",
  middle_name: "",
  last_name: "",
  institute_email: "",
  personal_email: "",
  contact_number: "",
  alternate_contact_number: "",
  gender: "",
  date_of_birth: "",

  graduation_year: "",

  placement_preference: "Interested",
};

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeEnrollment(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

function mapPlacementPreference(value?: string | null): EditableProfile["placement_preference"] {
  const raw = text(value).toLowerCase();

  if (raw.includes("higher") || raw.includes("master")) {
    return "Higher Studies";
  }

  if (raw.includes("entrepreneur") || raw.includes("startup")) {
    return "Entrepreneurship";
  }

  if (raw.includes("not")) {
    return "Not Interested";
  }

  return "Interested";
}

function registryToProfile(
  registry: StudentMasterRegistryRow | null,
  email: string,
): EditableProfile {
  if (!registry) {
    return {
      ...EMPTY_PROFILE,
      institute_email: email,
    };
  }

  return {
    first_name: text(registry.first_name),
    middle_name: "",
    last_name: text(registry.last_name),
    institute_email: text(registry.institute_email_id) || text(registry.email_address) || email,
    personal_email: text(registry.personal_email_id),
    contact_number: text(registry.contact_number),
    alternate_contact_number: "",
    gender: (text(registry.gender) as EditableProfile["gender"]) || "",
    date_of_birth: text(registry.date_of_birth),
    graduation_year: "",

    placement_preference: mapPlacementPreference(registry.placement_preference_text),
  };
}

function draftProfileToProfile(
  draftProfile: unknown,
  email: string,
  registry?: StudentMasterRegistryRow | null,
): EditableProfile {
  const draft = (draftProfile ?? {}) as Record<string, unknown>;

  if (!draftProfile) {
    return registryToProfile(registry ?? null, email);
  }

  return {
    first_name: text(draft.first_name) || text(registry?.first_name),
    middle_name: text(draft.middle_name),
    last_name: text(draft.last_name) || text(registry?.last_name),
    institute_email:
      text(draft.institute_email) ||
      text(registry?.institute_email_id) ||
      text(registry?.email_address) ||
      email,
    personal_email: text(draft.personal_email) || text(registry?.personal_email_id),
    contact_number: text(draft.contact_number) || text(registry?.contact_number),
    alternate_contact_number: text(draft.alternate_contact_number),
    gender: (text(draft.gender) as EditableProfile["gender"]) || "",
    date_of_birth: text(draft.date_of_birth) || text(registry?.date_of_birth),

    graduation_year: text(draft.graduation_year),

    placement_preference: mapPlacementPreference(
      text(draft.placement_preference) || registry?.placement_preference_text,
    ),
  };
}

function stageToStep(stage?: string | null): Step {
  switch (stage) {
    case "PASSWORD_SET":
      return 2;

    case "PROFILE_READY":
      return 3;

    case "QUESTIONNAIRE_IN_PROGRESS":
      return 3;

    case "QUESTIONNAIRE_DONE":
      return 4;

    case "POLICY_ACCEPTED":
      return 5;

    case "SUBMITTED":
      return 5;

    default:
      return 1;
  }
}

function buildOptOutGmailUrl(params: {
  studentName: string;
  enrollmentNo: string;
  reason: string;
}) {
  const subject = `Placement Opt-Out Request - ${params.studentName} - ${params.enrollmentNo}`;

  return (
    `https://mail.google.com/mail/?view=cm&fs=1` +
    `&to=${encodeURIComponent("deputy.tnp@indusuni.ac.in")}` +
    `&cc=${encodeURIComponent("placement@indusuni.ac.in")}` +
    `&su=${encodeURIComponent(subject)}` +
    `&body=${encodeURIComponent(params.reason)}`
  );
}

export function FirstTimeSetupPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<Step>(1);
  useEffect(() => {
    console.log("STEP STATE CHANGED", step);
  }, [step]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState<StudentOnboardingDraftRow | null>(null);
  const [registrySnapshot, setRegistrySnapshot] = useState<StudentMasterRegistryRow | null>(null);
  const [registryFound, setRegistryFound] = useState(false);

  const [enteredEnrollment, setEnteredEnrollment] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [profile, setProfile] = useState<EditableProfile>(EMPTY_PROFILE);

  const [careerGoal, setCareerGoal] = useState<CareerGoal>("Internship");
  const [competitiveExam, setCompetitiveExam] = useState(false);
  const [startupPlan, setStartupPlan] = useState(false);
  const [higherStudies, setHigherStudies] = useState(false);
  const [abroadPlan, setAbroadPlan] = useState(false);
  const [lorAnswered, setLorAnswered] = useState(false);
  const [lorRequired, setLorRequired] = useState(false);
  const [optOutEmailRequested, setOptOutEmailRequested] = useState(false);
  const [policyAccepted, setPolicyAccepted] = useState(false);

  const autoGeneratedOptOutReason = useMemo(() => {
    const studentName =
      `${profile.first_name} ${profile.middle_name} ${profile.last_name}`
        .replace(/\s+/g, " ")
        .trim() || "Student";

    const branch =
      registrySnapshot?.bachelors_degree_branch ||
      registrySnapshot?.masters_degree_branch ||
      "Not Available";

    const institute = registrySnapshot?.institute_name ?? "Indus University";

    const goals: string[] = [];

    if (abroadPlan) {
      goals.push("Higher Studies Abroad");
    } else if (higherStudies) {
      goals.push("Higher Studies");
    }

    if (startupPlan) {
      goals.push("Entrepreneurial Ventures");
    }

    return `
Respected Sir/Madam,

I hope you are doing well.

My name is ${studentName} and I am currently pursuing ${branch} at ${institute}.

I would like to formally request a change in my placement participation status.

Based on my future academic and career plans, I intend to pursue:

${goals.map((goal) => `• ${goal}`).join("\n")}

Therefore, I kindly request the Training & Placement Cell to review my profile and consider processing my placement opt-out request.
${
  lorRequired
    ? `
I may also require a Letter of Recommendation (LOR) from my department as part of my future academic application process.
`
    : ""
}
I understand the implications associated with opting out of placement activities and submit this request voluntarily.

I would be grateful if my request could be reviewed and processed at the earliest convenience.

Thank you for your time and consideration.

Sincerely,

${studentName}
Enrollment No. ${enteredEnrollment}
`;
  }, [
    profile,
    registrySnapshot,
    enteredEnrollment,
    higherStudies,
    abroadPlan,
    startupPlan,
    lorRequired,
  ]);

  const requiresOptOut = higherStudies || abroadPlan;

  useEffect(() => {
    if (!higherStudies && !abroadPlan) {
      setLorRequired(false);
      setLorAnswered(false);
      setOptOutEmailRequested(false);
    }
  }, [higherStudies, abroadPlan]);

  const registryPlacementPreference =
    registrySnapshot?.placement_preference_text
      ?.toLowerCase()
      .replace(/\s+/g, "")
      .replace(/-/g, "") ?? "";

  const isRegistryStudent = Boolean(registrySnapshot);

  const placementPreferenceLocked =
    isRegistryStudent &&
    registryPlacementPreference !== "" &&
    registryPlacementPreference !== "optin" &&
    registryPlacementPreference !== "interested";

  const showPlacementPreferenceWarning = placementPreferenceLocked;

  const questionnairePayload = useMemo(
    () => ({
      careerGoal,
      competitiveExam,
      startupPlan,
      higherStudies,
      abroadPlan,
      lorAnswered,
      lorRequired,
      optOutEmailRequested,
      optOutRequired: requiresOptOut,
      optOutReason: requiresOptOut ? autoGeneratedOptOutReason : null,
    }),
    [
      careerGoal,
      competitiveExam,
      startupPlan,
      higherStudies,
      abroadPlan,
      lorAnswered,
      lorRequired,
      optOutEmailRequested,
      requiresOptOut,
      autoGeneratedOptOutReason,
    ],
  );

  useEffect(() => {
    if (!user) {
      navigate({ to: "/login", replace: true });
      return;
    }

    if (isDeveloperEmail(user.email)) {
      navigate({ to: "/workspace/catalog", replace: true });
      return;
    }

    let cancelled = false;

    window.history.pushState(null, "", window.location.href);

    const handleBack = () => {
      window.history.pushState(null, "", window.location.href);
    };

    window.addEventListener("popstate", handleBack);

    const load = async () => {
      try {
        const existingProfile = await studentService.getProfileByUserId(user.id);

        if (existingProfile) {
          navigate({
            to: "/onboarding-submitted",
            replace: true,
          });
          return;
        }

        let existingDraft = await getDraftByAuthProviderId(user.id);

        if (!existingDraft) {
          existingDraft = await ensureDraftForUser(user.id, user.email ?? "");
        }

        if (cancelled) return;

        setDraft(existingDraft);
        setEnteredEnrollment(existingDraft.enrollment_no ?? "");
        setRegistryFound(Boolean(existingDraft.registry_found));
        setRegistrySnapshot(
          (existingDraft.registry_snapshot as StudentMasterRegistryRow | null) ?? null,
        );

        const initialProfile = draftProfileToProfile(
          existingDraft.edited_profile,
          user.email ?? "",
          (existingDraft.registry_snapshot as StudentMasterRegistryRow | null) ?? null,
        );

        setProfile(initialProfile);

        const questionnaire = (existingDraft.questionnaire_answers as any) ?? {};

        setCareerGoal(questionnaire.careerGoal ?? "Internship");
        setCompetitiveExam(Boolean(questionnaire.competitiveExam));
        setStartupPlan(Boolean(questionnaire.startupPlan));
        setHigherStudies(Boolean(questionnaire.higherStudies));
        setAbroadPlan(Boolean(questionnaire.abroadPlan));
        if (questionnaire.lorRequired !== undefined) {
          setLorAnswered(true);
          setLorRequired(Boolean(questionnaire.lorRequired));
        } else {
          setLorAnswered(false);
          setLorRequired(false);
        }
        setOptOutEmailRequested(Boolean(questionnaire.optOutEmailRequested));
        setPolicyAccepted(Boolean(existingDraft.policy_accepted));
        console.log("RESTORED DRAFT", existingDraft.onboarding_stage, existingDraft);
        const restoredStep = stageToStep(existingDraft.onboarding_stage);

        console.log("RESTORE DEBUG", {
          onboardingStage: existingDraft.onboarding_stage,
          mappedStep: stageToStep(existingDraft.onboarding_stage),
          finalStep: restoredStep,
        });

        setStep(restoredStep);

        setTimeout(() => {
          console.log("STEP AFTER SETSTATE", restoredStep);
        }, 0);

        setLoading(false);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Failed to load onboarding data");
        setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
      window.removeEventListener("popstate", handleBack);
    };
  }, [user, navigate]);

  const persistDraft = async (
    patch: Partial<{
      onboardingStage: string;
      enrollmentNo: string | null;
      passwordCreated: boolean;
      registryFound: boolean;
      registrySnapshot: unknown;
      editedProfile: unknown;
      questionnaireAnswers: unknown;
      policyAccepted: boolean;
      finalConfirmation: boolean;
      onboardingCompleted: boolean;
    }>,
  ) => {
    if (!user) return null;

    const next = await saveDraft({
      authProviderId: user.id,
      emailAddress: user.email ?? "",
      onboardingStage: patch.onboardingStage,
      enrollmentNo: patch.enrollmentNo,
      passwordCreated: patch.passwordCreated,
      registryFound: patch.registryFound,
      registrySnapshot: patch.registrySnapshot,
      editedProfile: patch.editedProfile,
      questionnaireAnswers: patch.questionnaireAnswers,
      policyAccepted: patch.policyAccepted,
      finalConfirmation: patch.finalConfirmation,
      onboardingCompleted: patch.onboardingCompleted,
    });

    setDraft(next);
    return next;
  };

  const refreshDraft = async () => {
    if (!user) return null;

    const latestDraft = await getDraftByAuthProviderId(user.id);
    setDraft(latestDraft);
    return latestDraft;
  };

  const handlePasswordContinue = async () => {
    console.log("HANDLE PASSWORD CONTINUE FIRED");
    setError(null);
    setMessage(null);

    if (!user) {
      setError("No active session found.");
      return;
    }

    if (!enteredEnrollment.trim()) {
      setError("Enrollment number is required.");
      return;
    }

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
      console.log("PASSWORD UPDATED");
      console.log("USER EMAIL", user?.email);

      const normalizedEnrollment = normalizeEnrollment(enteredEnrollment);

      console.log("AUTH EMAIL", user.email);

      console.log("ABOUT TO CALL REGISTRY");

      const registry = await getRegistryStudentByEmail(user.email ?? "");

      console.log("REGISTRY RESPONSE", registry);
      console.log("REGISTRY RESULT", registry);

      if (registry && normalizeEnrollment(registry.enrollment_no) !== normalizedEnrollment) {
        setError("Enrollment number does not match registry record.");
        setSaving(false);
        return;
      }
      console.log("ENTERED ENROLLMENT", enteredEnrollment);
      if (registry) {
        const normalizedInput = normalizeEnrollment(enteredEnrollment);
        const normalizedRegistry = normalizeEnrollment(registry.enrollment_no);

        if (normalizedInput !== normalizedRegistry) {
          setError("Enrollment number does not match registry record.");
          setSaving(false);
          return;
        }

        setRegistryFound(true);
        setRegistrySnapshot(registry);
        setProfile(registryToProfile(registry, user.email ?? ""));
      } else {
        setRegistryFound(false);
        setRegistrySnapshot(null);
        setProfile((current) => ({
          ...current,
          institute_email: user.email ?? current.institute_email,
        }));
      }

      await persistDraft({
        onboardingStage: "PASSWORD_SET",
        enrollmentNo: normalizeEnrollment(enteredEnrollment),
        passwordCreated: true,
        registryFound: Boolean(registry),
        registrySnapshot: registry,
        editedProfile: {
          ...profile,
          institute_email: user.email ?? profile.institute_email,
        },
      });

      setProfile(
        registry
          ? registryToProfile(registry, user.email ?? "")
          : {
              ...profile,
              institute_email: user.email ?? profile.institute_email,
            },
      );

      setRegistrySnapshot(registry);
      setRegistryFound(Boolean(registry));

      setMessage("Password saved. Continuing to verification.");

      await refreshDraft();

      setStep(2);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to continue";

      if (
        message.toLowerCase().includes("reauthentication") ||
        message.toLowerCase().includes("re-authentication")
      ) {
        setError("Your session has expired. Please click Logout and sign in again.");

        return;
      }

      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleQuestionnaireContinue = async () => {
    setError(null);
    setMessage(null);

    if (!user) {
      setError("No active session found.");
      return;
    }

    try {
      setSaving(true);

      await persistDraft({
        onboardingStage: "QUESTIONNAIRE_DONE",
        enrollmentNo: normalizeEnrollment(enteredEnrollment),
        registryFound,
        registrySnapshot,
        editedProfile: profile,
        questionnaireAnswers: questionnairePayload,
        policyAccepted,
      });

      setMessage("Details saved.");
      setStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save answers");
    } finally {
      setSaving(false);
    }
  };

  const validateProfileStep = () => {
    const errors: Record<string, string> = {};

    if (!profile.first_name.trim()) {
      errors.first_name = "First name is required.";
    }

    if (!profile.middle_name.trim()) {
      errors.middle_name = "Middle name is required.";
    } else if (!/^[A-Z]$/.test(profile.middle_name.trim())) {
      errors.middle_name = "Middle name must contain exactly one capital letter.";
    }

    if (!profile.last_name.trim()) {
      errors.last_name = "Last name is required.";
    }

    if (!profile.gender) {
      errors.gender = "Please select gender.";
    }

    if (!/^\d{10}$/.test(profile.contact_number)) {
      errors.contact_number = "Contact number must contain exactly 10 digits.";
    }

    if (!/^\d{10}$/.test(profile.alternate_contact_number)) {
      errors.alternate_contact_number = "Alternate contact number must contain exactly 10 digits.";
    }

    if (!profile.personal_email.trim()) {
      errors.personal_email = "Personal email is required.";
    }

    const graduationYear = Number(profile.graduation_year);

    if (!profile.graduation_year.trim()) {
      errors.graduation_year = "Graduation year is required.";
    } else if (Number.isNaN(graduationYear) || graduationYear < 2024 || graduationYear > 2028) {
      errors.graduation_year = "Graduation year must be between 2024 and 2028.";
    }

    setProfileErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const goBack = () => {
    if (step > 1) {
      setStep((current) => (current - 1) as Step);
    }
  };

  const handleProfileContinue = async () => {
    if (!validateProfileStep()) {
      return;
    }
    await persistDraft({
      onboardingStage: "PROFILE_READY",
      enrollmentNo: normalizeEnrollment(enteredEnrollment),
      registryFound,
      registrySnapshot,
      editedProfile: profile,
    });

    setStep(3);
  };

  const openPlacementPolicy = async () => {
    try {
      const { data, error } = await supabase.storage
        .from("system-documents")
        .createSignedUrl("Placement Policy_AY 2026-27.pdf", 300);

      if (error) throw error;

      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("POLICY PDF ERROR", err);

      setError(err instanceof Error ? err.message : "Unable to open placement policy");
    }
  };

  const handleFinalConfirm = async () => {
    setError(null);
    setMessage(null);

    if (!user) {
      setError("No active session found.");
      return;
    }

    if (!policyAccepted) {
      setError("You must accept the placement policy.");
      return;
    }

    if (!profile.first_name.trim() || !profile.last_name.trim() || !profile.contact_number.trim()) {
      setError("Please complete the required profile fields.");
      return;
    }

    if (
      !window.confirm("Confirm the details shown on this page?") ||
      !window.confirm("Are you sure you want to complete onboarding?")
    ) {
      return;
    }

    try {
      setSaving(true);
      await completeDraft({
        authProviderId: user.id,
        emailAddress: user.email ?? profile.institute_email,

        onboardingStage: "SUBMITTED",

        approvalStatus: registryFound ? "PENDING_PROFILE_VERIFICATION" : "PENDING_INITIAL_APPROVAL",

        enrollmentNo: normalizeEnrollment(enteredEnrollment),
        passwordCreated: true,
        registryFound,
        registrySnapshot,
        editedProfile: profile,
        questionnaireAnswers: questionnairePayload,
        policyAccepted: true,
        finalConfirmation: true,
        onboardingCompleted: false,
      });

      navigate({
        to: "/onboarding-submitted",
        replace: true,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to complete onboarding");
    } finally {
      setSaving(false);
    }
  };

  const profileSummaryRows = [
    ["Enrollment", enteredEnrollment || "-"],
    ["Institute Email", profile.institute_email || "-"],
    ["First Name", profile.first_name || "-"],
    ["Middle Name", profile.middle_name || "-"],
    ["Last Name", profile.last_name || "-"],
    ["Personal Email", profile.personal_email || "-"],
    ["Contact Number", profile.contact_number || "-"],
    ["Alternate Contact", profile.alternate_contact_number || "-"],
    ["Gender", profile.gender || "-"],
    ["Date of Birth", profile.date_of_birth || "-"],
    ["Placement Preference", profile.placement_preference || "-"],
  ] as const;

  const registryRows = registrySnapshot
    ? [
        ["Enrollment", text(registrySnapshot.enrollment_no)],
        ["First Name", text(registrySnapshot.first_name)],
        ["Last Name", text(registrySnapshot.last_name)],
        ["Institute Email", text(registrySnapshot.institute_email_id)],
        ["Personal Email", text(registrySnapshot.personal_email_id)],
        ["Contact Number", text(registrySnapshot.contact_number)],
        ["Degree", text(registrySnapshot.current_degree)],
        [
          "Branch",
          text(registrySnapshot.masters_degree_branch || registrySnapshot.bachelors_degree_branch),
        ],
        ["Placement Preference", text(registrySnapshot.placement_preference_text)],
      ]
    : [];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                First Time Setup
              </div>
              <h1 className="mt-2 text-2xl font-bold">Verify Details, Set Password, Continue</h1>
              <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                Enrollment verification, registry fetch, profile review, questionnaire, and policy
                acceptance.
              </p>
            </div>
            <div>
              <Button
                variant="outline"
                onClick={async () => {
                  await authService.signOut();

                  navigate({
                    to: "/login",
                    replace: true,
                  });
                }}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {message ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            {message}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="mb-6 space-y-4">
                <div>
                  <h2 className="text-lg font-semibold">Step {step} of 5</h2>

                  <p className="text-sm text-muted-foreground">
                    Complete the current step to continue.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-300"
                      style={{
                        width: `${(step / 5) * 100}%`,
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-5 gap-2 text-center text-xs">
                    {["Password", "Profile", "Questionnaire", "Policy", "Confirmation"].map(
                      (label, index) => (
                        <div
                          key={label}
                          className={
                            step >= index + 1
                              ? "font-semibold text-primary"
                              : "text-muted-foreground"
                          }
                        >
                          {label}
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </div>

              {step === 1 ? (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium">Email</label>
                      <input
                        value={user?.email ?? ""}
                        disabled
                        className="w-full rounded-xl border border-border bg-muted px-3 py-2 outline-none disabled:cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium">Enrollment Number</label>
                      <input
                        value={enteredEnrollment}
                        onChange={(e) => setEnteredEnrollment(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 outline-none focus:border-primary"
                        autoComplete="off"
                        required
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium">New Password</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 outline-none focus:border-primary"
                        placeholder="7+ chars, 1 uppercase, 1 number, 1 special"
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
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handlePasswordContinue} disabled={saving}>
                      {saving ? "Saving..." : "Verify & Continue"}
                    </Button>
                  </div>
                </div>
              ) : null}

              {step === 2 ? (
                <div className="space-y-6">
                  <div className="rounded-2xl border border-border bg-background p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold">Registry Snapshot</h3>
                        <p className="text-sm text-muted-foreground">
                          {registryFound
                            ? "Your record was found in the university registry. Review the details and update allowed fields if required."
                            : "No registry record was found. Please provide your basic details to continue."}
                        </p>
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-border">
                      <table className="w-full text-sm">
                        <tbody>
                          {registryRows.length > 0 ? (
                            registryRows.map(([label, value]) => (
                              <tr key={label} className="border-b border-border last:border-b-0">
                                <td className="w-1/2 px-3 py-2 font-medium">{label}</td>
                                <td className="px-3 py-2 text-muted-foreground">{value || "-"}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td className="px-3 py-3 text-muted-foreground">
                                Fresh application mode. Fill your details below.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border bg-background p-4">
                    <h3 className="mb-3 text-lg font-semibold">Profile Details</h3>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm font-medium">Enrollment Number</label>
                        <input
                          value={enteredEnrollment}
                          disabled={isStudentFieldLocked("enrollment_no")}
                          className="w-full rounded-xl border border-border bg-muted px-3 py-2 outline-none disabled:cursor-not-allowed"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium">Institute Email</label>
                        <input
                          value={user?.email ?? profile.institute_email}
                          disabled={isStudentFieldLocked("institute_email")}
                          className="w-full rounded-xl border border-border bg-muted px-3 py-2 outline-none disabled:cursor-not-allowed"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium">First Name</label>
                        <input
                          value={profile.first_name}
                          onChange={(e) =>
                            setProfile((current) => ({
                              ...current,
                              first_name: e.target.value,
                            }))
                          }
                          className="w-full rounded-xl border border-border bg-background px-3 py-2 outline-none focus:border-primary"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium">Middle Name</label>
                        <input
                          value={profile.middle_name}
                          onChange={(e) => {
                            const value = e.target.value
                              .replace(/[^a-zA-Z]/g, "")
                              .toUpperCase()
                              .slice(0, 1);

                            setProfile((current) => ({
                              ...current,
                              middle_name: value,
                            }));
                          }}
                          className="w-full rounded-xl border border-border bg-background px-3 py-2 outline-none focus:border-primary"
                        />
                        {profileErrors.middle_name ? (
                          <div className="mt-1 text-xs text-red-600">
                            {profileErrors.middle_name}
                          </div>
                        ) : null}
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium">Last Name</label>
                        <input
                          value={profile.last_name}
                          onChange={(e) =>
                            setProfile((current) => ({
                              ...current,
                              last_name: e.target.value,
                            }))
                          }
                          className="w-full rounded-xl border border-border bg-background px-3 py-2 outline-none focus:border-primary"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium">Personal Email</label>
                        <input
                          type="email"
                          value={profile.personal_email}
                          onChange={(e) =>
                            setProfile((current) => ({
                              ...current,
                              personal_email: e.target.value,
                            }))
                          }
                          className="w-full rounded-xl border border-border bg-background px-3 py-2 outline-none focus:border-primary"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium">Contact Number</label>
                        <input
                          value={profile.contact_number}
                          onChange={(e) =>
                            setProfile((current) => ({
                              ...current,
                              contact_number: e.target.value.replace(/\D/g, ""),
                            }))
                          }
                          className="w-full rounded-xl border border-border bg-background px-3 py-2 outline-none focus:border-primary"
                        />
                        {profileErrors.contact_number ? (
                          <div className="mt-1 text-xs text-red-600">
                            {profileErrors.contact_number}
                          </div>
                        ) : null}
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium">Alternate Contact</label>
                        <input
                          value={profile.alternate_contact_number}
                          onChange={(e) =>
                            setProfile((current) => ({
                              ...current,
                              alternate_contact_number: e.target.value.replace(/\D/g, ""),
                            }))
                          }
                          className="w-full rounded-xl border border-border bg-background px-3 py-2 outline-none focus:border-primary"
                        />
                        {profileErrors.alternate_contact_number ? (
                          <div className="mt-1 text-xs text-red-600">
                            {profileErrors.alternate_contact_number}
                          </div>
                        ) : null}
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium">Gender</label>
                        <select
                          value={profile.gender}
                          onChange={(e) =>
                            setProfile((current) => ({
                              ...current,
                              gender: e.target.value as EditableProfile["gender"],
                            }))
                          }
                          className="w-full rounded-xl border border-border bg-background px-3 py-2 outline-none focus:border-primary"
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                        {profileErrors.gender ? (
                          <div className="mt-1 text-xs text-red-600">{profileErrors.gender}</div>
                        ) : null}
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium">Date Of Birth</label>
                        <input
                          type="date"
                          value={profile.date_of_birth}
                          onChange={(e) =>
                            setProfile((current) => ({
                              ...current,
                              date_of_birth: e.target.value,
                            }))
                          }
                          className="w-full rounded-xl border border-border bg-background px-3 py-2 outline-none focus:border-primary"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium">Graduation Year</label>
                        <input
                          type="number"
                          min="2024"
                          max="2028"
                          value={profile.graduation_year}
                          onChange={(e) =>
                            setProfile((current) => ({
                              ...current,
                              graduation_year: e.target.value,
                            }))
                          }
                          className="w-full rounded-xl border border-border bg-background px-3 py-2 outline-none focus:border-primary"
                        />{" "}
                        {profileErrors.graduation_year ? (
                          <div className="mt-1 text-xs text-red-600">
                            {profileErrors.graduation_year}
                          </div>
                        ) : null}
                      </div>

                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-sm font-medium">
                          Placement Preference
                        </label>
                        <select
                          value={profile.placement_preference}
                          disabled={false}
                          onChange={(e) => {
                            console.log("DROPDOWN CHANGED TO", e.target.value);

                            setProfile((current) => ({
                              ...current,
                              placement_preference: e.target
                                .value as EditableProfile["placement_preference"],
                            }));
                          }}
                          className="w-full rounded-xl border border-border bg-background px-3 py-2 outline-none focus:border-primary disabled:cursor-not-allowed disabled:bg-muted"
                        >
                          {!showPlacementPreferenceWarning && (
                            <option value="Interested">Interested</option>
                          )}

                          <option value="Not Interested">Not Interested</option>
                          <option value="Higher Studies">Higher Studies</option>
                          <option value="Entrepreneurship">Entrepreneurship</option>
                        </select>
                        {showPlacementPreferenceWarning ? (
                          <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                            Your registry record currently indicates that you are not participating
                            in placement activities. You may continue with Higher Studies,
                            Entrepreneurship, or Not Interested. Selecting Interested directly is
                            not permitted and requires approval from the Training & Placement Cell.
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={goBack}>
                      Back
                    </Button>

                    <Button onClick={handleProfileContinue} disabled={saving}>
                      {saving ? "Saving..." : "Save & Continue"}
                    </Button>
                  </div>
                </div>
              ) : null}

              {step === 3 ? (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    {(["Internship", "Placements", "Internship + PPO"] as CareerGoal[]).map(
                      (option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setCareerGoal(option)}
                          className={`rounded-2xl border px-4 py-3 text-left text-sm font-medium ${
                            careerGoal === option
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-background"
                          }`}
                        >
                          {option}
                        </button>
                      ),
                    )}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {[
                      {
                        label: "Preparing for Competitive Exam",
                        value: competitiveExam,
                        setValue: setCompetitiveExam,
                      },
                      {
                        label: "Planning Startup",
                        value: startupPlan,
                        setValue: setStartupPlan,
                      },
                      {
                        label: "Planning Masters",
                        value: higherStudies,
                        setValue: setHigherStudies,
                      },
                      {
                        label: "Planning Abroad",
                        value: abroadPlan,
                        setValue: setAbroadPlan,
                      },
                      ...(higherStudies || abroadPlan
                        ? [
                            {
                              label: "Letter of Recommendation Required",
                              value: lorRequired,
                              setValue: setLorRequired,
                            },
                          ]
                        : []),
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="rounded-2xl border border-border bg-background p-4"
                      >
                        <div className="text-sm font-medium">{item.label}</div>

                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            onClick={async () => {
                              console.log(item.label, "YES CLICKED");
                              item.setValue(true);

                              if (item.label === "Letter of Recommendation Required") {
                                setLorAnswered(true);
                              }

                              await persistDraft({
                                onboardingStage: "QUESTIONNAIRE_IN_PROGRESS",
                                questionnaireAnswers: {
                                  careerGoal,
                                  competitiveExam,
                                  startupPlan,
                                  higherStudies:
                                    item.label === "Planning Masters" ? true : higherStudies,
                                  abroadPlan: item.label === "Planning Abroad" ? true : abroadPlan,
                                  lorAnswered,
                                  lorRequired,
                                  optOutEmailRequested,
                                },
                              });
                            }}
                            className={`rounded-xl px-4 py-2 text-sm font-medium ${
                              item.value
                                ? "bg-primary text-primary-foreground"
                                : "border border-border bg-background"
                            }`}
                          >
                            Yes
                          </button>

                          <button
                            type="button"
                            onClick={async () => {
                              console.log(item.label, "NO CLICKED");
                              item.setValue(false);

                              if (item.label === "Letter of Recommendation Required") {
                                setLorAnswered(true);
                              }

                              await persistDraft({
                                onboardingStage: "QUESTIONNAIRE_IN_PROGRESS",
                                questionnaireAnswers: {
                                  careerGoal,
                                  competitiveExam,
                                  startupPlan,
                                  higherStudies:
                                    item.label === "Planning Masters" ? false : higherStudies,
                                  abroadPlan: item.label === "Planning Abroad" ? false : abroadPlan,
                                  lorAnswered,
                                  lorRequired,
                                  optOutEmailRequested,
                                },
                              });
                            }}
                            className={`rounded-xl px-4 py-2 text-sm font-medium ${
                              !item.value
                                ? "bg-primary text-primary-foreground"
                                : "border border-border bg-background"
                            }`}
                          >
                            No
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {requiresOptOut ? (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
                      <div className="font-semibold">Placement Status Change Required</div>

                      <div className="mt-1 text-sm">
                        Based on your questionnaire responses, a placement opt-out request must be
                        submitted for approval before your profile can proceed further.
                      </div>

                      <div className="mt-4 rounded-xl border border-amber-300 bg-white p-4">
                        <div className="mb-2 text-sm font-semibold">Auto Generated Request</div>

                        <div className="whitespace-pre-wrap text-sm">
                          {autoGeneratedOptOutReason}
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={async () => {
                            const gmailUrl = buildOptOutGmailUrl({
                              studentName:
                                `${profile.first_name} ${profile.last_name}`.trim() || "Student",
                              enrollmentNo: enteredEnrollment,
                              reason: autoGeneratedOptOutReason,
                            });

                            window.open(gmailUrl, "_blank", "noopener,noreferrer");

                            await navigator.clipboard.writeText(autoGeneratedOptOutReason);

                            const confirmed = window.confirm(
                              "Gmail draft opened. If body is empty, paste the copied content. Have you successfully sent the email?",
                            );

                            setOptOutEmailRequested(confirmed);

                            await persistDraft({
                              onboardingStage: "QUESTIONNAIRE_IN_PROGRESS",
                              questionnaireAnswers: {
                                ...questionnairePayload,
                                optOutEmailRequested: confirmed,
                              },
                            });
                          }}
                        >
                          Open Gmail Draft
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={goBack}>
                      Back
                    </Button>

                    <Button
                      onClick={async () => {
                        await handleQuestionnaireContinue();
                        setStep(4);
                      }}
                      disabled={
                        saving || (requiresOptOut && (!lorAnswered || !optOutEmailRequested))
                      }
                    >
                      {saving ? "Saving..." : "Continue To Policy"}
                    </Button>
                  </div>
                </div>
              ) : null}

              {step === 4 ? (
                <div className="space-y-6">
                  <div className="rounded-2xl border border-border bg-background p-4">
                    <h3 className="mb-3 text-lg font-semibold">Placement Policy</h3>

                    <div className="space-y-4">
                      <Button type="button" variant="outline" onClick={openPlacementPolicy}>
                        Open Placement Policy
                      </Button>

                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={policyAccepted}
                          onChange={(e) => setPolicyAccepted(e.target.checked)}
                        />
                        I have read and agree to the placement policy.
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={goBack}>
                      Back
                    </Button>

                    <Button
                      disabled={!policyAccepted}
                      onClick={async () => {
                        await persistDraft({
                          onboardingStage: "POLICY_ACCEPTED",
                          enrollmentNo: normalizeEnrollment(enteredEnrollment),
                          registryFound,
                          registrySnapshot,
                          editedProfile: profile,
                          questionnaireAnswers: questionnairePayload,
                          policyAccepted: true,
                        });

                        setStep(5);
                      }}
                    >
                      Continue To Final Review
                    </Button>
                  </div>
                </div>
              ) : null}

              {step === 5 ? (
                <div className="space-y-6">
                  <div className="rounded-2xl border border-border bg-background p-4">
                    <h3 className="mb-3 text-lg font-semibold">Final Review</h3>

                    <div className="overflow-hidden rounded-xl border border-border">
                      <table className="w-full text-sm">
                        <tbody>
                          {profileSummaryRows.map(([label, value]) => (
                            <tr key={label} className="border-b border-border last:border-b-0">
                              <td className="w-1/2 px-3 py-2 font-medium">{label}</td>
                              <td className="px-3 py-2 text-muted-foreground">{value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={goBack}>
                      Back
                    </Button>

                    <Button onClick={handleFinalConfirm} disabled={saving}>
                      {saving ? "Submitting..." : "Submit For Verification"}
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <h3 className="text-lg font-semibold">Current Draft State</h3>

              <div className="mt-4 overflow-hidden rounded-xl border border-border">
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-b border-border">
                      <td className="w-1/2 px-3 py-2 font-medium">Registry</td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {registryFound ? "Found" : "Not Found"}
                      </td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="w-1/2 px-3 py-2 font-medium">Enrollment</td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {enteredEnrollment || "-"}
                      </td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="w-1/2 px-3 py-2 font-medium">Password</td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {draft?.password_created ? "Set" : "Not Set"}
                      </td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="w-1/2 px-3 py-2 font-medium">Questionnaire</td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {step >= 3 || draft?.questionnaire_answers ? "Filled" : "Pending"}
                      </td>
                    </tr>
                    <tr>
                      <td className="w-1/2 px-3 py-2 font-medium">Policy</td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {policyAccepted ? "Accepted" : "Pending"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
