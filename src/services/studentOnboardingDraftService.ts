import { supabase } from "@/lib/supabase";
import { normalizeEmail } from "@/services/identityPolicyService";
import { provisionStudentFromApprovedDraft } from "@/services/studentProvisioningService";
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
  mail_confirmation_received?: boolean;
  mail_confirmation_at?: string | null;
  mail_type?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  rejection_reason?: string | null;
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

export async function getDraftForUser(
  authProviderId: string,
  emailAddress: string,
): Promise<StudentOnboardingDraftRow> {
  const normalizedEmail = normalizeDraftEmail(emailAddress);

  // 1. Lookup by auth provider
  const existing = await getDraftByAuthProviderId(authProviderId);

  if (existing) {
    return existing;
  }

  // 2. Lookup by email
  const { data: existingByEmail, error: emailLookupError } = await (supabase as any)
    .from("student_onboarding_drafts")
    .select("*")
    .eq("email_address", normalizedEmail)
    .maybeSingle();

  if (emailLookupError) {
    throw emailLookupError;
  }

  // 3. Repair auth_provider_id
  if (existingByEmail) {
    const { data: repairedDraft, error: repairError } = await (supabase as any)
      .from("student_onboarding_drafts")
      .update({
        auth_provider_id: authProviderId,
      })
      .eq("draft_id", existingByEmail.draft_id)
      .select("*")
      .single();

    if (repairError) {
      throw repairError;
    }

    return repairedDraft as StudentOnboardingDraftRow;
  }

  // 4. Create brand new draft
  return ensureDraftForUser(authProviderId, normalizedEmail);
}

export async function ensureDraftForUser(
  authProviderId: string,
  emailAddress: string,
): Promise<StudentOnboardingDraftRow> {
  const normalizedEmail = normalizeDraftEmail(emailAddress);

  // First: lookup by auth_provider_id
  const existing = await getDraftByAuthProviderId(authProviderId);

  if (existing) {
    return existing;
  }

  // Second: lookup by email
  const { data: existingByEmail, error: emailLookupError } = await (supabase as any)
    .from("student_onboarding_drafts")
    .select("*")
    .eq("email_address", normalizedEmail)
    .maybeSingle();

  if (emailLookupError) {
    throw emailLookupError;
  }

  if (existingByEmail) {
    const { data: repairedDraft, error: repairError } = await (supabase as any)
      .from("student_onboarding_drafts")
      .update({
        auth_provider_id: authProviderId,
      })
      .eq("draft_id", existingByEmail.draft_id)
      .select("*")
      .single();

    if (repairError) {
      throw repairError;
    }

    return repairedDraft as StudentOnboardingDraftRow;
  }

  // Third: create brand new draft
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
  const existing = await getDraftForUser(input.authProviderId, input.emailAddress);

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

    // Preserve admin review metadata unless an explicit admin write happens elsewhere.
    approval_status:
      input.approvalStatus !== undefined
        ? input.approvalStatus
        : (existing?.approval_status ?? null),
    approval_reason:
      input.approvalReason !== undefined
        ? input.approvalReason
        : (existing?.approval_reason ?? null),
    approved_by:
      input.approvedBy !== undefined ? input.approvedBy : (existing?.approved_by ?? null),
    approved_at:
      input.approvedAt !== undefined ? input.approvedAt : (existing?.approved_at ?? null),
    reviewed_by: existing?.reviewed_by ?? null,
    reviewed_at: existing?.reviewed_at ?? null,
    rejection_reason: existing?.rejection_reason ?? null,
    mail_confirmation_received: existing?.mail_confirmation_received ?? false,
    mail_confirmation_at: existing?.mail_confirmation_at ?? null,
    mail_type: existing?.mail_type ?? null,
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
}

export async function getPendingApprovalDrafts() {
  const { data, error } = await (supabase as any)
    .from("student_onboarding_drafts")
    .select("*")
    .or("approval_status.is.null,approval_status.eq.PENDING_PROFILE_VERIFICATION")
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as StudentOnboardingDraftRow[];
}

export async function getDraftByEnrollmentNo(enrollmentNo: string) {
  const { data, error } = await (supabase as any)
    .from("student_onboarding_drafts")
    .select("*")
    .eq("enrollment_no", enrollmentNo)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}
async function resolveDraftByIdentifier(identifier: string): Promise<StudentOnboardingDraftRow> {
  const byDraftId = await (supabase as any)
    .from("student_onboarding_drafts")
    .select("*")
    .eq("draft_id", identifier)
    .maybeSingle();

  if (byDraftId.error) {
    throw byDraftId.error;
  }

  if (byDraftId.data) {
    return byDraftId.data as StudentOnboardingDraftRow;
  }

  const byAuthProviderId = await (supabase as any)
    .from("student_onboarding_drafts")
    .select("*")
    .eq("auth_provider_id", identifier)
    .maybeSingle();

  if (byAuthProviderId.error) {
    throw byAuthProviderId.error;
  }

  if (!byAuthProviderId.data) {
    throw new Error("Onboarding draft not found.");
  }

  return byAuthProviderId.data as StudentOnboardingDraftRow;
}

export async function approveOnboardingDraft(identifier: string, adminUserId: string) {
  const draft = await resolveDraftByIdentifier(identifier);
  console.log("APPROVAL IDENTIFIER", identifier);
  console.log("RESOLVED DRAFT ID", draft.draft_id);
  console.log("RESOLVED AUTH ID", draft.auth_provider_id);
  console.log("RESOLVED STATUS", draft.approval_status);

  await provisionStudentFromApprovedDraft(draft);

  const now = new Date().toISOString();
  console.log("UPDATING DRAFT", draft.draft_id);
  const { data, error } = await (supabase as any)
    .from("student_onboarding_drafts")
    .update({
      approval_status: "PROFILE_APPROVED",
      onboarding_completed: true,
      approval_reason: null,
      rejection_reason: null,
      approved_by: adminUserId,
      approved_at: now,
      reviewed_by: adminUserId,
      reviewed_at: now,
    })
    .eq("draft_id", draft.draft_id)
    .select("draft_id, approval_status, approved_by")
    .maybeSingle();
  console.log("APPROVAL UPDATE RESULT", data);
  console.log("APPROVAL UPDATE ERROR", error);
  if (error) {
    throw error;
  }

  return data as StudentOnboardingDraftRow;
}

export async function rejectOnboardingDraft(
  identifier: string,
  adminUserId: string,
  reason: string,
) {
  const draft = await resolveDraftByIdentifier(identifier);
  const now = new Date().toISOString();

  const { data, error } = await (supabase as any)
    .from("student_onboarding_drafts")
    .update({
      approval_status: "PROFILE_REJECTED",
      onboarding_completed: false,
      approval_reason: reason,
      rejection_reason: reason,
      approved_by: null,
      approved_at: null,
      reviewed_by: adminUserId,
      reviewed_at: now,
    })
    .eq("draft_id", draft.draft_id)
    .select("*")
    .maybeSingle();
  console.log("REJECTION UPDATE RESULT", data);
  console.log("REJECTION UPDATE ERROR", error);
  if (error) {
    throw error;
  }

  return data as StudentOnboardingDraftRow;
}
export async function getDraftById(draftId: string) {
  const { data, error } = await (supabase as any)
    .from("student_onboarding_drafts")
    .select("*")
    .eq("draft_id", draftId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}
