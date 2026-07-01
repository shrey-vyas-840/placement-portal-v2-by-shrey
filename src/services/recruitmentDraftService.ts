import { supabase } from "@/lib/supabase";
import { normalizeEmail } from "@/services/identityPolicyService";

export type RecruitmentDraftStatus = "DRAFT" | "READY_FOR_PUBLISH" | "PUBLISHED" | "ARCHIVED";

export interface RecruitmentDraftRow {
  draft_id: string;

  auth_provider_id: string;

  created_by: string | null;

  draft_name: string | null;

  current_step: number;

  status: RecruitmentDraftStatus | string;

  company_data: Record<string, unknown> | null;

  recruiters_data: Record<string, unknown> | null;

  drive_data: Record<string, unknown> | null;

  eligibility_data: Record<string, unknown> | null;

  default_questions_data: Record<string, unknown> | null;

  roles_data: Record<string, unknown> | null;

  publish_data: Record<string, unknown> | null;

  wizard_state: Record<string, unknown> | null;

  is_completed: boolean;

  created_company_id: string | null;

  created_drive_id: string | null;

  published_drive_id: string | null;

  published_at: string | null;

  last_saved_at: string | null;

  created_at?: string;

  updated_at?: string;
}

export interface SaveRecruitmentDraftInput {
  authProviderId: string;

  createdBy?: string | null;

  draftName?: string | null;

  currentStep?: number;

  status?: RecruitmentDraftStatus | string;

  companyData?: unknown;

  recruitersData?: unknown;

  driveData?: unknown;

  eligibilityData?: unknown;

  defaultQuestionsData?: unknown;

  rolesData?: unknown;

  publishData?: unknown;

  wizardState?: unknown;

  isCompleted?: boolean;

  createdCompanyId?: string | null;

  createdDriveId?: string | null;

  publishedDriveId?: string | null;

  publishedAt?: string | null;
}

function normalizeDraftName(name?: string | null) {
  return (name ?? "").trim();
}

export async function getDraftByAuthProviderId(
  authProviderId: string,
): Promise<RecruitmentDraftRow | null> {
  const { data, error } = await (supabase as any)
    .from("recruitment_drafts")
    .select("*")
    .eq("auth_provider_id", authProviderId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as RecruitmentDraftRow | null) ?? null;
}

export async function ensureDraftForUser(
  authProviderId: string,
  emailAddress: string,
): Promise<RecruitmentDraftRow> {
  const existing = await getDraftByAuthProviderId(authProviderId);

  if (existing) {
    return existing;
  }

  const normalizedEmail = normalizeEmail(emailAddress);

  const { data, error } = await (supabase as any)
    .from("recruitment_drafts")
    .insert({
      auth_provider_id: authProviderId,

      draft_name: `${normalizedEmail} Recruitment`,

      current_step: 0,

      status: "DRAFT",

      company_data: null,

      recruiters_data: null,

      drive_data: null,

      eligibility_data: null,

      default_questions_data: null,

      roles_data: null,

      publish_data: null,

      wizard_state: null,

      is_completed: false,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as RecruitmentDraftRow;
}
export async function getDraftForUser(
  authProviderId: string,
  emailAddress: string,
): Promise<RecruitmentDraftRow> {
  const existing = await getDraftByAuthProviderId(authProviderId);

  if (existing) {
    return existing;
  }

  return ensureDraftForUser(authProviderId, emailAddress);
}

export async function saveDraft(input: SaveRecruitmentDraftInput): Promise<RecruitmentDraftRow> {
  const existing = await getDraftForUser(
    input.authProviderId,
    input.draftName ?? "Recruitment Draft",
  );

  const nextRow = {
    auth_provider_id: input.authProviderId,

    created_by: input.createdBy !== undefined ? input.createdBy : (existing.created_by ?? null),

    draft_name:
      input.draftName !== undefined
        ? normalizeDraftName(input.draftName)
        : (existing.draft_name ?? null),

    current_step: input.currentStep !== undefined ? input.currentStep : existing.current_step,

    status: input.status !== undefined ? input.status : existing.status,

    company_data: input.companyData !== undefined ? input.companyData : existing.company_data,

    recruiters_data:
      input.recruitersData !== undefined ? input.recruitersData : existing.recruiters_data,

    drive_data: input.driveData !== undefined ? input.driveData : existing.drive_data,

    eligibility_data:
      input.eligibilityData !== undefined ? input.eligibilityData : existing.eligibility_data,

    default_questions_data:
      input.defaultQuestionsData !== undefined
        ? input.defaultQuestionsData
        : existing.default_questions_data,

    roles_data: input.rolesData !== undefined ? input.rolesData : existing.roles_data,

    publish_data: input.publishData !== undefined ? input.publishData : existing.publish_data,

    wizard_state: input.wizardState !== undefined ? input.wizardState : existing.wizard_state,

    is_completed: input.isCompleted !== undefined ? input.isCompleted : existing.is_completed,

    created_company_id:
      input.createdCompanyId !== undefined ? input.createdCompanyId : existing.created_company_id,

    created_drive_id:
      input.createdDriveId !== undefined ? input.createdDriveId : existing.created_drive_id,

    published_drive_id:
      input.publishedDriveId !== undefined ? input.publishedDriveId : existing.published_drive_id,

    published_at: input.publishedAt !== undefined ? input.publishedAt : existing.published_at,

    last_saved_at: new Date().toISOString(),
  };

  const { data, error } = await (supabase as any)
    .from("recruitment_drafts")
    .upsert(nextRow, {
      onConflict: "auth_provider_id",
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as RecruitmentDraftRow;
}
export async function completeDraft(
  input: SaveRecruitmentDraftInput,
): Promise<RecruitmentDraftRow> {
  return saveDraft({
    ...input,
    status: "READY_FOR_PUBLISH",
    isCompleted: true,
  });
}

export async function getDraftById(draftId: string): Promise<RecruitmentDraftRow> {
  const { data, error } = await (supabase as any)
    .from("recruitment_drafts")
    .select("*")
    .eq("draft_id", draftId)
    .single();

  if (error) {
    throw error;
  }

  return data as RecruitmentDraftRow;
}

export async function getAllDrafts(): Promise<RecruitmentDraftRow[]> {
  const { data, error } = await (supabase as any)
    .from("recruitment_drafts")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as RecruitmentDraftRow[];
}

export async function getActiveDrafts(): Promise<RecruitmentDraftRow[]> {
  const { data, error } = await (supabase as any)
    .from("recruitment_drafts")
    .select("*")
    .neq("status", "ARCHIVED")
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as RecruitmentDraftRow[];
}

export async function getArchivedDrafts(): Promise<RecruitmentDraftRow[]> {
  const { data, error } = await (supabase as any)
    .from("recruitment_drafts")
    .select("*")
    .eq("status", "ARCHIVED")
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as RecruitmentDraftRow[];
}

export async function updateCurrentStep(authProviderId: string, currentStep: number) {
  return saveDraft({
    authProviderId,
    currentStep,
  });
}

export async function updateWizardState(authProviderId: string, wizardState: unknown) {
  return saveDraft({
    authProviderId,
    wizardState,
  });
}

export async function updateCompanyData(authProviderId: string, companyData: unknown) {
  return saveDraft({
    authProviderId,
    companyData,
  });
}

export async function updateRecruitersData(authProviderId: string, recruitersData: unknown) {
  return saveDraft({
    authProviderId,
    recruitersData,
  });
}

export async function updateDriveData(authProviderId: string, driveData: unknown) {
  return saveDraft({
    authProviderId,
    driveData,
  });
}

export async function updateEligibilityData(authProviderId: string, eligibilityData: unknown) {
  return saveDraft({
    authProviderId,
    eligibilityData,
  });
}
export async function updateDefaultQuestionsData(
  authProviderId: string,
  defaultQuestionsData: unknown,
) {
  return saveDraft({
    authProviderId,
    defaultQuestionsData,
  });
}

export async function updateRolesData(authProviderId: string, rolesData: unknown) {
  return saveDraft({
    authProviderId,
    rolesData,
  });
}

export async function updatePublishData(authProviderId: string, publishData: unknown) {
  return saveDraft({
    authProviderId,
    publishData,
  });
}

export async function markPublished(authProviderId: string, driveId: string, companyId?: string) {
  return saveDraft({
    authProviderId,
    status: "PUBLISHED",
    isCompleted: true,
    publishedAt: new Date().toISOString(),
    publishedDriveId: driveId,
    createdDriveId: driveId,
    createdCompanyId: companyId ?? null,
  });
}

export async function archiveDraft(authProviderId: string) {
  return saveDraft({
    authProviderId,
    status: "ARCHIVED",
  });
}

export async function deleteDraft(draftId: string): Promise<void> {
  const { error } = await (supabase as any)
    .from("recruitment_drafts")
    .delete()
    .eq("draft_id", draftId);

  if (error) {
    throw error;
  }
}

export async function draftExists(authProviderId: string): Promise<boolean> {
  const draft = await getDraftByAuthProviderId(authProviderId);
  return !!draft;
}

export async function getLatestDraft(): Promise<RecruitmentDraftRow | null> {
  const { data, error } = await (supabase as any)
    .from("recruitment_drafts")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as RecruitmentDraftRow | null) ?? null;
}
