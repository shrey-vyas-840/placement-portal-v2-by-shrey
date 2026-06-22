import { supabase } from "@/lib/supabase";
import { normalizeEmail } from "@/services/identityPolicyService";
import type { StudentMasterRegistryRow } from "@/services/studentRegistryService";

export type OnboardingStage =
  | "OTP_VERIFIED"
  | "PASSWORD_SET"
  | "PROFILE_READY"
  | "QUESTIONNAIRE_DONE"
  | "POLICY_ACCEPTED"
  | "COMPLETED";

export interface StudentOnboardingDraftRow {
  draft_id: string;
  auth_provider_id: string;
  email_address: string;
  onboarding_stage: OnboardingStage | string;
  enrollment_no: string | null;
  password_created: boolean;
  registry_found: boolean;
  registry_snapshot: Record<string, unknown> | null;
  edited_profile: Record<string, unknown> | null;
  questionnaire_answers: Record<string, unknown> | null;
  policy_accepted: boolean;
  final_confirmation: boolean;
  onboarding_completed: boolean;
  created_at?: string;
  updated_at?: string;
  approval_status: string | null;
  approval_reason: string | null;
  approved_by: string | null;
  approved_at: string | null;
}

export interface SaveStudentOnboardingDraftInput {
  authProviderId: string;
  emailAddress: string;
  onboardingStage?: OnboardingStage | string;
  enrollmentNo?: string | null;
  passwordCreated?: boolean;
  registryFound?: boolean;
  registrySnapshot?: unknown;
  editedProfile?: unknown;
  questionnaireAnswers?: unknown;
  policyAccepted?: boolean;
  finalConfirmation?: boolean;
  onboardingCompleted?: boolean;
  approvalStatus?: string | null;
  approvalReason?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
}

function normalizeDraftEmail(email: string): string {
  return normalizeEmail(email);
}

export async function getDraftByAuthProviderId(
  authProviderId: string,
): Promise<StudentOnboardingDraftRow | null> {
  const { data, error } = await (supabase as any)
    .from("student_onboarding_drafts")
    .select("*")
    .eq("auth_provider_id", authProviderId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as StudentOnboardingDraftRow | null) ?? null;
}

export async function ensureDraftForUser(
  authProviderId: string,
  emailAddress: string,
): Promise<StudentOnboardingDraftRow> {
  const normalizedEmail = normalizeDraftEmail(emailAddress);

  const existing = await getDraftByAuthProviderId(authProviderId);
  if (existing) {
    return existing;
  }

  const { data, error } = await (supabase as any)
    .from("student_onboarding_drafts")
    .insert({
      auth_provider_id: authProviderId,
      email_address: normalizedEmail,
      onboarding_stage: "OTP_VERIFIED",
      enrollment_no: null,
      password_created: false,
      registry_found: false,
      registry_snapshot: null,
      edited_profile: null,
      questionnaire_answers: null,
      policy_accepted: false,
      final_confirmation: false,
      onboarding_completed: false,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as StudentOnboardingDraftRow;
}

export async function saveDraft(
  input: SaveStudentOnboardingDraftInput,
): Promise<StudentOnboardingDraftRow> {
  const existing = await getDraftByAuthProviderId(input.authProviderId);

  const nextRow = {
    auth_provider_id: input.authProviderId,
    email_address: normalizeDraftEmail(input.emailAddress),
    onboarding_stage: input.onboardingStage ?? existing?.onboarding_stage ?? "OTP_VERIFIED",
    enrollment_no:
      input.enrollmentNo !== undefined ? input.enrollmentNo : (existing?.enrollment_no ?? null),
    password_created:
      input.passwordCreated !== undefined
        ? input.passwordCreated
        : (existing?.password_created ?? false),
    registry_found:
      input.registryFound !== undefined ? input.registryFound : (existing?.registry_found ?? false),
    registry_snapshot:
      input.registrySnapshot !== undefined
        ? input.registrySnapshot
        : (existing?.registry_snapshot ?? null),
    edited_profile:
      input.editedProfile !== undefined ? input.editedProfile : (existing?.edited_profile ?? null),
    questionnaire_answers:
      input.questionnaireAnswers !== undefined
        ? input.questionnaireAnswers
        : (existing?.questionnaire_answers ?? null),
    policy_accepted:
      input.policyAccepted !== undefined
        ? input.policyAccepted
        : (existing?.policy_accepted ?? false),
    final_confirmation:
      input.finalConfirmation !== undefined
        ? input.finalConfirmation
        : (existing?.final_confirmation ?? false),
    onboarding_completed:
      input.onboardingCompleted !== undefined
        ? input.onboardingCompleted
        : (existing?.onboarding_completed ?? false),
    approval_status: input.approvalStatus,
    approval_reason: input.approvalReason,
    approved_by: input.approvedBy,
    approved_at: input.approvedAt,
  };

  const { data, error } = await (supabase as any)
    .from("student_onboarding_drafts")
    .upsert(nextRow, { onConflict: "auth_provider_id" })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as StudentOnboardingDraftRow;
}

export async function completeDraft(
  input: SaveStudentOnboardingDraftInput,
): Promise<StudentOnboardingDraftRow> {
  return saveDraft({
    ...input,
    policyAccepted: true,
    finalConfirmation: true,
  });
};

