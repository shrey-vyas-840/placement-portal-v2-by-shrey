import { supabase } from "@/lib/supabase";
import { adminDriveService } from "@/services/adminDriveService";
import { adminOpportunityService } from "@/services/adminOpportunityService";
import { adminQuestionService } from "@/services/adminQuestionService";

export interface PublishRecruitmentResult {
  driveId: string;
  companyId: string;
}

interface PublishRollbackContext {
  companyCreated: boolean;
  driveCreated: boolean;
  createdOpportunityIds: string[];
}

interface PublishValidationResult {
  valid: boolean;
  errors: string[];
}

async function rollbackPublish(
  context: PublishRollbackContext,
  companyId: string,
  driveId: string,
) {
  if (context.createdOpportunityIds.length > 0) {
    await (supabase as any)
      .from("opportunity_master")
      .delete()
      .in("opportunity_id", context.createdOpportunityIds);
  }

  if (context.driveCreated) {
    await (supabase as any).from("drive_master").delete().eq("drive_id", driveId);
  }

  if (context.companyCreated) {
    await (supabase as any).from("company_master").delete().eq("company_id", companyId);
  }
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

  const companyId = draft.created_company_id ?? crypto.randomUUID();

  const driveId = draft.created_drive_id ?? crypto.randomUUID();

  const companyAlreadyPublished =
    typeof draft.created_company_id === "string" && draft.created_company_id.trim() !== "";

  const driveAlreadyPublished =
    typeof draft.created_drive_id === "string" && draft.created_drive_id.trim() !== "";

  const isRepublish = companyAlreadyPublished || driveAlreadyPublished;

  const rollbackContext: PublishRollbackContext = {
    companyCreated: false,
    driveCreated: false,
    createdOpportunityIds: [],
  };
  /**
   * During publishing we generate deterministic production IDs.
   *
   * We intentionally do NOT persist a direct FK between
   * drive_roles and opportunity_master.
   *
   * Instead this map represents the publish session.
   *
   * draft role
   *        ↓
   * production drive_role_id
   *        ↓
   * production opportunity_id
   */
  const publishRoleMap = new Map<
    string,
    {
      driveRoleId: string;
      opportunityId: string;
    }
  >();

  for (const role of draft.roles_data as any[]) {
    publishRoleMap.set(role.role_id, {
      driveRoleId: crypto.randomUUID(),
      opportunityId: crypto.randomUUID(),
    });
  }

  // Phase 1 publish pipeline will be implemented here
  // using the existing admin services only.
  if (isRepublish) {
    throw new Error("Republish pipeline is not implemented yet.");
  }

  try {
    await adminDriveService.createCompanyForPublish({
      company_id: companyId,

      company_name: draft.company_data.company_name,

      company_website: draft.company_data.company_website,

      hiring_location: draft.company_data.hiring_location,

      industry_type: draft.company_data.industry_type,

      company_description: draft.company_data.company_description,

      company_size: draft.company_data.company_size,
    });

    void adminOpportunityService;
    void adminQuestionService;

    rollbackContext.companyCreated = true;

    await adminDriveService.createDriveForPublish({
      drive_id: driveId,

      company_id: companyId,

      drive_name: draft.drive_data.drive_name,

      drive_type: draft.drive_data.drive_type,

      drive_mode: draft.drive_data.drive_mode,

      registration_deadline: draft.drive_data.registration_deadline ?? null,

      lowest_package_lpa: draft.drive_data.lowest_package_lpa,

      highest_package_lpa: draft.drive_data.highest_package_lpa,

      bond_years: draft.drive_data.bond_years,

      total_hiring_requirement: draft.drive_data.total_hiring_requirement,

      remarks: draft.drive_data.remarks,

      role_selection_enabled: draft.publish_data?.role_selection_enabled ?? true,

      minimum_role_selection: draft.publish_data?.minimum_role_selection ?? 1,

      maximum_role_selection: draft.publish_data?.maximum_role_selection ?? 1,

      drive_status: draft.drive_data.drive_status ?? "Created",
    });

    await adminDriveService.publishRoles(
      driveId,
      (draft.roles_data as any[]).map((role) => {
        const publishedRole = publishRoleMap.get(role.role_id)!;

        return {
          drive_role_id: publishedRole.driveRoleId,
          drive_role_name: role.role_name,
          role_description: role.role_description,
          role_type: role.role_type,
          required_skills: Array.isArray(role.required_skills)
            ? role.required_skills.join(", ")
            : role.required_skills,
        };
      }),
    );

    const recruitmentOpportunityId = crypto.randomUUID();

    await adminOpportunityService.createPublishedOpportunity({
      opportunity_id: recruitmentOpportunityId,
      drive_id: driveId,
      opportunity_title: draft.drive_data.drive_name,
      opportunity_description: draft.drive_data.remarks ?? null,
      application_start_date: draft.publish_data?.application_start_date ?? null,
      application_end_date: draft.publish_data?.application_end_date ?? null,
      application_status: draft.publish_data?.publish_immediately ? "Open" : "Draft",
      visible_to_students: Boolean(draft.publish_data?.publish_immediately),
      created_by: draft.created_by ?? null,
    });

    rollbackContext.createdOpportunityIds.push(recruitmentOpportunityId);
    rollbackContext.driveCreated = true;

    if (Array.isArray(draft.recruiters_data) && draft.recruiters_data.length > 0) {
      for (const recruiter of draft.recruiters_data) {
        await (supabase as any).from("company_contacts").insert({
          company_id: companyId,

          contact_name: recruiter.name,

          designation: recruiter.designation ?? null,

          email: recruiter.email,

          phone_number: recruiter.phone ?? null,

          is_primary: Boolean(recruiter.isPrimary),

          created_by: draft.created_by ?? null,
        });
      }
    }

    await adminQuestionService.saveQuestions(
      recruitmentOpportunityId,
      draft.default_questions_data ?? [],
    );

    for (const role of draft.roles_data ?? []) {
      const publishedRole = publishRoleMap.get(role.role_id);

      if (!publishedRole) {
        throw new Error(`Missing published role mapping for ${role.role_name}`);
      }

      await (supabase as any).from("drive_roles").insert({
        drive_role_id: publishedRole.driveRoleId,

        drive_id: driveId,

        drive_role_name: role.role_name,

        role_description: role.role_description ?? null,

        role_type: role.role_type ?? null,

        required_skills: Array.isArray(role.required_skills)
          ? role.required_skills.join(", ")
          : (role.required_skills ?? null),
      });
    }

    await adminDriveService.saveEligibilityForPublish({
      drive_id: driveId,

      allowed_institutes: (draft.eligibility_data?.allowedInstitutes ?? []).join(","),

      allowed_branches: (draft.eligibility_data?.allowedBranches ?? []).join(","),

      allowed_degrees: (draft.eligibility_data?.allowedDegrees ?? []).join(","),

      passing_out_batches: (
        draft.eligibility_data?.passingOutBatches ??
        draft.eligibility_data?.graduationYears ??
        []
      ).join(","),

      minimum_cgpa: Number(draft.eligibility_data?.minimumCgpa ?? 0),

      maximum_active_backlogs: Number(draft.eligibility_data?.maximumActiveBacklogs ?? 0),

      willing_to_relocate_required: Boolean(draft.eligibility_data?.willingToRelocateRequired),

      additional_requirements: draft.eligibility_data?.additionalRequirements ?? "",
    });

    await (supabase as any)
      .from("recruitment_drafts")
      .update({
        status: "PUBLISHED",

        is_completed: true,

        published_at: new Date().toISOString(),

        published_drive_id: driveId,

        created_company_id: companyId,

        created_drive_id: driveId,

        current_step: 6,

        last_saved_at: new Date().toISOString(),

        updated_at: new Date().toISOString(),

        wizard_state: {
          ...(draft.wizard_state ?? {}),
          publishCompleted: true,
          publishedOpportunityId: recruitmentOpportunityId,
          publishedDriveId: driveId,
          publishedCompanyId: companyId,
        },
      })
      .eq("draft_id", draftId);

    return {
      driveId,
      companyId,
    };
  } catch (error) {
    await rollbackPublish(rollbackContext, companyId, driveId);

    throw error;
  }
}
