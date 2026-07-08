import { supabase } from "@/lib/supabase";
import { adminDriveService } from "@/services/adminDriveService";
import { adminOpportunityService } from "@/services/adminOpportunityService";
import { adminQuestionService } from "@/services/adminQuestionService";

export interface PublishRecruitmentResult {
  driveId: string;
  companyId: string;
}

interface PublishValidationResult {
  valid: boolean;
  errors: string[];
}

function validateDraftForPublish(draft: any): PublishValidationResult {
  const errors: string[] = [];

  if (!draft.company_data) {
    errors.push("Company information is missing.");
  }

  if (!draft.drive_data) {
    errors.push("Drive information is missing.");
  }

  if (!draft.eligibility_data) {
    errors.push("Eligibility configuration is missing.");
  }

  if (!Array.isArray(draft.roles_data) || draft.roles_data.length === 0) {
    errors.push("At least one recruitment role is required.");
  }

  if (
    !Array.isArray(draft.default_questions_data) &&
    (!Array.isArray(draft.roles_data) ||
      draft.roles_data.every(
        (role: any) => !Array.isArray(role.questions) || role.questions.length === 0,
      ))
  ) {
    errors.push("No application questions were configured.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export async function publishRecruitmentDraft(draftId: string): Promise<PublishRecruitmentResult> {
  const { data: draft, error: draftError } = await (supabase as any)
    .from("recruitment_drafts")
    .select("*")
    .eq("draft_id", draftId)
    .single();

  if (draftError) {
    throw draftError;
  }

  if (!draft) {
    throw new Error("Recruitment draft not found.");
  }
  const validation = validateDraftForPublish(draft);

  const companyId =
    draft.created_company_id ??
    crypto.randomUUID();

  const driveId =
    draft.created_drive_id ??
    crypto.randomUUID();

  const roleIdMap = new Map<string, string>();
  const opportunityIdMap = new Map<string, string>();

  for (const role of draft.roles_data as any[]) {
    const roleId = crypto.randomUUID();
    const opportunityId = crypto.randomUUID();

    roleIdMap.set(role.role_id, roleId);
    opportunityIdMap.set(role.role_id, opportunityId);
  }

  // Phase 1 publish pipeline will be implemented here
  // using the existing admin services only.

  void adminDriveService;
  void adminOpportunityService;
  void adminQuestionService;

  return {
    driveId,
    companyId,
  };
}
