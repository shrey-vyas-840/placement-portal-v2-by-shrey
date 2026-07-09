import { supabase } from "@/lib/supabase";


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
  draftId: string;
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

export async function ensureDraftForUser(authProviderId: string): Promise<RecruitmentDraftRow> {
  const existing = await getDraftByAuthProviderId(authProviderId);

  if (existing) {
    return existing;
  }
  const { data, error } = await (supabase as any)
    .from("recruitment_drafts")
    .insert({
      auth_provider_id: authProviderId,

      draft_name: "Untitled Recruitment",

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

export async function createDraft(
  authProviderId: string,
): Promise<RecruitmentDraftRow> {
  const { data, error } = await (supabase as any)
    .from("recruitment_drafts")
    .insert({
      auth_provider_id: authProviderId,
      draft_name: "Untitled Recruitment",
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
): Promise<RecruitmentDraftRow> {
  const existing = await getDraftByAuthProviderId(authProviderId);

  if (existing) {
    return existing;
  }

  return ensureDraftForUser(authProviderId);
}

export async function saveDraft(
  input: SaveRecruitmentDraftInput,
): Promise<RecruitmentDraftRow> {

  const updates = {
    created_by: input.createdBy,
    draft_name:
      input.draftName !== undefined
        ? normalizeDraftName(input.draftName)
        : undefined,
    current_step: input.currentStep,
    status: input.status,
    company_data: input.companyData,
    recruiters_data: input.recruitersData,
    drive_data: input.driveData,
    eligibility_data: input.eligibilityData,
    default_questions_data: input.defaultQuestionsData,
    roles_data: input.rolesData,
    publish_data: input.publishData,
    wizard_state: input.wizardState,
    is_completed: input.isCompleted,
    created_company_id: input.createdCompanyId,
    created_drive_id: input.createdDriveId,
    published_drive_id: input.publishedDriveId,
    published_at: input.publishedAt,
    last_saved_at: new Date().toISOString(),
  };

  const cleanedUpdates = Object.fromEntries(
    Object.entries(updates).filter(([, value]) => value !== undefined),
  );

  const { data, error } = await (supabase as any)
    .from("recruitment_drafts")
    .update(cleanedUpdates)
    .eq("draft_id", input.draftId)
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

export async function updateCurrentStep(
  draftId: string,
  authProviderId: string,
  currentStep: number,
) {
  return saveDraft({
      draftId,
  authProviderId,
    currentStep,
  });
}

export async function updateWizardState(
  draftId: string,
  authProviderId: string,
  wizardState: unknown,
) {
  return saveDraft({
      draftId,
  authProviderId,
    wizardState,
  });
}

export async function updateCompanyData(
  draftId: string,
  authProviderId: string,
  companyData: unknown,
) {
  return saveDraft({
  draftId,
  authProviderId,
    companyData,
  });
}

export async function updateRecruitersData(
  draftId: string,
  authProviderId: string,
  recruitersData: unknown,
) {
  return saveDraft({
  draftId,
  authProviderId,
    recruitersData,
  });
}

export async function updateDriveData(
  draftId: string,
  authProviderId: string,
  driveData: unknown,
) {
  return saveDraft({
  draftId,
  authProviderId,
    driveData,
  });
}

export async function updateEligibilityData(
  draftId: string,
  authProviderId: string,
  eligibilityData: unknown,
) {
  return saveDraft({
  draftId,
  authProviderId,
    eligibilityData,
  });
}
export async function updateDefaultQuestionsData(
  draftId: string,
  authProviderId: string,
  defaultQuestionsData: unknown,
) {
  return saveDraft({
  draftId,
  authProviderId,
    defaultQuestionsData,
  });
}

export async function updateRolesData(
  draftId: string,
  authProviderId: string,
  rolesData: unknown,
) {
  return saveDraft({
  draftId,
  authProviderId,
    rolesData,
  });
}

export async function updatePublishData(
  draftId: string,
  authProviderId: string,
  publishData: unknown,
) {
    return saveDraft({
      draftId,
      authProviderId,
    publishData,
  });
}

export async function markPublished(
  draftId: string,
  authProviderId: string,
  driveId: string,
  companyId?: string,
) {
  return saveDraft({
  draftId,
  authProviderId,
    status: "PUBLISHED",
    isCompleted: true,
    publishedAt: new Date().toISOString(),
    publishedDriveId: driveId,
    createdDriveId: driveId,
    createdCompanyId: companyId ?? null,
  });
}

export async function archiveDraft(
  draftId: string,
  authProviderId: string,
) {
  return saveDraft({
  draftId,
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
