import { supabase } from "@/lib/supabase";
import { studentService } from "@/services/studentService";

export interface OnboardingRow {
  student_id: string;
  onboarding_status?: string | null;
  policy_accepted?: boolean | null;
  completed_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  is_active?: boolean | null;
}

export async function getOnboardingByStudentId(studentId: string): Promise<OnboardingRow | null> {
  const { data, error } = await (supabase as any)
    .from("student_onboarding")
    .select("*")
    .eq("student_id", studentId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as OnboardingRow | null) ?? null;
}

export async function getPostLoginRoute(
  authProviderId: string,
  _email?: string | null,
): Promise<string> {
  const profile = await studentService.getProfileByUserId(authProviderId);
  if (profile) {
    return "/";
  }

  const { getDraftByAuthProviderId } = await import("@/services/studentOnboardingDraftService");
  const draft = await getDraftByAuthProviderId(authProviderId);

  if (!draft) {
    return "/onboarding";
  }

  if (draft.approval_status === "PROFILE_APPROVED" || draft.approval_status === "ACTIVE") {
    return "/";
  }

  return "/onboarding-submitted";
}

export function buildOptOutMailTo(options: {
  studentName: string;
  enrollmentNo: string;
  careerGoal: string;
  reason: string;
  hodEmail?: string | null;
}): string {
  const to = "deputy.tnp@indusuni.ac.in";
  const ccEmails = ["placement@indusuni.ac.in", options.hodEmail?.trim() || ""].filter(Boolean);

  const subject = `Opt-Out Request - ${options.studentName} - ${options.enrollmentNo}`;

  const body = [
    `Dear Sir/Madam,`,
    "",
    `I am requesting Opt-Out for the following student:`,
    `Name: ${options.studentName}`,
    `Enrollment: ${options.enrollmentNo}`,
    `Career Goal: ${options.careerGoal}`,
    `Reason: ${options.reason}`,
    "",
    `Regards,`,
    `${options.studentName}`,
  ].join("\n");

  const params = new URLSearchParams();
  params.set("subject", subject);
  params.set("body", body);

  if (ccEmails.length > 0) {
    params.set("cc", ccEmails.join(","));
  }

  return `mailto:${to}?${params.toString()}`;
}
